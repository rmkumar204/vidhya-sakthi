// User Service
// This service manages user data fetching and caching
import { logger } from '../utils/logger';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  first_name?: string;
  last_name?: string;
  isOnline?: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Cache for user data to avoid repeated API calls
const userCache = new Map<string, UserData>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch user data by ID from the API
 */
export async function fetchUserById(userId: string, token: string): Promise<UserData | null> {
  try {
    // Check cache first
    const cached = userCache.get(userId);
    const expiry = cacheExpiry.get(userId);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    // Fetch from API
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const userData = await response.json();
      const user: UserData = {
        id: userData._id || userData.id,
        name: userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}`.trim()
          : userData.name || userData.email || 'Unknown User',
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar || userData.picture,
        first_name: userData.first_name,
        last_name: userData.last_name,
        isOnline: true // Default to online, could be enhanced with real-time status
      };

      // Cache the result
      userCache.set(userId, user);
      cacheExpiry.set(userId, Date.now() + CACHE_DURATION);
      
      return user;
    } else {
      logger.warn(`Failed to fetch user ${userId}:`, response.status);
      return null;
    }
  } catch (error) {
    logger.error(`Error fetching user ${userId}:`, error);
    return null;
  }
}

/**
 * Get user data with fallback to mock data
 */
export async function getUserData(userId: string, token?: string): Promise<UserData | null> {
  // Try to fetch from API first if token is available
  if (token) {
    const apiUser = await fetchUserById(userId, token);
    if (apiUser) {
      return apiUser;
    }
  }

  // Fallback to mock data
  return getMockUserData(userId);
}

/**
 * Get mock user data as fallback
 */
function getMockUserData(userId: string): UserData | null {
  const mockUsers: UserData[] = [
    {
      id: '1',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      role: 'mentee',
      avatar: '👩‍💻',
      isOnline: true
    },
    {
      id: '2',
      name: 'Rahul Kumar',
      email: 'rahul@example.com',
      role: 'mentee',
      avatar: '👨‍💻',
      isOnline: true
    },
    {
      id: '3',
      name: 'Anita Patel',
      email: 'anita@example.com',
      role: 'mentee',
      avatar: '👩‍🎓',
      isOnline: false
    },
    {
      id: '4',
      name: 'Vikash Singh',
      email: 'vikash@example.com',
      role: 'mentee',
      avatar: '👨‍🎓',
      isOnline: false
    },
    {
      id: '5',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh@example.com',
      role: 'mentor',
      avatar: '👨‍💼',
      isOnline: true
    },
    {
      id: '6',
      name: 'Dr. Sunita Mehta',
      email: 'sunita@example.com',
      role: 'mentor',
      avatar: '👩‍💼',
      isOnline: true
    }
  ];

  return mockUsers.find(user => user.id === userId) || null;
}

/**
 * Get user display name with proper fallback
 */
export function getUserDisplayName(userId: string, fallbackName?: string): string {
  // Check cache first
  const cached = userCache.get(userId);
  if (cached?.name) {
    return cached.name;
  }

  // Use fallback name if provided
  if (fallbackName) {
    return fallbackName;
  }

  // Generate a more user-friendly fallback
  return `User ${userId.slice(-4)}`;
}

/**
 * Get user avatar with proper fallback
 */
export function getUserAvatar(userId: string): string {
  // Check cache first
  const cached = userCache.get(userId);
  if (cached?.avatar) {
    return cached.avatar;
  }

  // Default avatar
  return '👤';
}

/**
 * Clear user cache (useful for logout)
 */
export function clearUserCache(): void {
  userCache.clear();
  cacheExpiry.clear();
}

/**
 * Preload user data for better performance
 */
export async function preloadUserData(userIds: string[], token: string): Promise<void> {
  const promises = userIds.map(userId => fetchUserById(userId, token));
  await Promise.allSettled(promises);
}
