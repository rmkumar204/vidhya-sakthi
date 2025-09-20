// Service for guidance connection requests (mentor-mentee connections without projects)
export interface Mentor {
  _id: string;
  name: string;
  email: string;
  experience: Array<{
    role: string;
    sector: string;
    years_of_experience?: number;
  }>;
  skills: string[];
  availability: {
    weekdays?: boolean;
    weekends?: boolean;
    mornings?: boolean;
    afternoons?: boolean;
    evenings?: boolean;
  };
  maxMentees: number;
}

export interface MentorsResponse {
  mentors: Mentor[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface GuidanceConnectionRequest {
  mentorId: string;
  message?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

/**
 * Get all mentors for guidance connection
 */
export async function getMentors(
  params: { page?: number; limit?: number; search?: string } = {},
  token: string
): Promise<MentorsResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });

  const res = await fetch(`${API_BASE}/users/mentors?${query.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch mentors');
  }

  return res.json();
}

/**
 * Create a guidance connection request
 * This creates a connection request without a specific project for general guidance
 */
export async function createGuidanceConnectionRequest(
  payload: GuidanceConnectionRequest,
  token: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/connection-requests/guidance`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create guidance connection request');
  }

  return res.json();
}