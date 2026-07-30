import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from './EmptyState';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right';
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or search terms.',
  onRowClick,
  sortKey,
  sortDir,
  onSort,
  page,
  pageSize,
  onPageChange,
}: DataTableProps<T>) {
  const paginated =
    page && pageSize ? rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize) : rows;
  const totalPages = page && pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-6 py-3 font-medium ${col.sortable ? 'cursor-pointer hover:bg-muted/80' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
                      onClick={() => col.sortable && onSort?.(col.key)}
                    >
                      {col.header}
                      {col.sortable && sortKey === col.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className={`border-b hover:bg-muted/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''}`}
                        onClick={col.align === 'right' ? (e) => e.stopPropagation() : undefined}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && rows.length > 0 && page && pageSize && onPageChange && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, rows.length)} of{' '}
            {rows.length} entries
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
