import { db, type Prisma } from "./db";
import { logger, errorInfo } from "./logger";

/** Records an admin/staff action. Never throws — auditing must not break the action itself. */
export async function audit(actorId: string | null, action: string, entity: string, entityId?: string | null, data?: Prisma.InputJsonValue) {
  try {
    await db.auditLog.create({ data: { actorId, action, entity, entityId: entityId ?? null, data } });
  } catch (err) {
    logger.error({ ...errorInfo(err), action, entity, entityId }, "audit log write failed");
  }
}
