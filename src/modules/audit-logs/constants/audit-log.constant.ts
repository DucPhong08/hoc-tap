export interface LogActionData {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  description?: string;
}
