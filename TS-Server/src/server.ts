import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/db';
import { notFound, errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
// import projectRoutes from './routes/project.routes'; // Example for future
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

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Vidya Shakti Yuva API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
