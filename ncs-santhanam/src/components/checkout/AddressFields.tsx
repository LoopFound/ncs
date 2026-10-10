"use client";

import { INDIAN_STATES } from "@/lib/india";

export interface AddressValues {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

export const emptyAddress = (name = "", phone = ""): AddressValues => ({
  fullName: name,
  phone: phone.replace(/^\+91/, ""),
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "Tamil Nadu",
  pincode: "",
});

const input =
  "w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded focus:outline-none focus:border-[var(--gold)] aria-[invalid=true]:border-red-500";
const label = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-1";

interface Props {
  values: AddressValues;
  onChange: (v: AddressValues) => void;
  errors?: Record<string, string>;
  prefix?: string; // error key prefix, e.g. "address."
}

export default function AddressFields({ values, onChange, errors = {}, prefix = "" }: Props) {
  const set = (k: keyof AddressValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...values, [k]: e.target.value });
  const err = (k: string) => errors[`${prefix}${k}`];

  const field = (k: keyof AddressValues, text: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, wide = false) => (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={`addr-${k}`} className={label}>
        {text}
      </label>
      <input id={`addr-${k}`} value={values[k]} onChange={set(k)} aria-invalid={Boolean(err(k))} aria-describedby={err(k) ? `addr-${k}-err` : undefined} className={input} {...props} />
      {err(k) && (
        <p id={`addr-${k}-err`} className="text-xs text-red-700 mt-1 !mb-0">
          {err(k)}
        </p>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      {field("fullName", "Full name *", { required: true, autoComplete: "name", maxLength: 80 }, true)}
      {field("phone", "Mobile number *", { required: true, type: "tel", inputMode: "numeric", autoComplete: "tel-national", placeholder: "10-digit mobile", maxLength: 14 })}
      {field("pincode", "PIN code *", { required: true, inputMode: "numeric", autoComplete: "postal-code", pattern: "[1-9][0-9]{5}", maxLength: 6 })}
      {field("line1", "House / flat no., street *", { required: true, autoComplete: "address-line1", maxLength: 120 }, true)}
      {field("line2", "Area / locality", { autoComplete: "address-line2", maxLength: 120 })}
      {field("landmark", "Landmark", { maxLength: 80 })}
      {field("city", "City *", { required: true, autoComplete: "address-level2", maxLength: 60 })}
      <div>
        <label htmlFor="addr-state" className={label}>
          State *
        </label>
        <select id="addr-state" value={values.state} onChange={set("state")} className={input} autoComplete="address-level1" aria-invalid={Boolean(err("state"))}>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {err("state") && <p className="text-xs text-red-700 mt-1 !mb-0">{err("state")}</p>}
      </div>
    </div>
  );
}
