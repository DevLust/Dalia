import { useEffect, useState } from 'react';
import { displayToIso, isoToDisplay, maskDateInput } from '../lib/dates';

type DateInputProps = {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
  'aria-label'?: string;
};

export default function DateInput({
  id,
  value,
  onChange,
  className,
  required,
  placeholder = 'dd/mm/aaaa',
  'aria-label': ariaLabel,
}: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToDisplay(value));

  useEffect(() => {
    setDisplay(isoToDisplay(value));
  }, [value]);

  const commit = (text: string) => {
    const masked = maskDateInput(text);
    setDisplay(masked);
    if (masked.length === 10) {
      const iso = displayToIso(masked);
      if (iso) onChange(iso);
    } else if (masked.length === 0) {
      onChange('');
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={className}
      value={display}
      placeholder={placeholder}
      required={required}
      aria-label={ariaLabel}
      onChange={(e) => commit(e.target.value)}
      onBlur={() => {
        if (display.length > 0 && display.length < 10) {
          setDisplay(isoToDisplay(value));
        }
      }}
    />
  );
}
