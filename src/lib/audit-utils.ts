import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VERIFY' | 'LOGIN' | 'LOGOUT' | 'NOTIFY';
export type AuditEntityType = 'profiles' | 'finance' | 'notifications' | 'polls' | 'activities' | 'documents';

export interface AuditLogEntry {
  admin_id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Utility to manually log administrative actions for auditing purposes.
 */
export async function recordAuditLog(entry: AuditLogEntry) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        admin_id: entry.admin_id,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        old_data: entry.old_data,
        new_data: entry.new_data,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent
      });

    if (error) {
      console.error('Failed to record audit log:', error);
    }
  } catch (err) {
    console.error('Error in recordAuditLog:', err);
  }
}
