import { useEffect, useMemo, useState } from 'react';
import { createProject, listProjects, CreateProjectRequest } from '@/react-app/services/ProjectService';

export function useProjects(initialFilters: Record<string, string> = {}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);

  const query = useMemo(() => filters, [filters]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProjects(query);
      setProjects(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [JSON.stringify(query)]);

  const addProject = async (payload: CreateProjectRequest, token?: string) => {
    const created = await createProject(payload, token);
    setProjects(prev => [created, ...prev]);
    return created;
  };

  return { projects, loading, error, filters, setFilters, fetchProjects, addProject };
}




