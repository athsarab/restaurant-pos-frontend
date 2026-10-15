import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * Professional DataTable component with pagination, sorting, and search
 * Similar to DataTables.js but built for React
 */
export default function DataTable({ 
  columns, 
  data = [], 
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  showPagination = true,
  showSearch = true,
  searchPlaceholder = "Search...",
  emptyMessage = "No data available",
  className = '',
  rowNumbering = true,
  footer = null // Optional footer component or function
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    const searchLower = searchTerm.toLowerCase();
    return data.filter(row => {
      return columns.some(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
      }
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize]);

  // Calculate pagination info
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startEntry = sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, sortedData.length);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key: null, direction: null };
    });
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
  };

  // Handle search change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className={`datatable-container ${className}`}>
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Show</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-white"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-sm text-slate-400">entries</span>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-white placeholder-slate-500 w-48"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-700 rounded">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              {/* Row Number Column */}
              {rowNumbering && (
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-16">
                  NO
                </th>
              )}
              
              {/* Data Columns */}
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-700 select-none' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label || col.title}</span>
                    {col.sortable !== false && (
                      <span className="text-slate-500">
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-slate-900/50 divide-y divide-slate-800">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1;
                return (
                  <tr 
                    key={row._id || row.id || index}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Row Number */}
                    {rowNumbering && (
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {globalIndex}
                      </td>
                    )}
                    
                    {/* Data Cells */}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm text-slate-100">
                        {col.render ? col.render(row[col.key], row, globalIndex) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td 
                  colSpan={columns.length + (rowNumbering ? 1 : 0)} 
                  className="px-4 py-8 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
          
          {/* Optional Footer */}
          {footer && paginatedData.length > 0 && (
            <tfoot className="bg-slate-800 border-t border-slate-700">
              {typeof footer === 'function' ? footer(sortedData) : footer}
            </tfoot>
          )}
        </table>
      </div>

      {/* Bottom Controls */}
      {showPagination && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
          {/* Entries Info */}
          <div className="text-sm text-slate-400">
            Showing {startEntry} to {endEntry} of {sortedData.length} entries
            {searchTerm && ` (filtered from ${data.length} total entries)`}
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-slate-700 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300"
            >
              Previous
            </button>

            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-3 py-1 text-slate-500">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm border rounded ${
                    currentPage === page
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {page}
                </button>
              )
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-slate-700 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
