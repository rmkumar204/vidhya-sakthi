export interface CreateProjectRequest {
  title: string;
  description?: string;
  industry?: string;
  sector?: string;
  required_skills?: string[];
  duration_weeks?: number;
  max_mentees?: number;
  content_types?: Array<'video' | 'audio' | 'document' | 'task' | 'quiz'>;
  thumbnail_url?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export async function listProjects(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  const res = await fetch(`${API_BASE}/projects?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(body: CreateProjectRequest, token?: string) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}




