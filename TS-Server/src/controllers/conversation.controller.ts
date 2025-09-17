import asyncHandler from 'express-async-handler';
import Conversation from '../models/conversation.model';
import ConnectionRequest from '../models/connectionRequest.model';
import Notification from '../models/notification.model';
import User from '../models/user.model';

// GET /api/conversations - Get user's conversations
export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { page = '1', limit = '20' } = req.query as Record<string, string>;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Find conversations where user is a participant
  const [conversations, totalCount] = await Promise.all([
    Conversation.find({ 
      participants: userId,
      is_active: true 
    })
      .sort({ last_message_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('participants', 'first_name last_name email role')
      .populate('project', 'title description')
      .populate('connection_request')
      .lean(),
    Conversation.countDocuments({ 
      participants: userId,
      is_active: true 
    })
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.json({
    conversations,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum,
      hasNextPage,
      hasPrevPage
    }
  });
});

// GET /api/conversations/:id - Get specific conversation with messages
export const getConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const { page = '1', limit = '50' } = req.query as Record<string, string>;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const conversation = await Conversation.findById(id)
    .populate('participants', 'first_name last_name email role')
    .populate('project', 'title description')
    .populate({
      path: 'messages.sender',
      select: 'first_name last_name email role'
    })
    .lean();

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Verify user is a participant
  const isParticipant = conversation.participants.some(
    (participant: any) => participant._id.toString() === userId.toString()
  );

  if (!isParticipant) {
    res.status(403);
    throw new Error('Access denied');
  }

  // Pagination for messages
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = Math.max(0, conversation.messages.length - (pageNum * limitNum));
  const endIndex = conversation.messages.length - ((pageNum - 1) * limitNum);

  const paginatedMessages = conversation.messages.slice(skip, endIndex);
  const totalPages = Math.ceil(conversation.messages.length / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.json({
    conversation: {
      ...conversation,
      messages: paginatedMessages
    },
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount: conversation.messages.length,
      limit: limitNum,
      hasNextPage,
      hasPrevPage
    }
  });
});

// POST /api/conversations/:id/messages - Send a message
export const sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const { content, message_type = 'text', file_url, call_duration } = req.body;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  if (!content) {
    res.status(400);
    throw new Error('Message content is required');
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Verify user is a participant
  const isParticipant = conversation.participants.some(
    (participantId) => participantId.toString() === userId.toString()
  );

  if (!isParticipant) {
    res.status(403);
    throw new Error('Access denied');
  }

  // Create new message
  const newMessage = {
    sender: userId,
    content,
    message_type,
    file_url,
    call_duration,
    timestamp: new Date()
  };

  // Add message to conversation
  conversation.messages.push(newMessage as any);
  conversation.last_message = content;
  conversation.last_message_at = new Date();

  await conversation.save();

  // Get the sender information for the response
  const sender = await User.findById(userId, 'first_name last_name email role');
  
  // Get the added message with populated sender info
  const addedMessage = {
    ...newMessage,
    _id: conversation.messages[conversation.messages.length - 1]._id,
    sender: sender
  };

  // Send notification to other participants
  const otherParticipants = conversation.participants.filter(
    (participantId) => participantId.toString() !== userId.toString()
  );
  
  for (const participantId of otherParticipants) {
    await Notification.create({
      recipient: participantId,
      type: 'new_message',
      title: 'New Message',
      message: `${sender?.first_name} ${sender?.last_name} sent you a message`,
      data: {
        conversationId: conversation._id,
        messageId: addedMessage?._id
      },
      action_url: '/messages'
    });
  }

  res.status(201).json({
    message: addedMessage,
    conversation: {
      _id: conversation._id,
      last_message: conversation.last_message,
      last_message_at: conversation.last_message_at
    }
  });
});

// PUT /api/conversations/:id/messages/:messageId - Edit a message
export const editMessage = asyncHandler(async (req, res) => {
  const { id, messageId } = req.params;
  const userId = req.user?._id;
  const { content } = req.body;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  if (!content) {
    res.status(400);
    throw new Error('Message content is required');
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Find the message
  const message = conversation.messages.find(
    (msg: any) => msg._id.toString() === messageId
  );

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // Verify user is the sender
  if (message.sender.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('You can only edit your own messages');
  }

  // Update message
  message.content = content;
  message.edited = true;
  message.edited_at = new Date();

  await conversation.save();

  // Get sender information for the response
  const sender = await User.findById(message.sender, 'first_name last_name email role');
  
  // Return updated message with populated sender
  const updatedMessage = {
    ...message.toObject(),
    sender: sender
  };

  res.json({ message: updatedMessage });
});

// DELETE /api/conversations/:id - Delete/deactivate conversation
export const deleteConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Verify user is a participant
  const isParticipant = conversation.participants.some(
    (participantId) => participantId.toString() === userId.toString()
  );

  if (!isParticipant) {
    res.status(403);
    throw new Error('Access denied');
  }

  // Deactivate conversation instead of deleting
  conversation.is_active = false;
  await conversation.save();

  res.json({ message: 'Conversation deleted successfully' });
});