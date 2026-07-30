import { TimelineEvent } from '../../types';

interface TimelineCardProps {
  event: TimelineEvent;
}

export function TimelineCard({ event }: TimelineCardProps) {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20 mt-1.5" />
        <div className="w-px h-full bg-border group-last:bg-transparent mt-2" />
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{event.title}</p>
          <span className="text-xs text-muted-foreground">
            {new Date(event.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
      </div>
    </div>
  );
}
