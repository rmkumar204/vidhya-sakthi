import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/db';
import { notFound, errorHandler } from './middleware/error.middleware';
import { logger, morganStream } from './config/logger';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import locationRoutes from './routes/location.routes';
import projectRoutes from './routes/project.routes';
import connectionRequestRoutes from './routes/connectionRequest.routes';
import notificationRoutes from './routes/notification.routes';
import conversationRoutes from './routes/conversation.routes';
// import chatRoutes from './routes/chat.routes'; // Example for future

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Set security headers
app.use(express.json()); // Body parser for JSON

// HTTP request logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: morganStream }));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// http://localhost:6000/api/locations/states
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/connection-requests', connectionRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/conversations', conversationRoutes);
// app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Vidya Shakti Yuva API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});
