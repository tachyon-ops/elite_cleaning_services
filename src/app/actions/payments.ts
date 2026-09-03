import { db } from "@/lib/db";

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
 * Handles the cancellation of a booking and processes refunds and hold releases according to the timeline:
 * - > 7 days before job: 100% refund of deposit, release 70% hold.
 * - 7 days to 48h before job: 70% refund of total (forfeit 30% deposit, release 70% hold).
 * - < 48h before job: 0% refund of total (forfeit 100% total, capture 70% hold).
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

    const total = Number(booking.totalAmountChf);
    const deposit = Number(booking.depositAmountChf);
    const balance = total - deposit;

    let refundAmountChf = 0;
    let finalAuthStatus = booking.balanceAuthStatus;
    const finalBookingStatus = `cancelled_by_${cancelledBy}`;

    await db.$transaction(async (tx) => {
      if (hoursUntilJob > 7 * 24) {
        // CASE 1: > 7 days before job -> 100% refund of deposit, release hold
        refundAmountChf = deposit;

        // Refund existing succeeded payments (which should represent the deposit)
        for (const p of booking.payments) {
          if (p.status === "succeeded" && Number(p.refundedAmountChf) < Number(p.amountChf)) {
            await tx.payment.update({
              where: { id: p.id },
              data: {
                status: "refunded",
                refundedAmountChf: p.amountChf
              }
            });
          }
        }

        // Release the 70% balance hold if authorized
        if (booking.balanceAuthStatus === "authorized") {
          finalAuthStatus = "released";
        }
      } 
      else if (hoursUntilJob <= 7 * 24 && hoursUntilJob > 48) {
        // CASE 2: Between 7 days and 48h before job -> 70% refund of total (keep deposit, release hold)
        refundAmountChf = 0; // Deposit is kept

        // Release the 70% balance hold
        if (booking.balanceAuthStatus === "authorized") {
          finalAuthStatus = "released";
        }
      } 
      else {
        // CASE 3: Within 48h before job -> 0% refund of total (keep deposit, capture hold)
        refundAmountChf = 0;

        // Capture the 70% balance hold if authorized
        if (booking.balanceAuthStatus === "authorized") {
          if (balance > 0) {
            await tx.payment.create({
              data: {
                bookingId: booking.id,
                stripeChargeId: `ch_mock_balance_cancel_${Math.random().toString(36).substring(2, 11)}`,
                amountChf: balance,
                status: "succeeded",
                refundedAmountChf: 0
              }
            });
          }
          finalAuthStatus = "captured";
        } else if (booking.balanceAuthStatus === "not_attempted" || booking.balanceAuthStatus === "failed") {
          // If not authorized yet, attempt to charge immediately
          const customerEmail = booking.guestEmail || "";
          const isDecline = customerEmail === "decline-balance@test.ch" || customerEmail.startsWith("decline");

          if (!isDecline && balance > 0) {
            await tx.payment.create({
              data: {
                bookingId: booking.id,
                stripeChargeId: `ch_mock_balance_charge_${Math.random().toString(36).substring(2, 11)}`,
                amountChf: balance,
                status: "succeeded",
                refundedAmountChf: 0
              }
            });
            finalAuthStatus = "captured";
          } else {
            finalAuthStatus = "failed";
          }
        }
      }

      // Update Booking details
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: finalBookingStatus,
          cancellationReason: reason,
          balanceAuthStatus: finalAuthStatus
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: "cancel_booking_with_refund",
          targetTable: "Booking",
          targetId: bookingId,
          before: JSON.stringify({ status: booking.status, balanceAuthStatus: booking.balanceAuthStatus }),
          after: JSON.stringify({ status: finalBookingStatus, balanceAuthStatus: finalAuthStatus, refundAmountChf }),
          actorUserId: null
        }
      });
    });

    return { success: true, refundAmountChf, balanceAuthStatus: finalAuthStatus };
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
 * Confirms service completion and charges the final 1/3 balance.
 * Called by ops after the supplier confirms the service was performed.
 */
export async function confirmServiceCompletion(bookingId: string) {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        quote: true,
        commissionLedgers: true,
        payouts: true
      }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Must be in_progress (day-of-service charge already done)
    if (booking.status !== "in_progress") {
      throw new Error(`Booking must be in "in_progress" status. Current: "${booking.status}"`);
    }

    const totalAmount = Number(booking.totalAmountChf);
    // Final 1/3 = total minus the two thirds already charged
    const firstThird = Number(booking.depositAmountChf); // charged at acceptance
    const secondThird = Math.round((totalAmount / 3) * 100) / 100; // charged on cleaning day
    const finalThird = Math.round((totalAmount - firstThird - secondThird) * 100) / 100;

    await db.$transaction(async (tx) => {
      // 1. Charge the final 1/3
      if (finalThird > 0) {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            stripeChargeId: `ch_mock_final_third_${Math.random().toString(36).substring(2, 11)}`,
            amountChf: finalThird,
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
          balanceAuthStatus: "captured"
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
            settledAt: new Date()
          }
        });
      }

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          action: "confirm_service_completion",
          targetTable: "Booking",
          targetId: bookingId,
          before: JSON.stringify({ status: booking.status }),
          after: JSON.stringify({ status: "completed", finalThirdCharged: finalThird }),
          actorUserId: "admin_user"
        }
      });
    });

    console.log(`[PAYMENTS] Service completed for booking ${bookingId}. Final 1/3 CHF ${finalThird.toFixed(2)} charged. Total: CHF ${totalAmount.toFixed(2)}.`);

    return { success: true, finalThirdCharged: finalThird };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
