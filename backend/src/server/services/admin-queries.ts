import { db } from "../db";

/** Category <select> options, children indented under their parents. */
export async function categoryOptions() {
  const cats = await db.category.findMany({ orderBy: [{ path: "asc" }] });
  return cats.map((c) => ({ value: c.id, label: c.path.split("/").length > 1 ? `— ${c.name}` : c.name }));
}
