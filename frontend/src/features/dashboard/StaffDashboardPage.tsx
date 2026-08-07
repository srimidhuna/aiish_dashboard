import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { staffDashboardService } from '../../services/api/staffDashboardService';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTheme } from '../../components/ThemeProvider';
import {
  UserPlus,
  Repeat,
  Baby,
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

// ─── Sparkline (same pattern as admin dashboard) ─────────────────────────────
function Sparkline({ color, points, id }: { color: string; points: number[]; id: string }) {
  const w = 200, h = 48, padTop = 4, padBot = 2;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((v) => padTop + ((max - v) / range) * (h - padTop - padBot));
  let linePath = `M ${xs[0]},${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2;
    linePath += ` C ${cpx},${ys[i - 1]} ${cpx},${ys[i]} ${xs[i]},${ys[i]}`;
  }
  const fillPath = linePath + ` L ${w},${h} L 0,${h} Z`;
  const gradId = `staff-spark-${id}`;
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

function generateSparkPoints(val: number): number[] {
  if (val === 0) return [0, 0, 0, 0, 0, 0, 0, 0];
  const steps = 8;
  const points: number[] = [];
  for (let i = 0; i < steps; i++) {
    const progress = i / (steps - 1);
    const base = val * (0.2 + 0.8 * progress);
    const variation = base * 0.15 * Math.sin(i * 2.3 + val * 0.7);
    points.push(Math.max(0, Math.round(base + variation)));
  }
  points[points.length - 1] = val;
  return points;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon,
  iconBg,
  sparkColor,
  sparkId,
  onClick,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  iconBg: string;
  sparkColor: string;
  sparkId: string;
  onClick?: () => void;
}) {
  const points = generateSparkPoints(value);
  return (
    <div
      className={`bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col min-w-0 transition-all duration-300 hover:shadow-md ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
      onClick={onClick}
    >
      <div className="px-5 pt-5 pb-3 flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-3xl font-extrabold text-foreground leading-none">{value}</p>
          <p className="text-[11px] text-muted-foreground font-medium leading-tight mt-1">{label}</p>
        </div>
      </div>
      <div className="mt-auto">
        <Sparkline color={sparkColor} points={points} id={sparkId} />
      </div>
    </div>
  );
}



// ─── Screening Result Badge ───────────────────────────────────────────────────
function ScreeningBadge({ status, result }: { status: string | null; result: string | null }) {
  if (!status) {
    return (
      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
        Pending
      </span>
    );
  }
  if (status === 'completed') {
    if (result === 'pass') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
          Pass
        </span>
      );
    }
    if (result === 'refer') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
          Refer
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
        Completed
      </span>
    );
  }
  if (status === 'scheduled') {
    return (
      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">
        Scheduled
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground">
      {status}
    </span>
  );
}

// ─── Main Staff Dashboard ─────────────────────────────────────────────────────
export default function StaffDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const hospitalId = (user as any)?.hospitalId ?? '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['staff-overview', hospitalId],
    queryFn: () => staffDashboardService.getStaffOverview(hospitalId),
    enabled: !!hospitalId,
    staleTime: 60_000, // 1 minute
    refetchInterval: 120_000, // refresh every 2 min
  });

  if (!hospitalId) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
        <p className="text-muted-foreground text-sm">
          Your account is not assigned to a hospital. Please contact your administrator.
        </p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Overview Dashboard
          </h1>
        </div>
        {/* Role badge */}
        <span
          className="px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #9d4edd 0%, #5a189a 100%)'
              : 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
          }}
        >
          Audiologist
        </span>
      </div>

      {/* ── KPI Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[130px] rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl bg-destructive/10 text-destructive text-sm">
          Failed to load dashboard data. Please refresh the page.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            label="Today's Screenings"
            value={data?.todaysScreenings ?? 0}
            iconBg="bg-sky-100 dark:bg-sky-900/30"
            icon={<Activity className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
            sparkColor="#0ea5e9"
            sparkId="screenings"
          />
          <KpiCard
            label="Reappearing for Screening"
            value={data?.rescreeningRequired ?? 0}
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            icon={<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            sparkColor="#f59e0b"
            sparkId="resc"
            onClick={() => navigate('/rescreening')}
          />
          <KpiCard
            label="Today's Follow-ups"
            value={data?.todaysFollowUps ?? 0}
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            icon={<Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            sparkColor="#a855f7"
            sparkId="fup"
            onClick={() => navigate('/follow-ups')}
          />
        </div>
      )}

      {/* ── Bottom Row: Recent Children ── */}
      <div>
        {/* Recent Children */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Baby className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-bold text-foreground">Recent Registrations</h2>
            <span className="ml-auto text-[10px] text-muted-foreground">Your hospital</span>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data?.recentChildren?.length ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No children registered at your hospital yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left">
                    <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground">Name</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted-foreground">MR No.</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted-foreground">Registered</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted-foreground">Screening</th>
                    <th className="px-3 py-3 text-[11px] font-semibold text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentChildren.map((child) => (
                    <tr
                      key={child.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/children/${child.id}`)}
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        {child.firstName} {child.lastName}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground text-xs font-mono">
                        {child.mrNumber}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">
                        {new Date(child.registeredAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </td>
                      <td className="px-3 py-3">
                        <ScreeningBadge
                          status={child.lastScreeningStatus}
                          result={child.lastScreeningResult}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.recentChildren.length > 0 && (
            <div className="px-5 py-3 border-t border-border">
              <button
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                onClick={() => navigate('/children')}
              >
                View all children <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
