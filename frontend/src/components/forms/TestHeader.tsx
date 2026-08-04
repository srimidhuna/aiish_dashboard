import { CheckCircle2, AlertCircle } from 'lucide-react';

export function TestHeader({
  step, title, status,
}: { step: number; title: string; status: 'active' | 'pass' | 'fail' }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {step}
        </span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      {status === 'pass' && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="h-3 w-3" /> PASS — No further tests needed
        </span>
      )}
      {status === 'fail' && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
          <AlertCircle className="h-3 w-3" /> Refer — Next test required
        </span>
      )}
    </div>
  );
}
