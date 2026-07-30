import { useQuery } from '@tanstack/react-query';
import { mastersService } from '../../services/api';
import { Skeleton } from '../ui/Skeleton';

interface RecommendationSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function RecommendationSelector({ selectedIds, onChange }: RecommendationSelectorProps) {
  const { data: recommendationTypes, isLoading } = useQuery({
    queryKey: ['recommendation-types'],
    queryFn: () => mastersService.listRecommendationTypes(),
  });

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id]);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendationTypes?.map((rec) => (
          <div key={rec.id} className="flex items-start space-x-3">
            <input
              type="checkbox"
              id={rec.id}
              checked={selectedIds.includes(rec.id)}
              onChange={() => toggle(rec.id)}
              className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor={rec.id} className="text-sm font-medium leading-none">
              {rec.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
