import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/user.model';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

interface JwtPayload {
  id: string;
}

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password_hash');

      if (!req.user) {
        logger.auth('Authentication failed: user not found', { userId: decoded.id });
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      logger.auth('User authenticated successfully', { 
        userId: req.user._id,
        email: req.user.email,
        path: req.path,
        method: req.method
      });
      next();
    } catch (error: any) {
      logger.error('Authentication failed: token verification error', {
        error: error.message,
        path: req.path,
        method: req.method
      });
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    logger.auth('Authentication failed: no token provided', {
      path: req.path,
      method: req.method
    });
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

export { protect };
