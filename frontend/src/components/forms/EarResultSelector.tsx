import { UseFormRegister, FieldValues, Path } from 'react-hook-form';

const OPTION_LABELS: Record<string, string> = {
  pass: 'Pass',
  refer: 'Refer',
  noisy: 'Noisy',
  cnt: 'CNT',
  not_done: 'Not Done',
};

interface EarResultSelectorProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  name: Path<T>;
  label: string;
  /** Which result options to offer — TEOAE/DPOAE support 'noisy', AABR passes do not. */
  options?: string[];
}

export function EarResultSelector<T extends FieldValues>({
  register,
  name,
  label,
  options = ['pass', 'refer', 'noisy', 'cnt', 'not_done'],
}: EarResultSelectorProps<T>) {
  return (
    <div className="space-y-2 p-4 rounded-md border bg-card">
      <h4 className="font-semibold text-sm text-card-foreground">{label}</h4>
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => (
          <label key={opt} className="flex items-center space-x-2">
            <input type="radio" value={opt} {...register(name)} className="text-primary" />
            <span className="text-sm">{OPTION_LABELS[opt]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
