import { useState, useEffect } from 'react';
import { AlertCircle, Check } from 'lucide-react';

export const COMMON_CNT_REASONS = [
  { id: 'Crying', label: 'Crying' },
  { id: 'Noise', label: 'Noise / Ambient Noise' },
  { id: 'Poor probe fit', label: 'Poor Probe Fit' },
  { id: 'Restless baby', label: 'Restless Baby' },
  { id: 'Other', label: 'Other' },
];

interface CntReasonSelectorProps {
  value?: string;
  onChange: (val: string) => void;
  title?: string;
  description?: string;
  className?: string;
}

export function CntReasonSelector({
  value = '',
  onChange,
  title = 'Reason for CNT (Could Not Test)',
  description = 'Please select or specify why the screening could not be completed:',
  className = '',
}: CntReasonSelectorProps) {
  // Determine if value matches a preset
  const matchedPreset = COMMON_CNT_REASONS.find(
    (p) => p.label.toLowerCase() === value.trim().toLowerCase()
  );

  const [selectedPreset, setSelectedPreset] = useState<string>(
    matchedPreset ? matchedPreset.label : value ? 'Other' : ''
  );
  const [customText, setCustomText] = useState<string>(
    matchedPreset ? '' : value
  );

  useEffect(() => {
    const match = COMMON_CNT_REASONS.find(
      (p) => p.label.toLowerCase() === (value || '').trim().toLowerCase()
    );
    if (match) {
      setSelectedPreset(match.label);
      setCustomText('');
    } else if (value) {
      setSelectedPreset('Other');
      setCustomText(value);
    } else {
      setSelectedPreset('');
      setCustomText('');
    }
  }, [value]);

  const handleSelectPreset = (label: string) => {
    setSelectedPreset(label);
    if (label === 'Other') {
      onChange(customText || '');
    } else {
      onChange(label);
    }
  };

  const handleCustomChange = (text: string) => {
    setCustomText(text);
    onChange(text);
  };

  return (
    <div
      className={`rounded-xl border border-amber-300/80 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/80 p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200 ${className}`}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <h4 className="font-semibold text-sm text-amber-950 dark:text-amber-200">
          {title}
        </h4>
      </div>
      <p className="text-xs text-amber-800/90 dark:text-amber-300">
        {description}
      </p>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-2 pt-1">
        {COMMON_CNT_REASONS.map((preset) => {
          const isSelected = selectedPreset === preset.label;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.label)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shadow-sm ${
                isSelected
                  ? 'bg-amber-600 text-white border-amber-700 dark:bg-amber-600 dark:text-white'
                  : 'bg-white/90 text-amber-900 border-amber-200 hover:bg-amber-100/70 dark:bg-card dark:text-amber-200 dark:border-amber-800 dark:hover:bg-amber-900/40'
              }`}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom input if Other is selected or text typed */}
      {(selectedPreset === 'Other' || (selectedPreset && selectedPreset !== 'Other')) && (
        <div className="pt-1">
          {selectedPreset === 'Other' ? (
            <input
              type="text"
              value={customText}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="Specify reason (e.g., crying, noise, poor probe fit, equipment issue)..."
              className="flex h-9 w-full rounded-md border border-amber-300 bg-white px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-background dark:border-amber-800"
              autoFocus
            />
          ) : (
            <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 pt-0.5">
              <span>Selected reason: <strong className="font-semibold">{selectedPreset}</strong></span>
              <button
                type="button"
                onClick={() => handleSelectPreset('Other')}
                className="text-[11px] underline hover:text-amber-900 dark:hover:text-amber-100"
              >
                Add more details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
