"use client";

import ActionForm from "./ActionForm";
import { saveCategoryAction } from "@/server/actions/admin/catalog";
import { saveBannerAction, saveCouponAction, saveShippingRuleAction, saveStoreSettingsAction } from "@/server/actions/admin/content";

const actions = {
  category: saveCategoryAction,
  coupon: saveCouponAction,
  banner: saveBannerAction,
  shippingRule: saveShippingRuleAction,
  settings: (fd: FormData) => saveStoreSettingsAction(fd),
} as const;

/**
 * Lets server components render admin forms bound to an action by name
 * (server components can't pass functions with bound ids to client components).
 */
export default function ActionFormBound({
  kind,
  id,
  children,
  resetOnSuccess,
  submitLabel,
}: {
  kind: keyof typeof actions;
  id?: string;
  children: React.ReactNode;
  resetOnSuccess?: boolean;
  submitLabel?: string;
}) {
  const action = actions[kind] as (fd: FormData, id?: string) => ReturnType<typeof saveCategoryAction>;
  return (
    <ActionForm action={(fd) => action(fd, id)} resetOnSuccess={resetOnSuccess} submitLabel={submitLabel ?? (id ? "Save" : "Create")}>
      {children}
    </ActionForm>
  );
}
