import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  createProject, 
  listProjects, 
  getFilterOptions,
  CreateProjectRequest, 
  ProjectListParams, 
  ProjectListResponse,
  Project,
  FilterOptions,
  PaginationInfo 
} from '@/react-app/services/ProjectService';

export function useProjects(initialParams: ProjectListParams = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<ProjectListParams>({
    page: 1,
    limit: 10,
    sort_by: 'createdAt',
    sort_order: 'desc',
    ...initialParams
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    industries: [],
    sectors: [],
    contentTypes: [],
    statuses: []
  });

  const fetchProjects = useCallback(async (newParams?: ProjectListParams) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = newParams || params;
      const data: ProjectListResponse = await listProjects(queryParams);
      setProjects(data.projects);
      setPagination(data.pagination);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const options = await getFilterOptions();
      setFilterOptions(options);
    } catch (e: any) {
      console.error('Failed to fetch filter options:', e);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const updateParams = useCallback((newParams: Partial<ProjectListParams>) => {
    const updatedParams = { ...params, ...newParams };
    // Reset to page 1 when filters change (except when changing page directly)
    if (!newParams.page && Object.keys(newParams).some(key => key !== 'page')) {
      updatedParams.page = 1;
    }
    setParams(updatedParams);
  }, [params]);

  const addProject = async (payload: CreateProjectRequest, token?: string) => {
    const created = await createProject(payload, token);
    setProjects(prev => [created, ...prev]);
    return created;
  };

  const clearFilters = useCallback(() => {
    setParams({
      page: 1,
      limit: params.limit,
      sort_by: 'createdAt',
      sort_order: 'desc'
    });
  }, [params.limit]);

  return { 
    projects, 
    pagination,
    loading, 
    error, 
    params, 
    updateParams,
    clearFilters,
    filterOptions,
    fetchProjects, 
    addProject 
  };
}




