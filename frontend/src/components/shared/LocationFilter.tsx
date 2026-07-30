import { useQuery } from '@tanstack/react-query';
import { districtsService, hospitalsService, audiologistsService } from '../../services/api';

export interface LocationFilterValue {
  state?: string;
  districtId?: string;
  hospitalId?: string;
  audiologistId?: string;
}

interface LocationFilterProps {
  value: LocationFilterValue;
  onChange: (value: LocationFilterValue) => void;
  includeAudiologist?: boolean;
}

const selectClass = 'h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm';

export function LocationFilter({ value, onChange, includeAudiologist }: LocationFilterProps) {
  const { data: states } = useQuery({
    queryKey: ['districts', 'states'],
    queryFn: () => districtsService.listStates(),
  });
  const { data: districts } = useQuery({
    queryKey: ['districts', 'byState', value.state],
    queryFn: () => districtsService.listByState(value.state!),
    enabled: !!value.state,
  });
  const { data: hospitals } = useQuery({
    queryKey: ['hospitals', 'filter', value.districtId, value.state],
    queryFn: () => hospitalsService.list({ districtId: value.districtId, state: value.state }),
  });
  const { data: audiologists } = useQuery({
    queryKey: ['audiologists', value.hospitalId],
    queryFn: () => audiologistsService.list(value.hospitalId),
    enabled: !!includeAudiologist,
  });

  return (
    <>
      <select
        className={selectClass}
        value={value.state ?? ''}
        onChange={(e) =>
          onChange({
            state: e.target.value || undefined,
            districtId: undefined,
            hospitalId: undefined,
          })
        }
      >
        <option value="">All States</option>
        {states?.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={value.districtId ?? ''}
        onChange={(e) =>
          onChange({ ...value, districtId: e.target.value || undefined, hospitalId: undefined })
        }
        disabled={!value.state}
      >
        <option value="">All Districts</option>
        {districts?.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={value.hospitalId ?? ''}
        onChange={(e) => onChange({ ...value, hospitalId: e.target.value || undefined })}
      >
        <option value="">All Hospitals</option>
        {hospitals?.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>

      {includeAudiologist && (
        <select
          className={selectClass}
          value={value.audiologistId ?? ''}
          onChange={(e) => onChange({ ...value, audiologistId: e.target.value || undefined })}
          disabled={!value.hospitalId}
        >
          <option value="">All Audiologists</option>
          {audiologists?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}
    </>
  );
}
