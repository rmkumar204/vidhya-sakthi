import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { UserRegistrationSchema, EmailPasswordLoginSchema, EmailPasswordRegisterSchema } from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// OAuth endpoints
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

// Get current user from Mocha Users Service
app.get("/api/users/me", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  
  if (!mochaUser) {
    return c.json({ error: "User not found" }, 401);
  }
  
  // Check if user exists in our local database
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM users WHERE google_sub = ?"
  ).bind(mochaUser.google_sub).all();

  if (results.length === 0) {
    return c.json({ 
      mochaUser, 
      localUser: null,
      needsRegistration: true 
    });
  }

  return c.json({ 
    mochaUser, 
    localUser: results[0],
    needsRegistration: false 
  });
});

// Register user with role and additional details
app.post("/api/users/register", authMiddleware, zValidator('json', UserRegistrationSchema), async (c) => {
  const mochaUser = c.get("user");
  const userData = c.req.valid('json');

  if (!mochaUser) {
    return c.json({ error: "User not authenticated" }, 401);
  }

  // Check if user already exists
  const { results: existingUser } = await c.env.DB.prepare(
    "SELECT id FROM users WHERE google_sub = ?"
  ).bind(mochaUser.google_sub).all();

  if (existingUser.length > 0) {
    return c.json({ error: "User already registered" }, 400);
  }

  // Insert user into database
  const { success, meta } = await c.env.DB.prepare(`
    INSERT INTO users (
      email, google_sub, role, first_name, middle_name, last_name,
      mobile_number, date_of_birth, state, district, block, place_city, pin_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userData.email,
    mochaUser.google_sub,
    userData.role,
    userData.personal.first_name,
    userData.personal.middle_name || null,
    userData.personal.last_name,
    userData.personal.mobile_number,
    userData.personal.date_of_birth,
    userData.personal.state,
    userData.personal.district,
    userData.personal.block,
    userData.personal.place_city,
    userData.personal.pin_code
  ).run();

  if (!success) {
    return c.json({ error: "Failed to register user" }, 500);
  }

  const userId = meta.last_row_id;

  // Insert education records
  for (const edu of userData.educational.education) {
    await c.env.DB.prepare(`
      INSERT INTO user_education (user_id, degree_diploma, subject, year_of_completion)
      VALUES (?, ?, ?, ?)
    `).bind(userId, edu.degree_diploma, edu.subject, edu.year_of_completion).run();
  }

  // Insert experience records if provided
  if (userData.educational.experience) {
    for (const exp of userData.educational.experience) {
      await c.env.DB.prepare(`
        INSERT INTO user_experience (user_id, industry, sector, role, years_of_experience)
        VALUES (?, ?, ?, ?, ?)
      `).bind(userId, exp.industry, exp.sector, exp.role, exp.years_of_experience).run();
    }
  }

  // Insert language proficiency records
  for (const lang of userData.educational.languages) {
    await c.env.DB.prepare(`
      INSERT INTO user_language_proficiency (user_id, language, can_read, can_write, can_speak, can_understand)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, lang.language, lang.can_read, lang.can_write, lang.can_speak, lang.can_understand).run();
  }

  // Insert role-specific preferences
  if (userData.role === 'mentor' && userData.preferences.max_mentees) {
    await c.env.DB.prepare(`
      INSERT INTO mentor_preferences (user_id, max_hours_per_week, max_mentees)
      VALUES (?, ?, ?)
    `).bind(userId, userData.preferences.max_hours_per_week, userData.preferences.max_mentees).run();
  } else if (userData.role === 'mentee') {
    await c.env.DB.prepare(`
      INSERT INTO mentee_preferences (user_id, max_hours_per_week, mentoring_requirements)
      VALUES (?, ?, ?)
    `).bind(userId, userData.preferences.max_hours_per_week, userData.preferences.mentoring_requirements || null).run();
  } else if (userData.role === 'reviewer') {
    await c.env.DB.prepare(`
      INSERT INTO reviewer_preferences (user_id, max_hours_per_week)
      VALUES (?, ?)
    `).bind(userId, userData.preferences.max_hours_per_week).run();
  }

  return c.json({ 
    success: true, 
    userId: userId,
    message: "User registered successfully" 
  });
});

// Logout endpoint
app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Email/Password authentication endpoints
app.post('/api/auth/register', zValidator('json', EmailPasswordRegisterSchema), async (c) => {
  const { email, password, role } = c.req.valid('json');

  // Check if user already exists
  const { results: existingUser } = await c.env.DB.prepare(
    "SELECT id FROM users WHERE email = ?"
  ).bind(email).all();

  if (existingUser.length > 0) {
    return c.json({ error: "User with this email already exists" }, 400);
  }

  // Hash password (in production, use proper password hashing)
  const hashedPassword = password; // TODO: Implement proper password hashing

  // Create user record
  const { success, meta } = await c.env.DB.prepare(`
    INSERT INTO users (email, password_hash, role, is_active)
    VALUES (?, ?, ?, 1)
  `).bind(email, hashedPassword, role).run();

  if (!success) {
    return c.json({ error: "Failed to create user" }, 500);
  }

  return c.json({ 
    success: true, 
    userId: meta.last_row_id,
    message: "User created successfully" 
  });
});

app.post('/api/auth/login', zValidator('json', EmailPasswordLoginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  // Find user by email
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM users WHERE email = ? AND password_hash IS NOT NULL"
  ).bind(email).all();

  if (results.length === 0) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const user = results[0] as any;

  // Verify password (in production, use proper password verification)
  if (user.password_hash !== password) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  // TODO: Create and return session token
  return c.json({ 
    success: true, 
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
});

// Get users by role (for admin)
app.get('/api/users/role/:role', authMiddleware, async (c) => {
  const role = c.req.param('role');
  const currentUser = c.get("user");

  if (!currentUser) {
    return c.json({ error: "User not authenticated" }, 401);
  }

  // Get current user's role from database
  const { results: userResults } = await c.env.DB.prepare(
    "SELECT role FROM users WHERE google_sub = ?"
  ).bind(currentUser.google_sub).all();

  if (userResults.length === 0) {
    return c.json({ error: "User not found" }, 404);
  }

  const userRole = (userResults[0] as any).role;

  // Only allow admins to view user lists
  if (!['state_admin', 'super_admin'].includes(userRole)) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM users WHERE role = ? ORDER BY created_at DESC"
  ).bind(role).all();

  return c.json({ users: results });
});

// Dashboard overview endpoint
app.get('/api/dashboard/overview', authMiddleware, async (c) => {
  const currentUser = c.get("user");

  if (!currentUser) {
    return c.json({ error: "User not authenticated" }, 401);
  }

  try {
    // Get basic stats based on role
    let stats = {
      totalUsers: 0,
      totalProjects: 0,
      completedTasks: 0,
      certificates: 0,
      recentActivity: []
    };

    // Get total users
    const { results: userCount } = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users"
    ).all();
    stats.totalUsers = (userCount[0] as any).count || 0;

    // Get total projects
    const { results: projectCount } = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM projects"
    ).all();
    stats.totalProjects = (projectCount[0] as any).count || 0;

    // Get completed tasks count
    const { results: taskCount } = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'"
    ).all();
    stats.completedTasks = (taskCount[0] as any).count || 0;

    // Get certificates count
    const { results: certCount } = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM certificates"
    ).all();
    stats.certificates = (certCount[0] as any).count || 0;

    return c.json(stats);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return c.json({ error: "Failed to fetch dashboard data" }, 500);
  }
});

// Chat endpoints
app.get('/api/chat/rooms', authMiddleware, async (c) => {
  const currentUser = c.get("user");

  if (!currentUser) {
    return c.json({ error: "User not authenticated" }, 401);
  }

  try {
    // Get current user's local ID
    const { results: userResults } = await c.env.DB.prepare(
      "SELECT id FROM users WHERE google_sub = ?"
    ).bind(currentUser.google_sub).all();

    if (userResults.length === 0) {
      return c.json({ rooms: [] });
    }

    const userId = (userResults[0] as any).id;

    // Get chat rooms user is part of
    const { results: rooms } = await c.env.DB.prepare(`
      SELECT DISTINCT cr.*, 
        (SELECT message_text FROM chat_messages WHERE chat_room_id = cr.id ORDER BY sent_at DESC LIMIT 1) as last_message,
        0 as unread_count
      FROM chat_rooms cr
      JOIN chat_participants cp ON cr.id = cp.chat_room_id
      WHERE cp.user_id = ?
      ORDER BY cr.created_at DESC
    `).bind(userId).all();

    return c.json({ rooms: rooms || [] });
  } catch (error) {
    console.error('Chat rooms error:', error);
    return c.json({ error: "Failed to fetch chat rooms" }, 500);
  }
});

app.get('/api/chat/rooms/:roomId/messages', authMiddleware, async (c) => {
  const roomId = c.req.param('roomId');
  const currentUser = c.get("user");

  if (!currentUser) {
    return c.json({ error: "User not authenticated" }, 401);
  }

  try {
    // Verify user has access to this room
    const { results: userResults } = await c.env.DB.prepare(
      "SELECT id FROM users WHERE google_sub = ?"
    ).bind(currentUser.google_sub).all();

    if (userResults.length === 0) {
      return c.json({ messages: [] });
    }

    const userId = (userResults[0] as any).id;

    // Check if user is participant in this room
    const { results: participantCheck } = await c.env.DB.prepare(
      "SELECT id FROM chat_participants WHERE chat_room_id = ? AND user_id = ?"
    ).bind(roomId, userId).all();

    if (participantCheck.length === 0) {
      return c.json({ error: "Access denied" }, 403);
    }

    // Get messages
    const { results: messages } = await c.env.DB.prepare(`
      SELECT cm.*, u.first_name || ' ' || u.last_name as sender_name
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.chat_room_id = ?
      ORDER BY cm.sent_at ASC
      LIMIT 100
    `).bind(roomId).all();

    return c.json({ messages: messages || [] });
  } catch (error) {
    console.error('Chat messages error:', error);
    return c.json({ error: "Failed to fetch messages" }, 500);
  }
});

app.post('/api/chat/messages', authMiddleware, async (c) => {
  const currentUser = c.get("user");

  if (!currentUser) {
    return c.json({ error: "User not authenticated" }, 401);
  }

  try {
    const formData = await c.req.formData();
    const messageText = formData.get('message_text') as string;
    const chatRoomId = formData.get('chat_room_id') as string;
    const file = formData.get('file') as File;

    // Get current user's local ID
    const { results: userResults } = await c.env.DB.prepare(
      "SELECT id FROM users WHERE google_sub = ?"
    ).bind(currentUser.google_sub).all();

    if (userResults.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    const userId = (userResults[0] as any).id;

    // Verify user has access to this room
    const { results: participantCheck } = await c.env.DB.prepare(
      "SELECT id FROM chat_participants WHERE chat_room_id = ? AND user_id = ?"
    ).bind(chatRoomId, userId).all();

    if (participantCheck.length === 0) {
      return c.json({ error: "Access denied" }, 403);
    }

    let fileUrl = null;
    let fileName = null;
    let messageType = 'text';

    // Handle file upload if present
    if (file && file.size > 0) {
      // For now, we'll skip actual file upload and just store filename
      fileName = file.name;
      messageType = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('audio/') ? 'audio' : 'file';
      // TODO: Implement actual file upload to storage
    }

    // Insert message
    const { success } = await c.env.DB.prepare(`
      INSERT INTO chat_messages (chat_room_id, sender_id, message_text, file_url, file_name, message_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(chatRoomId, userId, messageText || '', fileUrl, fileName, messageType).run();

    if (!success) {
      return c.json({ error: "Failed to send message" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ error: "Failed to send message" }, 500);
  }
});

export default app;
