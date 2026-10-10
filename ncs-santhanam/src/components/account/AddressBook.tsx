"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from "@/server/actions/account";
import AddressFields, { emptyAddress, type AddressValues } from "@/components/checkout/AddressFields";

interface Saved extends AddressValues {
  id: string;
  isDefault: boolean;
}

export default function AddressBook({ addresses, defaultName }: { addresses: Saved[]; defaultName: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(addresses.length === 0 ? "new" : null);
  const [values, setValues] = useState<AddressValues>(emptyAddress(defaultName));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const edit = (a?: Saved) => {
    setErrors({});
    setError(null);
    if (a) {
      const { id, isDefault: _d, ...rest } = a;
      setValues({ ...rest, phone: rest.phone.replace(/^\+91/, "") });
      setEditing(id);
    } else {
      setValues(emptyAddress(defaultName));
      setEditing("new");
    }
  };

  return (
    <div className="space-y-4">
      {addresses.map((a) =>
        editing === a.id ? null : (
          <div key={a.id} className="bg-white p-6 border border-[var(--border)] flex flex-col sm:flex-row justify-between gap-4">
            <address className="not-italic text-sm text-[var(--text-body)]">
              <strong className="text-[var(--navy)]">{a.fullName}</strong>
              {a.isDefault && <span className="ml-2 text-[10px] uppercase tracking-widest px-2 py-0.5 bg-[var(--cream)] text-[var(--gold-text)]">Default</span>}
              <br />
              {[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}
              <br />
              {a.city}, {a.state} – {a.pincode}
              <br />
              {a.phone}
            </address>
            <div className="flex sm:flex-col gap-2 text-xs uppercase tracking-widest">
              <button type="button" onClick={() => edit(a)} className="text-[var(--navy)] hover:underline text-left">
                Edit
              </button>
              {!a.isDefault && (
                <button type="button" disabled={pending} onClick={() => start(async () => { await setDefaultAddressAction(a.id); router.refresh(); })} className="text-[var(--navy)] hover:underline text-left">
                  Make default
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Delete this address?")) start(async () => { await deleteAddressAction(a.id); router.refresh(); });
                }}
                className="text-[var(--maroon)] hover:underline text-left"
              >
                Delete
              </button>
            </div>
          </div>
        ),
      )}

      {editing ? (
        <form
          className="bg-white p-6 border border-[var(--gold)]"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await saveAddressAction(values, editing === "new" ? undefined : editing);
              if (!r.ok) {
                setError(r.error);
                setErrors(r.fields ?? {});
                return;
              }
              setEditing(null);
              router.refresh();
            });
          }}
        >
          <h2 className="font-serif !text-xl text-[var(--navy)] mb-4">{editing === "new" ? "Add an address" : "Edit address"}</h2>
          <AddressFields values={values} onChange={setValues} errors={errors} />
          {error && <p role="alert" className="text-sm text-red-700 mt-3">{error}</p>}
          <div className="flex gap-3 mt-5">
            <button type="submit" disabled={pending} className="px-6 py-3 bg-[var(--navy)] text-white text-xs uppercase tracking-widest disabled:opacity-60">
              {pending ? "Saving…" : "Save address"}
            </button>
            {addresses.length > 0 && (
              <button type="button" onClick={() => setEditing(null)} className="px-6 py-3 border border-[var(--border)] text-xs uppercase tracking-widest">
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => edit()} className="px-6 py-3 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest hover:bg-[var(--navy)] hover:text-white">
          + Add a new address
        </button>
      )}
    </div>
  );
}
