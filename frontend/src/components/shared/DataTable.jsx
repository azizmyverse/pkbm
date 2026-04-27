import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SkeletonTable from './SkeletonTable';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchable = true,
  searchPlaceholder = 'Cari...',
  emptyText = 'Tidak ada data',
  pagination,
  onPageChange,
  onSearch,
  rowKey = 'id',
}) {
  const [internalSearch, setInternalSearch] = useState('');

  const filtered = useMemo(() => {
    if (onSearch || !searchable || !internalSearch) return data;
    const q = internalSearch.toLowerCase();
    return data.filter((row) =>
      columns.some((c) => {
        const v = c.accessor ? row[c.accessor] : '';
        return v != null && String(v).toLowerCase().includes(q);
      }),
    );
  }, [data, internalSearch, columns, onSearch, searchable]);

  const totalPages = pagination
    ? Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || 10)))
    : 1;

  return (
    <div className="space-y-3">
      {searchable ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={internalSearch}
              onChange={(e) => {
                setInternalSearch(e.target.value);
                onSearch?.(e.target.value);
              }}
              placeholder={searchPlaceholder}
            />
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key || c.accessor} className={c.headerClassName}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-4">
                  <SkeletonTable rows={5} cols={columns.length} />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row, i) => (
                <TableRow key={row[rowKey] ?? i}>
                  {columns.map((c) => (
                    <TableCell key={c.key || c.accessor} className={c.className}>
                      {c.cell ? c.cell(row) : row[c.accessor]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.total > pagination.limit ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Halaman {pagination.page} dari {totalPages} • {pagination.total} data
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.min(totalPages, pagination.page + 1))}
              disabled={pagination.page >= totalPages}
            >
              Berikutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
