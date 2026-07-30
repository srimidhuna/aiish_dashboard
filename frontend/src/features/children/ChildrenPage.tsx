import { useQuery } from '@tanstack/react-query';
import { childrenService, screeningsService } from '../../services/api';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { Search, Plus, Download, Calendar, ChevronDown } from 'lucide-react';
import type { Child, Screening } from '../../types';

import { cn } from '../../lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcAge(dob: string): string {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return '—';
  const now = new Date();
  const days = Math.floor((now.getTime() - birth.getTime()) / 86_400_000);
  if (days < 0) return '—';
  if (days < 60) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return months > 0 ? `${years}y ${months}mo` : `${years}y`;
}

function boaLabel(result?: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    pass: { label: 'Pass', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    refer: { label: 'Refer', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
    cnt: { label: 'CNT', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    not_done: { label: 'Not Done', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
    noisy: { label: 'Noisy', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  };
  return map[result ?? ''] ?? { label: '—', cls: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500' };
}

// ── Time-filter helpers ───────────────────────────────────────────────────────

type TimeFilter = 'all' | 'week' | 'month' | 'year';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => currentYear - i);

function passesTimeFilter(
  child: Child,
  filter: TimeFilter,
  selectedMonth: number | null,
  selectedYear: number | null,
): boolean {
  const reg = new Date(child.createdAt);
  if (isNaN(reg.getTime())) return true;

  if (filter === 'week') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return reg >= cutoff;
  }
  if (filter === 'month') {
    const now = new Date();
    const m = selectedMonth ?? now.getMonth();
    const y = selectedYear ?? now.getFullYear();
    return reg.getFullYear() === y && reg.getMonth() === m;
  }
  if (filter === 'year') {
    const y = selectedYear ?? new Date().getFullYear();
    return reg.getFullYear() === y;
  }
  return true;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChildrenPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') ?? '';

  // Time filter state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;

  const updateSearch = (val: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) next.set('search', val); else next.delete('search');
      return next;
    });
    setPage(1);
  };

  const { data: children = [], isLoading: cLoading } = useQuery({
    queryKey: ['children', search],
    queryFn: () => childrenService.list({ search }),
  });

  const { data: screenings = [], isLoading: sLoading } = useQuery({
    queryKey: ['screenings', 'all'],
    queryFn: () => screeningsService.list(),
  });

  const isLoading = cLoading || sLoading;

  const getLatestScreening = (childId: string): Screening | undefined => {
    return screenings
      .filter((s) => s.childId === childId && s.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  // Apply time filter + sort
  const filtered = useMemo(() => {
    let list = children.filter((c) =>
      passesTimeFilter(c, timeFilter, selectedMonth, selectedYear),
    );

    list = [...list].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      if (sortConfig.key === 'name') {
        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (sortConfig.key === 'createdAt' || sortConfig.key === 'dateOfBirth') {
        aVal = new Date((a as any)[sortConfig.key]).getTime();
        bVal = new Date((b as any)[sortConfig.key]).getTime();
      } else if (sortConfig.key === 'motherName') {
        aVal = a.motherName.toLowerCase();
        bVal = b.motherName.toLowerCase();
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [children, timeFilter, selectedMonth, selectedYear, sortConfig]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortConfig.key !== col) return <span className="text-muted-foreground/40 ml-1">↕</span>;
    return <span className="text-primary ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  // CSV export
  const handleExport = () => {
    if (!filtered.length) return;
    const escape = (v: unknown) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = ['Unique Mother ID', 'Baby Name', 'Gender', 'Age', "Mother's Name", 'Mobile Number', 'BOA Result'];
    const rows = filtered.map((c) => {
      const s = getLatestScreening(c.id);
      return [
        escape(c.uniqueMotherId ?? ''),
        escape(`${c.firstName} ${c.lastName}`),
        escape(c.gender),
        escape(calcAge(c.dateOfBirth)),
        escape(c.motherName),
        escape(c.contactNumber ?? ''),
        escape(s?.boaResult ?? ''),
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `children-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── Page header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Children Registry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => navigate('/children/register')}>
            <Plus className="mr-2 h-4 w-4" /> Register Child
          </Button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        {/* Row 1: search + time quick-select */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or hospital number..."
              className="pl-9"
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
            />
          </div>

          {/* Time quick-select pills */}
          <div className="flex items-center gap-1.5 bg-muted rounded-xl p-1">
            <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
            {(['all', 'week', 'month', 'year'] as TimeFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setTimeFilter(f); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  timeFilter === f
                    ? 'bg-card shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f === 'all' ? 'All Time' : f === 'week' ? 'Past Week' : f === 'month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: month / year pickers (conditional) */}
        {(timeFilter === 'month' || timeFilter === 'year') && (
          <div className="flex flex-wrap gap-3 items-center pt-1">
            {timeFilter === 'month' && (
              <div className="relative">
                <select
                  value={selectedMonth ?? new Date().getMonth()}
                  onChange={(e) => { setSelectedMonth(Number(e.target.value)); setPage(1); }}
                  className="h-9 appearance-none pl-3 pr-8 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            )}
            <div className="relative">
              <select
                value={selectedYear ?? currentYear}
                onChange={(e) => { setSelectedYear(Number(e.target.value)); setPage(1); }}
                className="h-9 appearance-none pl-3 pr-8 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
            <span className="text-xs text-muted-foreground">
              Showing registrations from{' '}
              {timeFilter === 'month'
                ? `${MONTHS[selectedMonth ?? new Date().getMonth()]} ${selectedYear ?? currentYear}`
                : `${selectedYear ?? currentYear}`}
            </span>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Search className="h-8 w-8 text-violet-400" />
          </div>
          <p className="text-lg font-semibold text-foreground">No records found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or date filter.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {[
                    { key: 'uniqueMotherId', label: 'Unique Mother ID', sortable: false },
                    { key: 'name', label: 'Baby Name', sortable: true },
                    { key: 'gender', label: 'Gender', sortable: false },
                    { key: 'dateOfBirth', label: 'Age', sortable: true },
                    { key: 'motherName', label: "Mother's Name", sortable: true },
                    { key: 'contactNumber', label: 'Mobile Number', sortable: false },
                    { key: 'boaResult', label: 'BOA Result', sortable: false },
                    { key: 'createdAt', label: 'Registered On', sortable: true },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap select-none',
                        col.sortable && 'cursor-pointer hover:text-foreground transition-colors',
                      )}
                    >
                      {col.label}
                      {col.sortable && <SortIcon col={col.key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((child) => {
                  const screening = getLatestScreening(child.id);
                  const boa = boaLabel(screening?.boaResult);
                  return (
                    <tr
                      key={child.id}
                      onClick={() => navigate(`/children/${child.id}`)}
                      className="hover:bg-muted/50 cursor-pointer transition-colors group"
                    >
                      {/* Unique Mother ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {child.uniqueMotherId ?? <span className="italic text-muted-foreground/50">—</span>}
                        </span>
                      </td>

                      {/* Baby Name */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {child.firstName} {child.lastName}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="px-4 py-3 text-sm text-foreground">
                        {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}
                      </td>

                      {/* Age */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{calcAge(child.dateOfBirth)}</span>
                      </td>

                      {/* Mother's Name */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">
                          {child.motherName}
                        </span>
                      </td>

                      {/* Mobile Number */}
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {child.contactNumber ?? '—'}
                      </td>

                      {/* BOA Result */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            boa.cls,
                          )}
                        >
                          {boa.label}
                        </span>
                      </td>

                      {/* Registered On */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">
                          {child.createdAt
                            ? new Date(child.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-sm text-muted-foreground">
              <span>
                Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border transition-colors',
                        p === page
                          ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold'
                          : 'border-border hover:bg-muted',
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
