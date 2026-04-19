import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo, type ReactNode } from "react";

type SortDirection = "asc" | "desc" | null;

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  exportable?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  /** Max height of the table body scroll area, e.g. '400px'. Defaults to unconstrained. */
  maxHeight?: string;
  /** Extra toolbar content added between search and export */
  toolbarExtra?: ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  exportable = true,
  pageSize = 10,
  onRowClick,
  maxHeight,
  toolbarExtra,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Filter data based on search and column filters
  const filteredData = useMemo(() => {
    let filtered = data;

    // Global search
    if (searchQuery) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Column-specific filters
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter((row) =>
          String(row[key]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    return filtered;
  }, [data, searchQuery, columnFilters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (column: keyof T | string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleColumnFilterChange = (column: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setCurrentPage(1);
  };

  const handleExport = () => {
    const csvContent = [
      columns.map((col) => col.label).join(","),
      ...sortedData.map((row) =>
        columns
          .map((col) => {
            const value = row[col.key as keyof T];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `export-${new Date().toISOString()}.csv`;
    link.click();
  };

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    if (sortColumn === column.key) {
      return sortDirection === "asc" ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      );
    }

    return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Search and Export */}
      {(searchable || exportable) && (
        <div className="flex items-center justify-between gap-4">
          {searchable && (
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {toolbarExtra && <div className="flex items-center gap-2">{toolbarExtra}</div>}

          {exportable && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div
          className="overflow-auto"
          style={maxHeight ? { maxHeight } : undefined}
        >
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50"
                  >
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() =>
                          column.sortable !== false && handleSort(column.key)
                        }
                        className={`flex items-center gap-2 ${
                          column.sortable !== false
                            ? "cursor-pointer hover:text-gray-900"
                            : ""
                        }`}
                      >
                        {column.label}
                        {column.sortable !== false && renderSortIcon(column)}
                      </button>

                      {/* Column filter */}
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters[String(column.key)] || ""}
                        onChange={(e) =>
                          handleColumnFilterChange(
                            String(column.key),
                            e.target.value
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-transparent normal-case font-normal"
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${
                      onRowClick
                        ? "cursor-pointer hover:bg-indigo-50/40"
                        : "hover:bg-gray-50/60"
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className="px-4 py-3 text-sm text-gray-900"
                      >
                        {column.render
                          ? column.render(row)
                          : String(row[column.key as keyof T] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
              {sortedData.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
