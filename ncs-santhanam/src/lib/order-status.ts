const LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  PROCESSING: "Being prepared",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return requested",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

export const statusLabel = (status: string) => LABELS[status] ?? status;

export const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
};

export const statusTone = (status: string) =>
  status === "CANCELLED" || status === "REFUNDED"
    ? "bg-red-50 text-red-800 border-red-200"
    : status === "DELIVERED"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : status === "PENDING_PAYMENT" || status === "RETURN_REQUESTED"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : "bg-sky-50 text-sky-900 border-sky-200";
