export type NotificationType = 'alert' | 'warning' | 'success' | 'info';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  data?: any;
  createdAt: Date;
  entityId?: string;
  entityType?: string;
  action?: {
    label: string;
    url: string;
  };
}
