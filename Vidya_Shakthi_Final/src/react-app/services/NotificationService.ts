// Frontend service for notifications
export interface Notification {
  _id: string;
  recipient: string;
  type: 'connection_request' | 'request_accepted' | 'request_rejected' | 'new_message' | 'project_update' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  read_at?: string;
  action_url?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  unreadCount: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export async function getNotifications(
  params: { read?: boolean; type?: string; page?: number; limit?: number } = {},
  token: string
): Promise<NotificationResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  
  const res = await fetch(`${API_BASE}/notifications?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch notifications');
  }
  
  return res.json();
}

export async function markNotificationAsRead(
  notificationId: string,
  token: string
): Promise<Notification> {
  const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to mark notification as read');
  }
  
  return res.json();
}

export async function markAllNotificationsAsRead(token: string): Promise<{ message: string; modifiedCount: number }> {
  const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
  
  return res.json();
}

export async function deleteNotification(
  notificationId: string,
  token: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to delete notification');
  }
  
  return res.json();
}

export async function getUnreadCount(token: string): Promise<{ unreadCount: number }> {
  const res = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch unread count');
  }
  
  return res.json();
}