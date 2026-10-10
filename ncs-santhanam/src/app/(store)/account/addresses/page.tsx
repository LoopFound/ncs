import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { db } from "@/server/db";
import AddressBook from "@/components/account/AddressBook";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  return (
    <AddressBook
      defaultName={user.name}
      addresses={addresses.map((a) => ({
        id: a.id,
        isDefault: a.isDefault,
        fullName: a.fullName,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2 ?? "",
        landmark: a.landmark ?? "",
        city: a.city,
        state: a.state,
        pincode: a.pincode,
      }))}
    />
  );
}
