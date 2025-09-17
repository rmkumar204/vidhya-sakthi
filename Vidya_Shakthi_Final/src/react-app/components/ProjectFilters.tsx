import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FilterOptions, ProjectListParams } from '@/react-app/services/ProjectService';

interface ProjectFiltersProps {
  params: ProjectListParams;
  filterOptions: FilterOptions;
  onParamsChange: (newParams: Partial<ProjectListParams>) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export default function ProjectFilters({
  params,
  filterOptions,
  onParamsChange,
  onClearFilters,
  loading = false
}: ProjectFiltersProps) {
  const hasActiveFilters = Boolean(
    params.q || 
    params.status || 
    params.industry || 
    params.sector || 
    params.content_types ||
    params.duration_min ||
    params.duration_max
  );

  const handleSearchChange = (value: string) => {
    onParamsChange({ q: value || undefined });
  };

  const handleFilterChange = (key: keyof ProjectListParams, value: string) => {
    onParamsChange({ [key]: value || undefined });
  };

  const handleDurationChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? Number(value) : undefined;
    if (type === 'min') {
      onParamsChange({ duration_min: numValue });
    } else {
      onParamsChange({ duration_max: numValue });
    }
  };

  const handleSortChange = (field: string, order: string) => {
    onParamsChange({ 
      sort_by: field as any,
      sort_order: order as any
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FunnelIcon className="w-5 h-5" />
          Explore Projects
        </h3>
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Search and Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects, skills, or topics..."
            value={params.q || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm placeholder-gray-500 dark:placeholder-gray-400"
            disabled={loading}
          />
        </div>

        {/* Status Filter */}
        <select
          value={params.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          disabled={loading}
        >
          <option value="">All Statuses</option>
          {filterOptions.statuses.map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>

        {/* Content Type Filter */}
        <select
          value={params.content_types || ''}
          onChange={(e) => handleFilterChange('content_types', e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          disabled={loading}
        >
          <option value="">All Content Types</option>
          {filterOptions.contentTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={`${params.sort_by}-${params.sort_order}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            handleSortChange(field, order);
          }}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          disabled={loading}
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
          <option value="duration_weeks-asc">Shortest Duration</option>
          <option value="duration_weeks-desc">Longest Duration</option>
        </select>
      </div>

      {/* Advanced Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Sector Filter */}
        <select
          value={params.sector || ''}
          onChange={(e) => handleFilterChange('sector', e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          disabled={loading}
        >
          <option value="">All Sectors</option>
          {filterOptions.sectors.map(sector => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>

        {/* Active Filters Count */}
        {hasActiveFilters && (
          <div className="flex items-center">
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {Object.values(params).filter(v => v !== undefined && v !== '').length} filters active
            </span>
          </div>
        )}
      </div>
    </div>
  );
}