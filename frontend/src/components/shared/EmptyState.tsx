import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="p-16 flex flex-col items-center justify-center text-center space-y-3">
      <Icon className="h-12 w-12 text-muted-foreground/50" />
      <p className="text-lg font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground/80">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
