import asyncHandler from 'express-async-handler';
import { Types } from 'mongoose';
import ConnectionRequest from '../models/connectionRequest.model';
import Conversation from '../models/conversation.model';
import Notification from '../models/notification.model';
import Project from '../models/project.model';
import User from '../models/user.model';

// POST /api/connection-requests - Create a new connection request
export const createConnectionRequest = asyncHandler(async (req, res) => {
  const menteeId = req.user?._id;
  const { projectId, mentorId, message } = req.body;

  if (!menteeId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  // Verify project exists and get mentor
  const project = await Project.findById(projectId).populate('mentor');
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Verify mentor exists
  const mentor = await User.findById(mentorId);
  if (!mentor || mentor.role !== 'mentor') {
    res.status(404);
    throw new Error('Mentor not found');
  }

  // Check if mentee has role
  const mentee = await User.findById(menteeId);
  if (!mentee || mentee.role !== 'mentee') {
    res.status(403);
    throw new Error('Only mentees can send connection requests');
  }

  // Check for existing pending request
  const existingRequest = await ConnectionRequest.findOne({
    mentee: menteeId,
    mentor: mentorId,
    project: projectId,
    status: 'pending'
  });

  if (existingRequest) {
    res.status(409);
    throw new Error('You already have a pending request for this project');
  }

  // Create connection request
  const connectionRequest = await ConnectionRequest.create({
    mentee: menteeId,
    mentor: mentorId,
    project: projectId,
    message: message || '',
    status: 'pending'
  });

  // Create notification for mentor
  await Notification.create({
    recipient: mentorId,
    type: 'connection_request',
    title: 'New Connection Request',
    message: `${mentee.first_name} ${mentee.last_name} wants to connect for project "${project.title}"`,
    data: {
      connectionRequestId: connectionRequest._id,
      projectId: projectId,
      menteeId: menteeId
    },
    action_url: '/dashboard'
  });

  // Populate the response
  const populatedRequest = await ConnectionRequest.findById(connectionRequest._id)
    .populate('mentee', 'first_name last_name email')
    .populate('mentor', 'first_name last_name email')
    .populate('project', 'title description');

  res.status(201).json(populatedRequest);
});

// POST /api/connection-requests/guidance - Create a guidance connection request (without project)
export const createGuidanceConnectionRequest = asyncHandler(async (req, res) => {
  const menteeId = req.user?._id;
  const { mentorId, message } = req.body;

  if (!menteeId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  // Verify mentor exists
  const mentor = await User.findById(mentorId);
  if (!mentor || mentor.role !== 'mentor') {
    res.status(404);
    throw new Error('Mentor not found');
  }

  // Check if mentee has role
  const mentee = await User.findById(menteeId);
  if (!mentee || mentee.role !== 'mentee') {
    res.status(403);
    throw new Error('Only mentees can send connection requests');
  }

  // Check for existing pending guidance request (without project)
  const existingRequest = await ConnectionRequest.findOne({
    mentee: menteeId,
    mentor: mentorId,
    project: { $exists: false },
    status: 'pending'
  });

  if (existingRequest) {
    res.status(409);
    throw new Error('You already have a pending guidance request with this mentor');
  }

  // Create guidance connection request (without project)
  const connectionRequest = await ConnectionRequest.create({
    mentee: menteeId,
    mentor: mentorId,
    // No project for guidance connection
    message: message || 'Hi! I would like to connect with you for guidance and mentorship.',
    status: 'pending'
  });

  // Create notification for mentor
  await Notification.create({
    recipient: mentorId,
    type: 'connection_request',
    title: 'New Guidance Request',
    message: `${mentee.first_name} ${mentee.last_name} wants to connect for guidance and mentorship`,
    data: {
      connectionRequestId: connectionRequest._id,
      menteeId: menteeId,
      isGuidanceRequest: true
    },
    action_url: '/dashboard'
  });

  // Populate the response
  const populatedRequest = await ConnectionRequest.findById(connectionRequest._id)
    .populate('mentee', 'first_name last_name email')
    .populate('mentor', 'first_name last_name email');

  res.status(201).json(populatedRequest);
});

// GET /api/connection-requests - List connection requests (filtered by user role)
export const listConnectionRequests = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { status, page = '1', limit = '10' } = req.query as Record<string, string>;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Build filter based on user role
  const filter: any = {};
  if (user.role === 'mentor') {
    filter.mentor = userId;
  } else if (user.role === 'mentee') {
    filter.mentee = userId;
  } else {
    res.status(403);
    throw new Error('Invalid user role');
  }

  if (status) {
    filter.status = status;
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Execute queries
  const [requests, totalCount] = await Promise.all([
    ConnectionRequest.find(filter)
      .sort({ requested_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('mentee', 'first_name last_name email')
      .populate('mentor', 'first_name last_name email')
      .populate('project', 'title description thumbnail_url')
      .lean(),
    ConnectionRequest.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.json({
    requests,
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

// PUT /api/connection-requests/:id/respond - Accept or reject a connection request
export const respondToConnectionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, response_message } = req.body; // action: 'accept' | 'reject'
  const mentorId = req.user?._id;

  if (!mentorId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  if (!['accept', 'reject'].includes(action)) {
    res.status(400);
    throw new Error('Invalid action. Must be "accept" or "reject"');
  }

  // Find the connection request and populate mentor and project data
  const connectionRequest = await ConnectionRequest.findById(id)
    .populate('mentee', 'first_name last_name email')
    .populate('mentor', 'first_name last_name email')
    .populate('project', 'title description thumbnail_url');

  if (!connectionRequest) {
    res.status(404);
    throw new Error('Connection request not found');
  }

  // Verify mentor ownership
  if (connectionRequest.mentor._id.toString() !== mentorId.toString()) {
    res.status(403);
    throw new Error('You can only respond to your own connection requests');
  }

  // Check if already responded
  if (connectionRequest.status !== 'pending') {
    res.status(409);
    throw new Error('This request has already been responded to');
  }

  // Update connection request
  const newStatus = action === 'accept' ? 'accepted' : 'rejected';
  connectionRequest.status = newStatus;
  connectionRequest.response_message = response_message || '';
  connectionRequest.responded_at = new Date();

  let conversation = null;

  // If accepted, create conversation
  if (action === 'accept') {
    conversation = await Conversation.create({
      participants: [connectionRequest.mentee._id, connectionRequest.mentor._id],
      project: connectionRequest.project?._id || null, // Handle null project for guidance connections
      connection_request: connectionRequest._id,
      messages: [],
      is_active: true
    });

    connectionRequest.conversation = conversation._id as Types.ObjectId;
  }

  await connectionRequest.save();

  // Create notification for mentee
  const notificationTitle = action === 'accept' 
    ? 'Connection Request Accepted!' 
    : 'Connection Request Declined';
  
  // Handle both project-based and guidance connections in notification message
  const mentorName = `${(connectionRequest.mentor as any).first_name} ${(connectionRequest.mentor as any).last_name}`;
  const projectTitle = connectionRequest.project ? (connectionRequest.project as any).title : null;
  
  const notificationMessage = action === 'accept'
    ? projectTitle
      ? `${mentorName} accepted your request for "${projectTitle}". You can now start messaging!`
      : `${mentorName} accepted your guidance request. You can now start messaging!`
    : projectTitle
      ? `${mentorName} declined your request for "${projectTitle}".`
      : `${mentorName} declined your guidance request.`;

  await Notification.create({
    recipient: connectionRequest.mentee._id,
    type: action === 'accept' ? 'request_accepted' : 'request_rejected',
    title: notificationTitle,
    message: notificationMessage,
    data: {
      connectionRequestId: connectionRequest._id,
      projectId: connectionRequest.project?._id || null, // Handle null project
      mentorId: connectionRequest.mentor._id,
      conversationId: conversation?._id
    },
    action_url: action === 'accept' ? '/messages' : '/dashboard'
  });

  res.json({
    connectionRequest,
    conversation: conversation ? { _id: conversation._id } : null
  });
});

// GET /api/connection-requests/:id - Get specific connection request
export const getConnectionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const connectionRequest = await ConnectionRequest.findById(id)
    .populate('mentee', 'first_name last_name email')
    .populate('mentor', 'first_name last_name email')
    .populate('project', 'title description thumbnail_url')
    .populate('conversation')
    .lean();

  if (!connectionRequest) {
    res.status(404);
    throw new Error('Connection request not found');
  }

  // Verify user has access to this request
  const isMentee = connectionRequest.mentee._id.toString() === userId.toString();
  const isMentor = connectionRequest.mentor._id.toString() === userId.toString();

  if (!isMentee && !isMentor) {
    res.status(403);
    throw new Error('Access denied');
  }

  res.json(connectionRequest);
});