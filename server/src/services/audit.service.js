import AuditLog from '../models/AuditLog.js';

function clientIp(req) {
  return req.ip ?? req.socket?.remoteAddress ?? null;
}

export async function recordAudit(req, entry) {
  return AuditLog.create({
    actor: req.user?.id ?? null,
    actorEmail: req.user?.email ?? null,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId ? String(entry.targetId) : null,
    summary: entry.summary,
    metadata: entry.metadata ?? {},
    requestId: req.id ?? null,
    ip: clientIp(req),
    userAgent: req.get?.('user-agent') ?? null,
  });
}

export async function listAuditLogs(query) {
  const filter = {};
  if (query.action) filter.action = query.action;
  if (query.targetType) filter.targetType = query.targetType;
  if (query.actorId) filter.actor = query.actorId;

  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs: logs.map((log) => log.toJSON()),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export default recordAudit;
