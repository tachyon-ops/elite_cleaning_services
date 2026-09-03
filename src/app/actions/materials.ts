"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";

async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "true";
}

export async function addMaterialLineItem(args: {
  bookingId?: string;
  contractId?: string;
  jobOccurrenceId?: string;
  description: string;
  quantity: number;
  unitPriceChf: number;
  supplierNote?: string;
  billingPeriodMonth: number;
  billingPeriodYear: number;
}) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const {
      bookingId,
      contractId,
      jobOccurrenceId,
      description,
      quantity,
      unitPriceChf,
      supplierNote,
      billingPeriodMonth,
      billingPeriodYear,
    } = args;

    if (!bookingId && !contractId) {
      return { success: false, error: "Must provide either bookingId or contractId" };
    }

    const totalPriceChf = Math.round(quantity * unitPriceChf * 100) / 100;

    let approvalMode = "trust";

    if (bookingId) {
      const booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: { customer: true },
      });
      if (booking?.customer?.materialApprovalMode) {
        approvalMode = booking.customer.materialApprovalMode;
      }
    } else if (contractId) {
      const contract = await db.serviceContract.findUnique({
        where: { id: contractId },
        include: { organization: true },
      });
      if (contract?.organization?.materialApprovalMode) {
        approvalMode = contract.organization.materialApprovalMode;
      }
    }

    const approvalStatus = approvalMode === "trust" ? "auto_approved" : "pending_approval";

    const lineItem = await db.materialLineItem.create({
      data: {
        bookingId,
        contractId,
        jobOccurrenceId,
        description,
        quantity,
        unitPriceChf,
        totalPriceChf,
        supplierNote,
        billingPeriodMonth,
        billingPeriodYear,
        approvalStatus,
        ...(approvalStatus === "auto_approved" ? { approvedAt: new Date() } : {}),
      },
    });

    return { success: true, lineItem };
  } catch (error: any) {
    console.error("Error adding material line item:", error);
    return { success: false, error: error.message || "Failed to add material line item" };
  }
}

export async function getMaterialLineItems(args: {
  bookingId?: string;
  contractId?: string;
  billingPeriodMonth?: number;
  billingPeriodYear?: number;
}) {
  try {
    const items = await db.materialLineItem.findMany({
      where: {
        ...(args.bookingId ? { bookingId: args.bookingId } : {}),
        ...(args.contractId ? { contractId: args.contractId } : {}),
        ...(args.billingPeriodMonth ? { billingPeriodMonth: args.billingPeriodMonth } : {}),
        ...(args.billingPeriodYear ? { billingPeriodYear: args.billingPeriodYear } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        invoice: true,
      },
    });
    return { success: true, items };
  } catch (error: any) {
    console.error("Error fetching material line items:", error);
    return { success: false, error: error.message || "Failed to fetch material line items" };
  }
}

export async function removeMaterialLineItem(lineItemId: string) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const item = await db.materialLineItem.findUnique({
      where: { id: lineItemId },
      include: { invoice: true },
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    if (item.invoice && item.invoice.status !== "draft") {
      return { success: false, error: "Cannot remove line item linked to a non-draft invoice" };
    }

    await db.materialLineItem.delete({
      where: { id: lineItemId },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error removing material line item:", error);
    return { success: false, error: error.message || "Failed to remove material line item" };
  }
}

export async function generateMonthlyInvoice(args: {
  customerId?: string;
  organizationId?: string;
  billingPeriodMonth: number;
  billingPeriodYear: number;
}) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const { customerId, organizationId, billingPeriodMonth, billingPeriodYear } = args;

    if (!customerId && !organizationId) {
      return { success: false, error: "Must provide either customerId or organizationId" };
    }

    let paymentMethod = "card";
    let serviceAmountChf = 0;
    
    if (customerId) {
      const startOfMonth = new Date(billingPeriodYear, billingPeriodMonth - 1, 1);
      const endOfMonth = new Date(billingPeriodYear, billingPeriodMonth, 0, 23, 59, 59, 999);
      
      const bookings = await db.booking.findMany({
        where: {
          customerId,
          status: "completed",
          scheduledAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          }
        }
      });
      serviceAmountChf = bookings.reduce((sum, b) => sum + Number(b.totalAmountChf), 0);
    } else if (organizationId) {
      const contracts = await db.serviceContract.findMany({
        where: {
          organizationId,
          status: "active",
        }
      });
      serviceAmountChf = contracts.reduce((sum, c) => sum + Number(c.priceChf), 0);
      
      const org = await db.organization.findUnique({
        where: { id: organizationId }
      });
      if (org?.paymentTerms === "invoice_net30") {
        paymentMethod = "invoice_net30";
      }
    }

    let invoice = await db.monthlyInvoice.findFirst({
      where: {
        billingPeriodMonth,
        billingPeriodYear,
        ...(customerId ? { customerId } : {}),
        ...(organizationId ? { organizationId } : {}),
      },
    });

    const invoiceId = invoice?.id;

    const lineItems = await db.materialLineItem.findMany({
      where: {
        billingPeriodMonth,
        billingPeriodYear,
        approvalStatus: { in: ["approved", "auto_approved"] },
        OR: [
          { invoiceId: null },
          ...(invoiceId ? [{ invoiceId }] : []),
        ],
        ...(customerId ? { booking: { customerId } } : {}),
        ...(organizationId ? { contract: { organizationId } } : {}),
      },
    });

    const materialsAmountChf = Math.round(lineItems.reduce((acc, item) => acc + Number(item.totalPriceChf), 0) * 100) / 100;
    const totalAmountChf = Math.round((serviceAmountChf + materialsAmountChf) * 100) / 100;

    if (invoice) {
      invoice = await db.monthlyInvoice.update({
        where: { id: invoice.id },
        data: {
          serviceAmountChf,
          materialsAmountChf,
          totalAmountChf,
        },
      });
    } else {
      invoice = await db.monthlyInvoice.create({
        data: {
          customerId,
          organizationId,
          billingPeriodMonth,
          billingPeriodYear,
          serviceAmountChf,
          materialsAmountChf,
          totalAmountChf,
          status: "draft",
          paymentMethod,
        },
      });
    }

    const unlinkedItemIds = lineItems.filter(i => i.invoiceId === null).map(i => i.id);
    if (unlinkedItemIds.length > 0) {
      await db.materialLineItem.updateMany({
        where: { id: { in: unlinkedItemIds } },
        data: { invoiceId: invoice.id },
      });
    }

    return { success: true, invoice };
  } catch (error: any) {
    console.error("Error generating monthly invoice:", error);
    return { success: false, error: error.message || "Failed to generate monthly invoice" };
  }
}

export async function getMonthlyInvoices(args: {
  customerId?: string;
  organizationId?: string;
  status?: string;
  year?: number;
}) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const invoices = await db.monthlyInvoice.findMany({
      where: {
        ...(args.customerId ? { customerId: args.customerId } : {}),
        ...(args.organizationId ? { organizationId: args.organizationId } : {}),
        ...(args.status ? { status: args.status } : {}),
        ...(args.year ? { billingPeriodYear: args.year } : {}),
      },
      include: {
        customer: true,
        organization: true,
        _count: {
          select: { lineItems: true },
        },
      },
      orderBy: [
        { billingPeriodYear: "desc" },
        { billingPeriodMonth: "desc" },
      ],
    });

    return { success: true, invoices };
  } catch (error: any) {
    console.error("Error fetching monthly invoices:", error);
    return { success: false, error: error.message || "Failed to fetch monthly invoices" };
  }
}

export async function updateInvoiceStatus(args: {
  invoiceId: string;
  status: string;
}) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const invoice = await db.monthlyInvoice.findUnique({
      where: { id: args.invoiceId },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    let updateData: any = { status: args.status };

    if (args.status === "sent") {
      updateData.sentAt = new Date();
      const dueDays = invoice.paymentMethod === "invoice_net30" ? 30 : 7;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDays);
      updateData.dueAt = dueDate;
    } else if (args.status === "paid") {
      updateData.paidAt = new Date();
    }

    const updatedInvoice = await db.monthlyInvoice.update({
      where: { id: args.invoiceId },
      data: updateData,
    });

    return { success: true, invoice: updatedInvoice };
  } catch (error: any) {
    console.error("Error updating invoice status:", error);
    return { success: false, error: error.message || "Failed to update invoice status" };
  }
}
