import { UseFormRegister, FieldValues, Path } from 'react-hook-form';

interface ReflexSelectorProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  name: Path<T>;
  label: string;
}

export function ReflexSelector<T extends FieldValues>({
  register,
  name,
  label,
}: ReflexSelectorProps<T>) {
  return (
    <div className="flex items-center justify-between p-3 rounded-md border bg-card">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-4">
        <label className="flex items-center space-x-2">
          <input type="radio" value="normal" {...register(name)} className="text-primary" />
          <span className="text-sm">Normal</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="radio" value="abnormal" {...register(name)} className="text-primary" />
          <span className="text-sm">Abnormal</span>
        </label>
      </div>
    </div>
  );
}
