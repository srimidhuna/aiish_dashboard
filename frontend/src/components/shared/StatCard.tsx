import { Card, CardContent } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  subtext?: string;
  tone?: 'default' | 'warning' | 'danger';
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  subtext,
  tone = 'default',
  onClick,
  loading,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'hover:shadow-lg transition-shadow',
        onClick && 'cursor-pointer',
        tone === 'warning' && 'bg-amber-500/5',
        tone === 'danger' && 'bg-destructive/5',
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              'rounded-full p-2.5',
              tone === 'warning' && 'bg-amber-500/10 text-amber-600',
              tone === 'danger' && 'bg-destructive/10 text-destructive',
              tone === 'default' && 'bg-primary/10 text-primary',
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
