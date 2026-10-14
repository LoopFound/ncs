import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { db } from "../db";
import { putPrivateObject } from "../storage";
import { getStoreInfo } from "./content";

/** Indian financial year label for a date, e.g. 2026-10-10 → "2026-27". */
export function financialYear(d: Date): string {
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

// Standard PDF fonts cannot render "₹", so invoices use "Rs.".
const rs = (paise: number) =>
  `Rs. ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

/** Generates (once) the GST tax invoice for an order and stores it in the private bucket. */
export async function generateInvoice(orderId: string): Promise<{ key: string; number: string }> {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error(`Order ${orderId} not found`);
  if (order.invoiceKey && order.invoiceNumber) return { key: order.invoiceKey, number: order.invoiceNumber };
  if (order.status === "PENDING_PAYMENT" || order.status === "CANCELLED") throw new Error("Order is not invoiceable");

  const store = await getStoreInfo();
  const [{ n }] = await db.$queryRaw<{ n: bigint }[]>`SELECT nextval('invoice_number_seq') AS n`;
  const issuedAt = new Date();
  const number = `NCS/${financialYear(issuedAt)}/${String(n).padStart(6, "0")}`;
  const ship = order.shippingAddress as unknown as ShippingAddress;
  const intraState = ship.state.trim().toLowerCase() === store.state.trim().toLowerCase();

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Tax Invoice ${number}`);
  pdf.setAuthor(store.legalName);
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.043, 0.106, 0.302);

  let y = 800;
  const text = (s: string, x: number, size = 9, f: PDFFont = font, p: PDFPage = page) => p.drawText(s, { x, y, size, font: f, color: navy });
  const right = (s: string, xRight: number, size = 9, f: PDFFont = font) => page.drawText(s, { x: xRight - f.widthOfTextAtSize(s, size), y, size, font: f, color: navy });

  text(store.legalName, 40, 16, bold);
  right("TAX INVOICE", 555, 14, bold);
  y -= 16;
  text(`${store.addressLine}, ${store.city}, ${store.state} - ${store.pincode}`, 40);
  right(`Invoice No: ${number}`, 555);
  y -= 12;
  text(`GSTIN: ${store.gstin ?? "Not configured"}`, 40);
  right(`Date: ${issuedAt.toLocaleDateString("en-IN")}`, 555);
  y -= 12;
  right(`Order: ${order.number}`, 555);

  y -= 28;
  text("Bill / Ship to", 40, 10, bold);
  text(`Place of supply: ${ship.state}`, 330, 10, bold);
  for (const line of [
    ship.fullName,
    [ship.line1, ship.line2].filter(Boolean).join(", "),
    [ship.landmark, `${ship.city}, ${ship.state} - ${ship.pincode}`].filter(Boolean).join(", "),
    `Phone: ${ship.phone}`,
  ]) {
    y -= 13;
    text(line.slice(0, 90), 40);
  }

  // Line items
  y -= 30;
  const cols = { item: 40, hsn: 250, qty: 300, taxable: 400, tax: 480, total: 555 };
  page.drawRectangle({ x: 36, y: y - 5, width: 523, height: 18, color: rgb(0.96, 0.95, 0.91) });
  text("Item", cols.item, 9, bold);
  text("HSN", cols.hsn, 9, bold);
  right("Qty", cols.qty + 20, 9, bold);
  right("Taxable value", cols.taxable, 9, bold);
  right(intraState ? "CGST+SGST" : "IGST", cols.tax, 9, bold);
  right("Amount", cols.total, 9, bold);

  let taxable = 0;
  for (const item of order.items) {
    y -= 18;
    const itemTaxable = item.lineTotal - item.taxAmount;
    taxable += itemTaxable;
    text(item.productName.slice(0, 42), cols.item);
    text(item.hsnCode, cols.hsn);
    right(String(item.quantity), cols.qty + 20);
    right(rs(itemTaxable), cols.taxable);
    right(`${rs(item.taxAmount)} (${item.gstRateBps / 100}%)`, cols.tax);
    right(rs(item.lineTotal), cols.total);
  }

  const charges = order.shippingTotal + order.codFee;
  const itemsTax = order.items.reduce((a, i) => a + i.taxAmount, 0);
  const chargesTax = order.taxTotal - itemsTax;
  if (charges > 0) {
    y -= 18;
    text("Delivery / COD charges", cols.item);
    right(rs(charges - chargesTax), cols.taxable);
    right(rs(chargesTax), cols.tax);
    right(rs(charges), cols.total);
    taxable += charges - chargesTax;
  }

  y -= 12;
  page.drawLine({ start: { x: 36, y }, end: { x: 559, y }, thickness: 0.5, color: navy });
  const summary: [string, string][] = [["Taxable value", rs(taxable)]];
  if (intraState) {
    const cgst = Math.floor(order.taxTotal / 2);
    summary.push(["CGST", rs(cgst)], ["SGST", rs(order.taxTotal - cgst)]);
  } else {
    summary.push(["IGST", rs(order.taxTotal)]);
  }
  if (order.discountTotal > 0) summary.push([`Discount (${order.couponCode ?? "coupon"}) — already applied`, `- ${rs(order.discountTotal)}`]);
  summary.push(["Grand total (incl. GST)", rs(order.grandTotal)]);
  for (const [label, value] of summary) {
    y -= 15;
    const isTotal = label.startsWith("Grand");
    right(label, 470, isTotal ? 10 : 9, isTotal ? bold : font);
    right(value, 555, isTotal ? 10 : 9, isTotal ? bold : font);
  }

  y -= 40;
  text(`Payment: ${order.paymentMethod === "COD" ? "Cash on delivery" : "Online (Razorpay)"} · Status: ${order.paymentStatus}`, 40);
  y -= 13;
  text("This is a computer-generated invoice and does not require a signature.", 40, 8);

  const bytes = await pdf.save();
  const key = `invoices/${financialYear(issuedAt)}/${order.number}.pdf`;
  await putPrivateObject(key, bytes, "application/pdf");

  // Guard against a concurrent generation having already stamped a number.
  const { count } = await db.order.updateMany({
    where: { id: order.id, invoiceNumber: null },
    data: { invoiceNumber: number, invoiceKey: key },
  });
  if (count === 0) {
    const existing = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    return { key: existing.invoiceKey!, number: existing.invoiceNumber! };
  }
  return { key, number };
}
