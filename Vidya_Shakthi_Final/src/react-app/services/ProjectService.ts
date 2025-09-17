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

export interface ProjectListParams {
  q?: string;
  status?: string;
  industry?: string;
  sector?: string;
  mentor?: string;
  content_types?: string;
  duration_min?: number;
  duration_max?: number;
  page?: number;
  limit?: number;
  sort_by?: 'createdAt' | 'title' | 'duration_weeks' | 'max_mentees';
  sort_order?: 'asc' | 'desc';
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProjectListResponse {
  projects: Project[];
  pagination: PaginationInfo;
  filters: {
    q?: string;
    status?: string;
    industry?: string;
    sector?: string;
    content_types?: string;
    duration_min?: string;
    duration_max?: string;
  };
}

export interface Project {
  _id: string;
  title: string;
  description?: string;
  mentor?: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  status: 'open' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  max_mentees: number;
  industry?: string;
  sector?: string;
  required_skills?: string[];
  duration_weeks?: number;
  content_types?: Array<'video' | 'audio' | 'document' | 'task' | 'quiz'>;
  thumbnail_url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  industries: string[];
  sectors: string[];
  contentTypes: string[];
  statuses: string[];
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export async function listProjects(params: ProjectListParams = {}): Promise<ProjectListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  const res = await fetch(`${API_BASE}/projects?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const res = await fetch(`${API_BASE}/projects/filters/options`);
  if (!res.ok) throw new Error('Failed to fetch filter options');
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
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Failed to create project' }));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to create project`);
  }
  
  return res.json();
}




