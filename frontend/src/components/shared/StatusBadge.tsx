import { Badge, type BadgeProps } from '../ui/Badge';

type Kind = 'screeningResult' | 'gender' | 'followUpStatus' | 'screeningStatus';

interface StatusBadgeProps {
  kind: Kind;
  value: string;
}

function variantFor(kind: Kind, value: string): BadgeProps['variant'] {
  const v = value.toUpperCase();
  switch (kind) {
    case 'screeningResult':
      if (v === 'PASS') return 'default';
      if (v === 'REFER') return 'destructive';
      return 'outline';
    case 'gender':
      return 'secondary';
    case 'followUpStatus':
      if (v === 'SCHEDULED') return 'default';
      if (v === 'COMPLETED') return 'secondary';
      if (v === 'MISSED' || v === 'LOST_TO_FOLLOWUP') return 'destructive';
      return 'outline';
    case 'screeningStatus':
      if (v === 'COMPLETED') return 'default';
      if (v === 'DRAFT') return 'outline';
      return 'secondary';
    default:
      return 'outline';
  }
}

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ kind, value }: StatusBadgeProps) {
  return <Badge variant={variantFor(kind, value)}>{formatLabel(value)}</Badge>;
}
