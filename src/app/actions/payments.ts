"use server";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email-utils";

/**
 * Simulates Stripe pre-authorization of the remaining 70% balance of a booking.
 */
export async function preAuthorizeBalance(bookingId: string) {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const total = Number(booking.totalAmountChf);
    const deposit = Number(booking.depositAmountChf);
    const balance = total - deposit;

    if (balance <= 0) {
      await db.booking.update({
        where: { id: bookingId },
        data: {
          balanceAuthStatus: "authorized",
          balanceAuthAttempts: (booking.balanceAuthAttempts || 0) + 1
        }
      });
      return { success: true };
    }

    // Determine if we simulate failure
    const customerEmail = booking.guestEmail || booking.customer?.email || "";
    const shouldFail = customerEmail === "decline-balance@test.ch" || customerEmail.startsWith("decline");

    if (shouldFail) {
      const attempts = (booking.balanceAuthAttempts || 0) + 1;
      const failedAt = booking.balanceAuthFailedAt || new Date();

      await db.booking.update({
        where: { id: bookingId },
        data: {
          balanceAuthStatus: "failed",
          balanceAuthFailedAt: failedAt,
          balanceAuthAttempts: attempts
        }
      });

      // Log audit trail
      await db.auditLog.create({
        data: {
          action: "balance_auth_failed",
          targetTable: "Booking",
          targetId: bookingId,
          before: JSON.stringify({ attempts: booking.balanceAuthAttempts }),
          after: JSON.stringify({ status: "failed", attempts }),
          actorUserId: null
        }
      });

      return { success: false, error: "Simulated card decline / insufficient funds" };
    }

    // Success path
    await db.booking.update({
      where: { id: bookingId },
      data: {
        balanceAuthStatus: "authorized",
        balanceStripePaymentIntentId: `pi_mock_balance_${Math.random().toString(36).substring(2, 11)}`,
        balanceAuthAttempts: (booking.balanceAuthAttempts || 0) + 1,
        balanceAuthFailedAt: null // clear any prior failure
      }
    });

    // Log audit trail
    await db.auditLog.create({
      data: {
        action: "balance_auth_success",
        targetTable: "Booking",
        targetId: bookingId,
        before: JSON.stringify({ status: booking.balanceAuthStatus }),
        after: JSON.stringify({ status: "authorized" }),
        actorUserId: null
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Background-like process that looks up bookings scheduled in less than 6 days (144 hours)
 * and processes pre-authorizations, daily retries, and 4-day grace period expiration cancellations.
 */
export async function processPreJobAuthorizations() {
  try {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000); // 6 days from now

    // Find active bookings scheduled within 6 days
    const bookings = await db.booking.findMany({
      where: {
        scheduledAt: {
          lte: thresholdDate
        },
        status: {
          notIn: [
            "cancelled_by_customer",
            "cancelled_by_ops",
            "cancelled_no_provider",
            "completed",
            "draft"
          ]
        },
        balanceAuthStatus: {
          in: ["not_attempted", "failed"]
        }
      },
      include: { customer: true }
    });

    const results = [];

    for (const booking of bookings) {
      if (booking.balanceAuthStatus === "failed" && booking.balanceAuthFailedAt) {
        const gracePeriodMs = 4 * 24 * 60 * 60 * 1000; // 4 days (96 hours)
        const elapsed = now.getTime() - booking.balanceAuthFailedAt.getTime();

        if (elapsed >= gracePeriodMs) {
          // Grace period expired! Cancel the booking and forfeit deposit.
          await db.$transaction(async (tx) => {
            await tx.booking.update({
              where: { id: booking.id },
              data: {
                status: "cancelled_by_ops",
                cancellationReason: "Forfeited deposit: Failed to authorize remaining 70% balance after 4 days grace period.",
                balanceAuthStatus: "failed_grace_expired"
              }
            });

            await tx.auditLog.create({
              data: {
                action: "balance_auth_grace_expired_cancellation",
                targetTable: "Booking",
                targetId: booking.id,
                before: JSON.stringify({ status: booking.status, balanceAuthStatus: booking.balanceAuthStatus }),
                after: JSON.stringify({ status: "cancelled_by_ops", balanceAuthStatus: "failed_grace_expired" }),
                actorUserId: null
              }
            });
          });

          results.push({ bookingId: booking.id, action: "cancelled_grace_expired" });
        } else {
          // Inside grace period: attempt retry
          const res = await preAuthorizeBalance(booking.id);
          results.push({ bookingId: booking.id, action: "retry_auth", success: res.success });
        }
      } else {
        // First attempt (not_attempted)
        const res = await preAuthorizeBalance(booking.id);
        results.push({ bookingId: booking.id, action: "first_auth", success: res.success });
      }
    }

    return { success: true, processedCount: bookings.length, results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Captures the authorized balance hold upon job completion.
 */
export async function captureBalance(bookingId: string) {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.balanceAuthStatus !== "authorized") {
      // If balance is already captured, just return success
      if (booking.balanceAuthStatus === "captured") {
        return { success: true };
      }
      // If it wasn't authorized (e.g. booked within short notice or failed), attempt immediate auth + capture
      if (booking.balanceAuthStatus === "not_attempted" || booking.balanceAuthStatus === "failed") {
        const authRes = await preAuthorizeBalance(bookingId);
        if (!authRes.success) {
          throw new Error(`Failed to authorize balance for immediate capture: ${authRes.error}`);
        }
      } else {
        throw new Error(`Cannot capture balance when status is ${booking.balanceAuthStatus}`);
      }
    }

    // Refresh booking record
    const freshBooking = await db.booking.findUnique({
      where: { id: bookingId }
    });
    if (!freshBooking) throw new Error("Booking not found");

    const total = Number(freshBooking.totalAmountChf);
    const deposit = Number(freshBooking.depositAmountChf);
    const balance = total - deposit;

    await db.$transaction(async (tx) => {
      // Create Payment record for balance
      if (balance > 0) {
        await tx.payment.create({
          data: {
            bookingId: freshBooking.id,
            stripeChargeId: `ch_mock_balance_${Math.random().toString(36).substring(2, 11)}`,
            amountChf: balance,
            status: "succeeded",
            refundedAmountChf: 0
          }
        });
      }

      // Update Booking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          balanceAuthStatus: "captured"
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: "balance_captured",
          targetTable: "Booking",
          targetId: bookingId,
          before: JSON.stringify({ balanceAuthStatus: freshBooking.balanceAuthStatus }),
          after: JSON.stringify({ balanceAuthStatus: "captured" }),
          actorUserId: null
        }
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Handles the cancellation of a booking and processes refunds according to the tiered policy:
 * - ≥ 3 days (72h) before job: 100% refund of all payments collected
 * - 2 days (48-72h) before job: 75% refund of all payments collected
 * - 1 day (24-48h) before job: 50% refund of all payments collected
 * - < 24h before job: 0% refund (no return)
 *
 * Also releases the CHF 50 pre-booking hold if still held (not yet captured).
 */
export async function cancelBookingWithRefund(bookingId: string, cancelledBy: "customer" | "ops", reason: string) {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (["cancelled_by_customer", "cancelled_by_ops", "cancelled_no_provider"].includes(booking.status)) {
      return { success: true, message: "Booking is already cancelled" };
    }

    const now = new Date();
    const scheduledAt = new Date(booking.scheduledAt);
    const msUntilJob = scheduledAt.getTime() - now.getTime();
    const hoursUntilJob = msUntilJob / (1000 * 60 * 60);

    // Calculate total already collected from succeeded or partially refunded payments
    const totalCollected = booking.payments
      .filter(p => p.status === "succeeded" || p.status === "partially_refunded")
      .reduce((sum, p) => sum + Number(p.amountChf) - Number(p.refundedAmountChf), 0);

    // Determine refund percentage based on tiered policy
    let refundPercent = 0;
    let policyLabel = "";
    if (hoursUntilJob >= 72) {
      refundPercent = 1.00;   // 100% refund
      policyLabel = "≥3 days before service: 100% refund";
    } else if (hoursUntilJob >= 48) {
      refundPercent = 0.75;   // 75% refund
      policyLabel = "2 days before service: 75% refund";
    } else if (hoursUntilJob >= 24) {
      refundPercent = 0.50;   // 50% refund
      policyLabel = "1 day before service: 50% refund";
    } else {
      refundPercent = 0;      // No refund
      policyLabel = "<24h before service: no refund";
    }

    const refundAmountChf = Math.round(totalCollected * refundPercent * 100) / 100;
    const finalBookingStatus = `cancelled_by_${cancelledBy}`;
    let prebookingHoldAction = "no_change";

    await db.$transaction(async (tx) => {
      // 1. Process refunds on existing payments
      if (refundAmountChf > 0) {
        let remainingRefund = refundAmountChf;

        for (const p of booking.payments) {
          if (remainingRefund <= 0) break;
          if (p.status !== "succeeded" && p.status !== "partially_refunded") continue;

          const available = Number(p.amountChf) - Number(p.refundedAmountChf);
          if (available <= 0) continue;

          const refundForThisPayment = Math.min(available, remainingRefund);
          const newRefundedTotal = Number(p.refundedAmountChf) + refundForThisPayment;

          await tx.payment.update({
            where: { id: p.id },
            data: {
              status: refundForThisPayment >= available ? "refunded" : "partially_refunded",
              refundedAmountChf: Math.round(newRefundedTotal * 100) / 100
            }
          });

          remainingRefund -= refundForThisPayment;
        }
      }

      // 2. Release the CHF 50 pre-booking hold if still held (not yet captured)
      if (booking.prebookingHoldStatus === "held") {
        prebookingHoldAction = "released";
      }

      // 3. Update booking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: finalBookingStatus,
          cancellationReason: `${reason} [${policyLabel}]`,
          prebookingHoldStatus: booking.prebookingHoldStatus === "held" ? "released" : booking.prebookingHoldStatus,
          balanceAuthStatus: "released"
        }
      });

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          action: "cancel_booking_with_refund",
          targetTable: "Booking",
          targetId: bookingId,
          before: JSON.stringify({
            status: booking.status,
            totalCollected,
            prebookingHoldStatus: booking.prebookingHoldStatus
          }),
          after: JSON.stringify({
            status: finalBookingStatus,
            refundPercent: `${refundPercent * 100}%`,
            refundAmountChf,
            retainedAmountChf: Math.round((totalCollected - refundAmountChf) * 100) / 100,
            prebookingHoldAction,
            policy: policyLabel
          }),
          actorUserId: null
        }
      });
    });

    return {
      success: true,
      refundAmountChf,
      retainedAmountChf: Math.round((totalCollected - refundAmountChf) * 100) / 100,
      policy: policyLabel,
      prebookingHoldAction
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 3-PART PAYMENT SPLIT:
 *   1st third: Charged at quote acceptance (CHF 50 pre-auth captured + remainder)
 *   2nd third: Charged on the day of cleaning (this function)
 *   3rd third: Charged after supplier confirms service done (confirmServiceCompletion)
 */

/**
 * Charges the 2nd third (1/3 of total) on the day of the cleaning service.
 * Can be triggered manually by ops or via a cron job on the scheduled date.
 */
export async function chargeDayOfService(bookingId: string) {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const validStatuses = ["confirmed", "offer_dispatched", "offer_accepted", "assigned"];
    if (!validStatuses.includes(booking.status)) {
      throw new Error(`Booking status "${booking.status}" does not allow day-of-service charge`);
    }

    const totalAmount = Number(booking.totalAmountChf);
    const secondThird = Math.round((totalAmount / 3) * 100) / 100;

    await db.$transaction(async (tx) => {
      // 1. Charge the 2nd third
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          stripeChargeId: `ch_mock_day_of_service_${Math.random().toString(36).substring(2, 11)}`,
          amountChf: secondThird,
          status: "succeeded",
          refundedAmountChf: 0
        }
      });

      // 2. Update booking status to in_progress
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "in_progress",
          balanceAuthStatus: "authorized" // 2nd third charged, 3rd pending
        }
      });

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          action: "charge_day_of_service",
          targetTable: "Booking",
          targetId: bookingId,
          before: JSON.stringify({ status: booking.status }),
          after: JSON.stringify({ status: "in_progress", secondThirdCharged: secondThird }),
          actorUserId: "admin_user"
        }
      });
    });

    console.log(`[PAYMENTS] Day-of-service charge for booking ${bookingId}: 2nd third CHF ${secondThird.toFixed(2)}.`);

    return { success: true, amountCharged: secondThird };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Provider checks in upon arrival at the cleaning location ("Veio" timestamp proof).
 * Transitions booking to in_progress and records exact arrival timestamp.
 */
export async function providerCheckInBooking(bookingId: string) {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const validStatuses = ["assigned", "confirmed", "offer_dispatched", "offer_accepted"];
    if (!validStatuses.includes(booking.status) && booking.status !== "in_progress") {
      throw new Error(`Booking status "${booking.status}" cannot be checked in`);
    }

    const now = new Date();

    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "in_progress",
          checkInAt: booking.checkInAt || now
        }
      });

      await tx.auditLog.create({
        data: {
          action: "provider_check_in",
          targetTable: "Booking",
          targetId: bookingId,
          before: JSON.stringify({ status: booking.status, checkInAt: booking.checkInAt }),
          after: JSON.stringify({ status: "in_progress", checkInAt: now }),
          actorUserId: null
        }
      });
    });

    console.log(`[PROVIDER] Check-in logged for booking ${bookingId} at ${now.toISOString()}`);
    return { success: true, checkInAt: now };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Provider submits completion with proof of presence (photos & notes).
 * Charges remaining balance, updates payouts, and marks booking completed.
 * Eliminates "veio / não veio" disputes.
 */
export async function providerCompleteBookingWithProof(payload: {
  bookingId: string;
  photos?: string[];
  notes?: string;
}) {
  try {
    const { bookingId, photos = [], notes } = payload;
    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: true,
        commissionLedgers: true,
        payouts: true
      }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const totalAmount = Number(booking.totalAmountChf);
    const totalCollected = booking.payments
      .filter(p => p.status === "succeeded" || p.status === "partially_refunded")
      .reduce((sum, p) => sum + Number(p.amountChf) - Number(p.refundedAmountChf), 0);

    const balanceToCharge = Math.max(0, Math.round((totalAmount - totalCollected) * 100) / 100);
    const now = new Date();

    await db.$transaction(async (tx) => {
      // 1. Charge remaining balance if applicable
      if (balanceToCharge > 0) {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            stripeChargeId: `ch_mock_final_balance_${Math.random().toString(36).substring(2, 11)}`,
            amountChf: balanceToCharge,
            status: "succeeded",
            refundedAmountChf: 0
          }
        });
      }

      // 2. Mark booking completed with proof
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "completed",
          balanceAuthStatus: "captured",
          checkInAt: booking.checkInAt || now,
          completedAt: now,
          completionPhotos: JSON.stringify(photos),
          completionNotes: notes || null
        }
      });

      // 3. Move payouts to in_transit
      const pendingPayouts = booking.payouts.filter(p => p.status === "scheduled");
      for (const payout of pendingPayouts) {
        await tx.payout.update({
          where: { id: payout.id },
          data: { status: "in_transit" }
        });
      }

      // 4. Settle commission ledger
      const unsettled = booking.commissionLedgers.filter(cl => !cl.settledAt);
      for (const ledger of unsettled) {
        await tx.commissionLedger.update({
          where: { id: ledger.id },
          data: { settledAt: now }
        });
      }

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          action: "provider_complete_with_proof",
          targetTable: "Booking",
          targetId: bookingId,
          before: JSON.stringify({ status: booking.status, totalCollected }),
          after: JSON.stringify({
            status: "completed",
            balanceCharged: balanceToCharge,
            photosCount: photos.length,
            completedAt: now
          }),
          actorUserId: null
        }
      });
    });

    // Send customer completion confirmation & receipt email
    if (booking.guestEmail) {
      try {
        await sendEmail({
          to: booking.guestEmail,
          subject: `Mondar - Service Completed & Receipt (${booking.id.slice(0, 8).toUpperCase()})`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; background-color: #080808; color: #f2f2f2; border: 1px solid #262626; border-radius: 8px; max-width: 540px; margin: auto;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 11px; letter-spacing: 0.2em; color: #b59410; font-weight: 700; text-transform: uppercase;">Mondar Specialty Cleaning</span>
                <h2 style="color: #22c55e; letter-spacing: 0.05em; font-weight: 500; margin: 8px 0 0 0; font-size: 24px;">✓ Cleaning Completed</h2>
              </div>
              <p style="font-size: 14px; color: #a6a6a6; line-height: 1.6; text-align: center; margin-bottom: 24px;">
                Your cleaning service has been completed by our verified specialists. The remaining balance of CHF ${balanceToCharge.toFixed(2)} has been charged to your card.
              </p>
              <div style="background-color: #141414; border: 1px solid #262626; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #f2f2f2;">
                  <tr>
                    <td style="padding: 6px 0; color: #737373;">Booking ID:</td>
                    <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #b59410;">${booking.id.slice(0, 8).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #737373;">Total Paid:</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #22c55e;">CHF ${totalAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #737373;">Completed At:</td>
                    <td style="padding: 6px 0; text-align: right;">${now.toLocaleDateString("de-CH")} ${now.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}</td>
                  </tr>
                  ${notes ? `
                  <tr>
                    <td style="padding: 6px 0; color: #737373;">Provider Note:</td>
                    <td style="padding: 6px 0; text-align: right;">${notes}</td>
                  </tr>
                  ` : ""}
                </table>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 12px; color: #737373;">Thank you for trusting Mondar. Questions? Contact <a href="mailto:ops@mondar.ch" style="color: #b59410; text-decoration: none;">ops@mondar.ch</a>.</p>
              </div>
            </div>
          `
        });
      } catch (emailErr) {
        console.error("[PAYMENTS] Failed to send customer completion email:", emailErr);
      }
    }

    console.log(`[PAYMENTS] Booking ${bookingId} completed with proof. Balance CHF ${balanceToCharge.toFixed(2)} charged.`);
    return { success: true, balanceCharged: balanceToCharge, remainingCharged: balanceToCharge };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Confirms service completion and charges the remaining balance.
 * Called by ops or system after service is completed.
 */
export async function confirmServiceCompletion(bookingId: string) {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: true,
        commissionLedgers: true,
        payouts: true
      }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const totalAmount = Number(booking.totalAmountChf);
    const totalCollected = booking.payments
      .filter(p => p.status === "succeeded" || p.status === "partially_refunded")
      .reduce((sum, p) => sum + Number(p.amountChf) - Number(p.refundedAmountChf), 0);

    const balanceToCharge = Math.max(0, Math.round((totalAmount - totalCollected) * 100) / 100);
    const now = new Date();

    await db.$transaction(async (tx) => {
      // 1. Charge remaining balance if any
      if (balanceToCharge > 0) {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            stripeChargeId: `ch_mock_final_balance_${Math.random().toString(36).substring(2, 11)}`,
            amountChf: balanceToCharge,
            status: "succeeded",
            refundedAmountChf: 0
          }
        });
      }

      // 2. Update booking status to completed
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "completed",
          balanceAuthStatus: "captured",
          completedAt: booking.completedAt || now
        }
      });

      // 3. Update any pending payouts to in_transit
      const pendingPayouts = booking.payouts.filter(p => p.status === "scheduled");
      for (const payout of pendingPayouts) {
        await tx.payout.update({
          where: { id: payout.id },
          data: {
            status: "in_transit"
          }
        });
      }

      // 4. Settle commission ledger
      const unsettled = booking.commissionLedgers.filter(cl => !cl.settledAt);
      for (const ledger of unsettled) {
        await tx.commissionLedger.update({
          where: { id: ledger.id },
          data: {
            settledAt: now
          }
        });
      }

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          action: "confirm_service_completion",
          targetTable: "Booking",
          targetId: bookingId,
          before: JSON.stringify({ status: booking.status, totalCollected }),
          after: JSON.stringify({ status: "completed", finalBalanceCharged: balanceToCharge }),
          actorUserId: "admin_user"
        }
      });
    });

    console.log(`[PAYMENTS] Service completed for booking ${bookingId}. Balance CHF ${balanceToCharge.toFixed(2)} charged. Total: CHF ${totalAmount.toFixed(2)}.`);

    return { success: true, finalThirdCharged: balanceToCharge, balanceCharged: balanceToCharge };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
