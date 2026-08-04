import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Check, ChevronDown } from 'lucide-react';

export interface CreatableAutocompleteProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export const CreatableAutocomplete = forwardRef<HTMLInputElement, CreatableAutocompleteProps>(
  ({ options, value, onChange, className, disabled, placeholder, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Update filtered options when value or options change
    useEffect(() => {
      if (!value) {
        setFilteredOptions(options);
      } else {
        const lowerValue = value.toLowerCase();
        setFilteredOptions(options.filter(opt => opt.toLowerCase().includes(lowerValue)));
      }
    }, [value, options]);

    // Handle clicking outside to close
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative w-full" ref={wrapperRef}>
        <div className="relative w-full">
          <input
            {...props}
            ref={ref}
            type="text"
            value={value || ''}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-8',
              className
            )}
            autoComplete="off"
          />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
        </div>

        {isOpen && filteredOptions.length > 0 && !disabled && (
          <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background text-foreground shadow-md animate-in fade-in-0 zoom-in-95">
            <ul className="py-1">
              {filteredOptions.map((opt) => (
                <li
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                    value === opt ? 'bg-accent/50 text-accent-foreground font-medium' : ''
                  )}
                >
                  {value === opt && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  {opt}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);
CreatableAutocomplete.displayName = 'CreatableAutocomplete';
