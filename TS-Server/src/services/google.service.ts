import axios from 'axios';
import 'dotenv/config';
import { logger } from '../config/logger';

interface GoogleTokensResult {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  id_token: string;
}

export async function getGoogleOAuthTokens({ code }: { code: string }): Promise<GoogleTokensResult> {
  const url = 'https://oauth2.googleapis.com/token';
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    logger.error('Missing Google OAuth environment variables');
    throw new Error('Missing Google OAuth environment variables');
  }
  
  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    redirect_uri: 'http://localhost:5173/auth/callback', // Must match frontend
    grant_type: 'authorization_code',
  };

  try {
    logger.oauth('Requesting Google OAuth tokens', { code: code.substring(0, 10) + '...' });
    const res = await axios.post<GoogleTokensResult>(url, new URLSearchParams(values), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    logger.oauth('Successfully obtained Google OAuth tokens');
    return res.data;
  } catch (error: any) {
    logger.error('Failed to fetch Google OAuth tokens', {
      error: error.response?.data?.error_description || error.message,
      status: error.response?.status
    });
    throw new Error('Failed to fetch Google OAuth tokens');
  }
}

interface GoogleUserResult {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export async function getGoogleUser({ id_token, access_token }: { id_token: string; access_token: string }): Promise<GoogleUserResult> {
  try {
    logger.oauth('Fetching Google user information');
    const res = await axios.get<GoogleUserResult>(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );
    logger.oauth('Successfully fetched Google user information', { 
      userId: res.data.id,
      email: res.data.email,
      verified: res.data.verified_email
    });
    return res.data;
  } catch (error: any) {
    logger.error('Failed to fetch Google user', {
      error: error.message,
      status: error.response?.status
    });
    throw new Error('Failed to fetch Google user');
  }
}