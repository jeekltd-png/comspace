import AuditLog from '../models/auditLog.model';
import { parseUserAgent, getClientIp } from './device-parser';
import { logger } from './logger';

interface AuditEntry {
  actor: any; // User object or ID
  action: string;
  category: 'auth' | 'user_management' | 'order' | 'product' | 'vendor' | 'tenant' | 'config' | 'payment' | 'system';
  description: string;
  targetType?: 'user' | 'order' | 'product' | 'vendor' | 'tenant' | 'config' | 'payment';
  targetId?: string;
  targetEmail?: string;
  changes?: { field: string; oldValue: any; newValue: any }[];
  metadata?: Record<string, any>;
  req?: any; // Express request for IP/UA extraction
  tenant?: string;
  status?: 'success' | 'failure' | 'warning';
}

/**
 * Create an audit log entry. This is fire-and-forget to avoid
 * blocking the main request flow.
 */
export async function createAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const device = entry.req ? parseUserAgent(entry.req.headers?.['user-agent']) : undefined;
    const ip = entry.req ? getClientIp(entry.req) : undefined;

    await AuditLog.create({
      actor: entry.actor?._id || entry.actor,
      actorEmail: entry.actor?.email || 'system',
      actorRole: entry.actor?.role || 'system',
      action: entry.action,
      category: entry.category,
      targetType: entry.targetType,
      targetId: entry.targetId,
      targetEmail: entry.targetEmail,
      description: entry.description,
      changes: entry.changes,
      metadata: entry.metadata,
      ip,
      userAgent: entry.req?.headers?.['user-agent'],
      device,
      tenant: entry.tenant || entry.req?.tenant || entry.actor?.tenant || 'default',
      status: entry.status || 'success',
    });
  } catch (err) {
    // Never let audit logging break the main flow
    logger.error('Failed to create audit log:', err);
  }
}
