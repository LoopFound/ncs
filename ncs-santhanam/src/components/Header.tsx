import { getCategoryTree } from "@/server/services/catalog";
import { getCurrentUser, isStaff } from "@/server/session";
import HeaderClient, { type NavItem } from "./HeaderClient";

export default async function Header() {
  const [tree, user] = await Promise.all([getCategoryTree().catch(() => []), getCurrentUser().catch(() => null)]);
  const nav: NavItem[] = tree
    .filter((c) => c.showInNav)
    .map((c) => ({
      label: c.name,
      href: `/${c.path}`,
      children: c.children.filter((s) => s.showInNav).map((s) => ({ label: s.name, href: `/${s.path}` })),
    }));
  return (
    <HeaderClient
      nav={nav}
      user={user ? { name: user.name, isStaff: isStaff(user) } : null}
    />
  );
}
