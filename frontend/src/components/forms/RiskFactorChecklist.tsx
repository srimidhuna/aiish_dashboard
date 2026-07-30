import { useQuery } from '@tanstack/react-query';
import { mastersService } from '../../services/api';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';

interface RiskFactorChecklistProps {
  selectedIds: string[];
  onChange?: (ids: string[]) => void;
  readOnly?: boolean;
}

export function RiskFactorChecklist({ selectedIds, onChange, readOnly }: RiskFactorChecklistProps) {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['risk-categories'],
    queryFn: () => mastersService.listRiskCategories(),
  });

  const toggle = (id: string) => {
    if (!onChange) return;
    onChange(selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id]);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', readOnly && 'pointer-events-none opacity-90')}>
      <p className="text-sm text-muted-foreground mb-4">
        Select all applicable items from the High-Risk Register (medical professional checklist).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories?.map((rc) => (
          <div key={rc.id} className="flex items-start space-x-3">
            <input
              type="checkbox"
              id={rc.id}
              checked={selectedIds.includes(rc.id)}
              onChange={() => toggle(rc.id)}
              disabled={readOnly}
              className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor={rc.id} className="text-sm font-medium leading-none">
              {rc.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
