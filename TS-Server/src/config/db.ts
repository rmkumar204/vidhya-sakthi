import mongoose from 'mongoose';
import 'dotenv/config';
import { logger } from './logger';

const connectDB = async () => {
  try {
    const uri = (process.env.MONGO_URI as string) || 'mongodb://localhost:27017/';
    const conn = await mongoose.connect(uri);
    logger.database(`MongoDB Connected: ${conn.connection.host}`, {
      host: conn.connection.host,
      name: conn.connection.name,
      readyState: conn.connection.readyState
    });
  } catch (error: any) {
    logger.error(`Database connection error: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      uri: process.env.MONGO_URI ? 'configured' : 'default'
    });
    process.exit(1);
  }
};

export default connectDB;