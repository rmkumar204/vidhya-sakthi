// User Profile Service
// This service manages user profile data including avatars

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'mentor' | 'mentee' | 'reviewer' | 'state_admin' | 'super_admin';
  avatar: string;
  online: boolean;
}

// Mock user profiles - in a real app, this would come from an API
const userProfiles: UserProfile[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    role: 'mentee',
    avatar: '👩‍💻',
    online: true
  },
  {
    id: '2',
    name: 'Rahul Kumar',
    email: 'rahul@example.com',
    role: 'mentee',
    avatar: '👨‍💻',
    online: true
  },
  {
    id: '3',
    name: 'Anita Patel',
    email: 'anita@example.com',
    role: 'mentee',
    avatar: '👩‍🎓',
    online: false
  },
  {
    id: '4',
    name: 'Vikash Singh',
    email: 'vikash@example.com',
    role: 'mentee',
    avatar: '👨‍🎓',
    online: false
  },
  {
    id: 'current-user',
    name: 'You',
    email: 'user@example.com',
    role: 'mentor',
    avatar: '👨‍💼',
    online: true
  }
];

export const getUserProfile = (userId: string): UserProfile | null => {
  return userProfiles.find(user => user.id === userId) || null;
};

export const getCurrentUserProfile = (): UserProfile | null => {
  return getUserProfile('current-user');
};

export const getAllUserProfiles = (): UserProfile[] => {
  return userProfiles;
};

export const updateUserAvatar = (userId: string, newAvatar: string): boolean => {
  const userIndex = userProfiles.findIndex(user => user.id === userId);
  if (userIndex !== -1) {
    userProfiles[userIndex].avatar = newAvatar;
    return true;
  }
  return false;
};

export const updateUserOnlineStatus = (userId: string, online: boolean): boolean => {
  const userIndex = userProfiles.findIndex(user => user.id === userId);
  if (userIndex !== -1) {
    userProfiles[userIndex].online = online;
    return true;
  }
  return false;
};
