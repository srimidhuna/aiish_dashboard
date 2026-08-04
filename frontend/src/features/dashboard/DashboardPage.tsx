import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, analyticsService } from '../../services/api';
import type { ParentDistrictRow } from '../../services/api/analyticsService';
import { useNavigate, useSearchParams } from 'react-router-dom';
// Removed toast import
import {
  Users,
  Activity,
  Clock,
  AlertTriangle,
  Hospital,
  Plus,
  X,
} from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTheme } from '../../components/ThemeProvider';
import { IndiaMap, StateData } from './components/IndiaMap';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';

// ─── Sparkline with soft gradient fill ───────────────────────────────────────
function Sparkline({ color, points, id }: { color: string; points: number[]; id: string }) {
  const w = 200, h = 48, padTop = 4, padBot = 2;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((v) => padTop + ((max - v) / range) * (h - padTop - padBot));

  // Smooth cubic bezier path
  let linePath = `M ${xs[0]},${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2;
    linePath += ` C ${cpx},${ys[i - 1]} ${cpx},${ys[i]} ${xs[i]},${ys[i]}`;
  }

  const fillPath = linePath + ` L ${w},${h} L 0,${h} Z`;
  const gradId = `spark-grad-${id}`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMax meet" fill="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={linePath} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Donut chart with center label ───────────────────────────────────────────
function DonutChart({ male, female, isDark }: { male: number; female: number; isDark: boolean }) {
  const total = male + female;
  const denom = total || 1;
  const malePct = male / denom;
  const r = 44, cx = 60, cy = 60, stroke = 14;
  const circ = 2 * Math.PI * r;
  const maleDash = malePct * circ;
  const femaleDash = (1 - malePct) * circ;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {/* Female arc (background) */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? '#ab5e85' : '#f472b6'} strokeWidth={stroke}
        strokeDasharray={`${femaleDash} ${circ}`}
        strokeDashoffset={-maleDash}
        transform={`rotate(-90 ${cx} ${cy})`} />
      {/* Male arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? '#5c60a6' : '#6366f1'} strokeWidth={stroke}
        strokeDasharray={`${maleDash} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`} />
      {/* Center hole */}
      <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} style={{ fill: 'hsl(var(--card))' }} />
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" style={{ fill: 'hsl(var(--foreground))' }} fontSize="18" fontWeight="bold">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" style={{ fill: 'hsl(var(--muted-foreground))' }} fontSize="9">total</text>
    </svg>
  );
}

// ─── Mini donut for percentages ──────────────────────────────────────────────
function MiniDonut({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2, cx = size / 2, cy = size / 2, sw = 6;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-muted" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r - sw / 2 - 1} style={{ fill: 'hsl(var(--card))' }} />
    </svg>
  );
}

// ─── Generate sparkline points from actual value ─────────────────────────────
function generateSparkPoints(val: number): number[] {
  if (val === 0) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  // Build a gentle upward trend ending at the actual value
  const steps = 12;
  const points: number[] = [];
  for (let i = 0; i < steps; i++) {
    const progress = i / (steps - 1);
    // Base value grows from ~20% of val to val
    const base = val * (0.2 + 0.8 * progress);
    // Add slight variation (±15% of current base), seeded by index for consistency
    const variation = base * 0.15 * Math.sin(i * 2.3 + val * 0.7);
    points.push(Math.max(0, Math.round(base + variation)));
  }
  // Ensure the last point is the actual value
  points[points.length - 1] = val;
  return points;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  iconBg: string;
  icon: React.ReactNode;
  trend: string;
  trendColor: string;
  sparkColor: string;
  sparkValue: number;
  sparkId: string;
  onClick?: () => void;
}
function StatCard({ label, value, iconBg, icon, trend, trendColor, sparkColor, sparkValue, sparkId, onClick }: StatCardProps) {
  const sparkPoints = generateSparkPoints(sparkValue);
  return (
    <div 
      className={`bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col min-w-0 transition-shadow duration-300 ${onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : 'hover:shadow-md'}`}
      onClick={onClick}
    >
      <div className="px-5 pt-5 pb-3 flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-3xl font-extrabold text-foreground leading-none">{value}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trendColor}`}>{trend}</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium leading-tight mt-1">{label}</p>
        </div>
      </div>
      <div className="mt-auto">
        <Sparkline color={sparkColor} points={sparkPoints} id={sparkId} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [showTodayResults, setShowTodayResults] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedState = searchParams.get('state') ?? undefined;
  const selectedYear = searchParams.get('year') ?? new Date().getFullYear().toString();
  const viewBy = (searchParams.get('viewBy') ?? 'yearly') as 'yearly' | 'monthly' | 'daily';
  const selectedMonth = searchParams.get('month') ?? undefined;
  const selectedDay = searchParams.get('day') ?? undefined;
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Build filter params object
  const dateParams = {
    year: selectedYear,
    ...(viewBy !== 'yearly' && selectedMonth ? { month: selectedMonth } : {}),
    ...(viewBy === 'daily' && selectedDay ? { day: selectedDay } : {}),
  };

  // Month names for display
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Days in the currently selected month
  const daysInSelectedMonth = selectedMonth
    ? new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate()
    : 31;

  const { data: availableYears, isLoading: yLoading } = useQuery({
    queryKey: ['available-years'],
    queryFn: dashboardService.getAvailableYears,
  });

  const { data: overview, isLoading: oLoading } = useQuery({
    queryKey: ['dashboard-overview', dateParams.year, dateParams.month, dateParams.day],
    queryFn: () => dashboardService.getOverview(dateParams),
  });

  const { data: analytics, isLoading: aLoading } = useQuery({
    queryKey: ['analytics', dateParams.year, dateParams.month, dateParams.day],
    queryFn: () => analyticsService.getAnalytics(dateParams),
    staleTime: 0,
    refetchInterval: 60_000, // auto-refresh every 60 s
  });

  const { data: todaysFollowUps, isLoading: hLoading } = useQuery({
    queryKey: ['dashboard-todays-follow-ups', dateParams.year, dateParams.month, dateParams.day],
    queryFn: () => dashboardService.getTodaysFollowUps(dateParams),
  });

  const isLoading = oLoading || aLoading || hLoading || yLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const male = analytics?.genderDist.find((g) => g.name === 'Male')?.value ?? 0;
  const female = analytics?.genderDist.find((g) => g.name === 'Female')?.value ?? 0;
  const totalGender = male + female;

  const stateRows = analytics?.statePerformance ?? [];
  // Use parentStatePerformance for the map (reflects where parents actually live)
  const parentStateRows = analytics?.parentStatePerformance ?? [];
  const mapStateRows = parentStateRows.length > 0 ? parentStateRows : stateRows;
  // District drill-down from parentDistrictPerformance
  const parentDistrictRows: ParentDistrictRow[] = analytics?.parentDistrictPerformance ?? [];

  // Monthly screening data from API
  const monthlyData = analytics?.monthlyData ?? [];

  // Age-wise distribution from API
  const rawAgeData = analytics?.ageData ?? [];
  const ageColorsDark = ['#5c60a6', '#7d63a6', '#ab5e85', '#b38342', '#488f72'];
  const ageColorsLight = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const ageData = rawAgeData.map((d, i) => ({
    ...d,
    color: isDark ? ageColorsDark[i % ageColorsDark.length] : ageColorsLight[i % ageColorsLight.length]
  }));

  // Max screenings for progress bar scaling (based on mapStateRows = parentStatePerformance)
  const maxScreenings = Math.max(...mapStateRows.map(s => s.screenings), 1);

  // Progress bar colors per state row
  const stateBarColors = isDark 
    ? ['#5c60a6', '#7d63a6', '#ab5e85', '#b38342', '#488f72']
    : ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Overview Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View By segmented control */}
          <div className="flex rounded-xl border border-border bg-muted/50 p-0.5 shadow-sm">
            {(['yearly', 'monthly', 'daily'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.set('viewBy', mode);
                    if (mode === 'yearly') { next.delete('month'); next.delete('day'); }
                    if (mode === 'monthly') {
                      if (!next.get('month')) next.set('month', (new Date().getMonth() + 1).toString());
                      next.delete('day');
                    }
                    if (mode === 'daily') {
                      if (!next.get('month')) next.set('month', (new Date().getMonth() + 1).toString());
                      if (!next.get('day')) next.set('day', new Date().getDate().toString());
                    }
                    return next;
                  });
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewBy === mode
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Year dropdown (always shown) */}
          <select
            value={selectedYear}
            onChange={(e) => {
              setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set('year', e.target.value);
                return next;
              });
            }}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm cursor-pointer appearance-none pr-7"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 8px center', backgroundRepeat: 'no-repeat', backgroundSize: '14px' }}
          >
            {availableYears?.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Month dropdown (shown for monthly & daily) */}
          {(viewBy === 'monthly' || viewBy === 'daily') && (
            <select
              value={selectedMonth ?? ''}
              onChange={(e) => {
                setSearchParams(prev => {
                  const next = new URLSearchParams(prev);
                  next.set('month', e.target.value);
                  next.delete('day');
                  return next;
                });
              }}
              className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm cursor-pointer appearance-none pr-7"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 8px center', backgroundRepeat: 'no-repeat', backgroundSize: '14px' }}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={(i + 1).toString()}>{name}</option>
              ))}
            </select>
          )}

          {/* Day dropdown (shown for daily) */}
          {viewBy === 'daily' && (
            <select
              value={selectedDay ?? ''}
              onChange={(e) => {
                setSearchParams(prev => {
                  const next = new URLSearchParams(prev);
                  next.set('day', e.target.value);
                  return next;
                });
              }}
              className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm cursor-pointer appearance-none pr-7"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 8px center', backgroundRepeat: 'no-repeat', backgroundSize: '14px' }}
            >
              {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map(d => (
                <option key={d} value={d.toString()}>{d}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => navigate('/children/register')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
          >
            <Plus className="h-4 w-4" /> Register Child
          </button>
        </div>
      </div>

      {/* ── KPI Row — 6 cards ── */}
      <div className="grid grid-cols-6 gap-3">
        <StatCard
          label="Active Hospitals" value={overview?.activeHospitals ?? 0}
          iconBg="bg-emerald-100" icon={<Hospital className="h-5 w-5 text-emerald-600" />}
          trend={`↑4%`} trendColor="bg-emerald-100 text-emerald-600"
          sparkColor="#10b981" sparkId="hospitals" sparkValue={overview?.activeHospitals ?? 0}
        />
        <StatCard
          label="Total Screened" value={overview?.totalRegistered ?? 0}
          iconBg="bg-indigo-100" icon={<Users className="h-5 w-5 text-indigo-600" />}
          trend={`↑12%`} trendColor="bg-emerald-100 text-emerald-600"
          sparkColor="#6366f1" sparkId="registered" sparkValue={overview?.totalRegistered ?? 0}
        />
        <StatCard
          label="Number of Babies Referred" value={overview?.highRiskBabies ?? 0}
          iconBg="bg-red-100" icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          trend={`↑2%`} trendColor="bg-red-100 text-red-500"
          sparkColor="#ef4444" sparkId="highrisk" sparkValue={overview?.highRiskBabies ?? 0}
        />
        <StatCard
          label="Today's Screenings" value={overview?.todaysScreenings ?? 0}
          iconBg="bg-sky-100" icon={<Activity className="h-5 w-5 text-sky-500" />}
          trend={`↑9%`} trendColor="bg-emerald-100 text-emerald-600"
          sparkColor="#0ea5e9" sparkId="screenings" sparkValue={overview?.todaysScreenings ?? 0}
          onClick={() => setShowTodayResults((prev) => !prev)}
        />
        <StatCard
          label="Reappearing for Screening" value={overview?.rescreeningRequired ?? 0}
          iconBg="bg-amber-100" icon={<Clock className="h-5 w-5 text-amber-500" />}
          trend={`↑5%`} trendColor="bg-emerald-100 text-emerald-600"
          sparkColor="#f59e0b" sparkId="rescreening" sparkValue={overview?.rescreeningRequired ?? 0}
        />
        <StatCard
          label="Today's Follow-ups" value={overview?.todaysFollowUps ?? 0}
          iconBg="bg-purple-100" icon={<Clock className="h-5 w-5 text-purple-600" />}
          trend={`↑3%`} trendColor="bg-emerald-100 text-emerald-600"
          sparkColor="#a855f7" sparkId="todaysFollowUps" sparkValue={overview?.todaysFollowUps ?? 0}
        />
      </div>

      {showTodayResults && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex gap-8 px-2">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Pass Results</p>
              <p className="text-2xl font-bold text-emerald-600">{overview?.todaysPass ?? 0}</p>
            </div>
            <div className="w-px bg-border my-1"></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Refer Results</p>
              <p className="text-2xl font-bold text-red-600">{overview?.todaysRefer ?? 0}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowTodayResults(false)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* ── Middle Row: Map | State Summary ── */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-7 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">State-wise Screening</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300">
                  By Parent Home State
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Darker shades = higher registrations</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedState && (
                <button
                  onClick={() => setSearchParams((p) => { p.delete('state'); return p; })}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
              <select
                className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card text-foreground"
                value={selectedState ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchParams((p) => { if (v) p.set('state', v); else p.delete('state'); return p; });
                }}
              >
                <option value="">All States</option>
                {mapStateRows.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="relative" style={{ height: '340px' }}>
            <IndiaMap
              data={mapStateRows as StateData[]}
              selectedState={selectedState}
              onSelectState={(state) => setSearchParams((p) => { p.set('state', state); return p; })}
            />
            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-500 dark:bg-emerald-400" />
                <span className="text-[10px] text-muted-foreground">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-500/50 dark:bg-emerald-400/50" />
                <span className="text-[10px] text-muted-foreground">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-500/15 dark:bg-emerald-400/15" />
                <span className="text-[10px] text-muted-foreground">Low</span>
              </div>
            </div>
          </div>
        </div>

        {/* National State Summary / District Summary */}
        <div className="col-span-5 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              {selectedState && (
                <button
                  onClick={() => setSearchParams((p) => { p.delete('state'); return p; })}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Back to states"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <p className="text-sm font-bold text-foreground">
                {selectedState ? `${selectedState} — District Summary` : 'National State Summary'}
              </p>
            </div>
            <button className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">View all</button>
          </div>
          <div className="flex-1 overflow-auto">
            {selectedState ? (
              /* ── District-wise table when a state is selected ── */
              (() => {
                const districts = parentDistrictRows.filter(
                  (d) => d.state === selectedState
                );
                return (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-5 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide">District</th>
                        <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wide">Registered</th>
                        <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wide">
                          <span className="flex items-center justify-center gap-1">
                            Pass
                          </span>
                        </th>
                        <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wide">
                          <span className="flex items-center justify-center gap-1">
                            Refer
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {districts.length > 0 ? districts.map((d) => (
                        <tr
                          key={d.name}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-semibold text-indigo-600 dark:text-indigo-400">{d.name}</td>
                          <td className="px-3 py-3.5 text-center text-foreground font-medium">{d.registered}</td>
                          <td className="px-3 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">
                              {d.passes}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-semibold">
                              {d.refers}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No district data available for this state</td></tr>
                      )}
                    </tbody>
                  </table>
                );
              })()
            ) : (
              /* ── State-level table (default) ── */
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide">State</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wide">Hospitals</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wide">Registered</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wide">Pass</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wide">Refer</th>
                  </tr>
                </thead>
                <tbody>
                  {mapStateRows.map((s) => (
                    <tr
                      key={s.name}
                      className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSearchParams((p) => { p.set('state', s.name); return p; })}
                    >
                      <td className="px-5 py-3.5 font-semibold text-indigo-600 dark:text-indigo-400">{s.name}</td>
                      <td className="px-3 py-3.5 text-center text-foreground">{s.hospitals}</td>
                      <td className="px-3 py-3.5 text-center text-foreground">{s.registered}</td>
                      <td className="px-3 py-3.5 text-center text-foreground">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">
                          {s.passes}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center text-foreground">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-semibold">
                          {s.refers}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {mapStateRows.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No data available — register children with parent state to see map data</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Charts Row: Monthly Trend | Gender | Age-wise ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Screening Trend */}
        <div className="col-span-4 bg-card rounded-2xl border border-border shadow-sm p-5">
          <p className="text-sm font-bold text-foreground">
            {viewBy === 'daily' ? 'Hourly Screening Trend' : viewBy === 'monthly' ? 'Daily Screening Trend' : 'Monthly Screening Trend'}
          </p>
          <p className="text-[11px] text-muted-foreground mb-3">
            {viewBy === 'daily' ? 'Screenings by hour' : viewBy === 'monthly' ? 'Screenings by day' : 'Screenings by month'}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeOpacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <ReTooltip
                contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb', backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}
              />
              <Line
                type="monotone" dataKey="value" stroke={isDark ? '#5c60a6' : '#6366f1'} strokeWidth={2.5}
                dot={{ fill: isDark ? '#5c60a6' : '#6366f1', r: 3 }} activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="col-span-4 bg-card rounded-2xl border border-border shadow-sm p-5">
          <p className="text-sm font-bold text-foreground mb-3">Gender Distribution</p>
          <div className="flex items-center justify-center gap-6">
            <DonutChart male={male} female={female} isDark={isDark} />
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-xs text-muted-foreground font-medium">Male</span>
                <span className="text-sm font-bold text-foreground ml-auto pl-3">
                  {male} ({totalGender ? Math.round((male / totalGender) * 100) : 0}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-pink-400 shrink-0" />
                <span className="text-xs text-muted-foreground font-medium">Female</span>
                <span className="text-sm font-bold text-foreground ml-auto pl-3">
                  {female} ({totalGender ? Math.round((female / totalGender) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Age-wise Distribution */}
        <div className="col-span-4 bg-card rounded-2xl border border-border shadow-sm p-5">
          <p className="text-sm font-bold text-foreground mb-3">Age-wise Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ageData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeOpacity={0.2} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={40} />
              <ReTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb', backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {ageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Row: Follow-up Rate | Referral Rate | High Risk Babies ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Follow-up Success Rate */}
        <div className="col-span-3 bg-card rounded-2xl border border-border shadow-sm p-5">
          <p className="text-sm font-bold text-foreground mb-1">Follow-up Success Rate</p>
          <p className="text-[10px] text-muted-foreground mb-4">Completed follow-ups out of all babies due for one</p>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <MiniDonut pct={analytics?.followUpSuccessRate ?? 0} color={isDark ? '#5c60a6' : '#6366f1'} size={64} />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-foreground">
                {analytics?.followUpSuccessRate ?? 0}%
              </span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                Real-time follow-up compliance
              </p>
            </div>
          </div>
        </div>

        {/* Referral Conversion Rate */}
        <div className="col-span-3 bg-card rounded-2xl border border-border shadow-sm p-5">
          <p className="text-sm font-bold text-foreground mb-1">Referral Conversion Rate</p>
          <p className="text-[10px] text-muted-foreground mb-4">Referred cases that received specialist care</p>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <MiniDonut pct={analytics?.referralConversionRate ?? 0} color={isDark ? '#ab5e85' : '#ec4899'} size={64} />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-foreground">
                {analytics?.referralConversionRate ?? 0}%
              </span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                Based on completed follow-ups
              </p>
            </div>
          </div>
        </div>

        {/* Today's Follow-ups horizontal cards */}
        <div className="col-span-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <p className="text-sm font-bold text-foreground">Today's Follow-ups</p>
            <button onClick={() => navigate('/follow-ups')} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              View all →
            </button>
          </div>
          <div className="flex items-center gap-3 px-5 py-4 overflow-x-auto">
            {(todaysFollowUps ?? []).slice(0, 5).map((f) => (
              <div
                key={f.id}
                className="flex flex-col items-center gap-2 min-w-[120px] p-3 rounded-xl border border-border hover:shadow-md cursor-pointer transition-all hover:border-indigo-200 dark:hover:border-indigo-800"
                onClick={() => navigate(`/children/${f.childId}`)}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {f.firstName.charAt(0)}
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-foreground truncate max-w-[100px]">{f.firstName} {f.lastName}</p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">{f.hospital}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400`}>
                  {f.status}
                </span>
              </div>
            ))}
            {(!todaysFollowUps || todaysFollowUps.length === 0) && (
              <p className="text-muted-foreground text-sm py-4 text-center w-full">No follow-ups for today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
