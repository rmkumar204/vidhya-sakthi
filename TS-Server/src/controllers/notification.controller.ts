import asyncHandler from 'express-async-handler';
import Notification from '../models/notification.model';

// GET /api/notifications - Get user notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { read, type, page = '1', limit = '20' } = req.query as Record<string, string>;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  // Build filter
  const filter: any = { recipient: userId };
  if (read !== undefined) {
    filter.read = read === 'true';
  }
  if (type) {
    filter.type = type;
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Execute queries
  const [notifications, totalCount, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, read: false })
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.json({
    notifications,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum,
      hasNextPage,
      hasPrevPage
    },
    unreadCount
  });
});

// PUT /api/notifications/:id/read - Mark notification as read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const notification = await Notification.findById(id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Verify ownership
  if (notification.recipient.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  if (!notification.read) {
    notification.read = true;
    notification.read_at = new Date();
    await notification.save();
  }

  res.json(notification);
});

// PUT /api/notifications/mark-all-read - Mark all notifications as read
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const result = await Notification.updateMany(
    { recipient: userId, read: false },
    { 
      read: true, 
      read_at: new Date() 
    }
  );

  res.json({ 
    message: 'All notifications marked as read',
    modifiedCount: result.modifiedCount 
  });
});

// DELETE /api/notifications/:id - Delete notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const notification = await Notification.findById(id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Verify ownership
  if (notification.recipient.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  await Notification.findByIdAndDelete(id);
  res.json({ message: 'Notification deleted successfully' });
});

// GET /api/notifications/unread-count - Get unread notification count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const unreadCount = await Notification.countDocuments({ 
    recipient: userId, 
    read: false 
  });

  res.json({ count: unreadCount });
});