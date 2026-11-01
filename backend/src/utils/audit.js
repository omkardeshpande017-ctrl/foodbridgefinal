import AuditLog from '../models/AuditLog.js';

// Fire-and-forget audit trail. Never throws into the request path.
export async function audit(req, action, { entity, entityId, meta } = {}) {
  try {
    await AuditLog.create({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      meta,
      ip: req.ip,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 200)
    });
  } catch (e) {
    console.error('audit log failed', e.message);
  }
}

export default audit;
