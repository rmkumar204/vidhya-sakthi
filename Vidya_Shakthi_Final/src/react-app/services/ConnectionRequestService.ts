// Frontend service for connection requests
export interface ConnectionRequest {
  _id: string;
  mentee: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  mentor: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  project: {
    _id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  response_message?: string;
  requested_at: string;
  responded_at?: string;
  conversation?: string;
}

export interface CreateConnectionRequestPayload {
  projectId: string;
  mentorId: string;
  message?: string;
}

export interface RespondToRequestPayload {
  action: 'accept' | 'reject';
  response_message?: string;
}

export interface ConnectionRequestResponse {
  requests: ConnectionRequest[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export async function createConnectionRequest(
  payload: CreateConnectionRequestPayload, 
  token: string
): Promise<ConnectionRequest> {
  const res = await fetch(`${API_BASE}/connection-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create connection request');
  }
  
  return res.json();
}

export async function getConnectionRequests(
  params: { status?: string; page?: number; limit?: number } = {},
  token: string
): Promise<ConnectionRequestResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  
  const res = await fetch(`${API_BASE}/connection-requests?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch connection requests');
  }
  
  return res.json();
}

export async function respondToConnectionRequest(
  requestId: string,
  payload: RespondToRequestPayload,
  token: string
): Promise<{ connectionRequest: ConnectionRequest; conversation?: { _id: string } }> {
  const res = await fetch(`${API_BASE}/connection-requests/${requestId}/respond`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to respond to connection request');
  }
  
  return res.json();
}

export async function getConnectionRequest(
  requestId: string,
  token: string
): Promise<ConnectionRequest> {
  const res = await fetch(`${API_BASE}/connection-requests/${requestId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch connection request');
  }
  
  return res.json();
}