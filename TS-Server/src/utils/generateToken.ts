import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';

const generateToken = (id: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  } as SignOptions;

  return jwt.sign({ id }, jwtSecret as Secret, options);
};

export default generateToken;