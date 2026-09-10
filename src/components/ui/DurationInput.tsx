'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface DurationInputProps {
  label: string;
  valueSec: number;
  onChangeSec: (sec: number) => void;
  min: number;
  max: number;
  step?: number;
  error?: string;
  id?: string;
  helperText?: string;
  className?: string;
  /** Called whenever the field's own in-range validity changes, so a parent
   * can block submission while the user is mid-edit with an invalid value —
   * onChangeSec alone only fires for valid values, so it can't signal this. */
  onValidityChange?: (valid: boolean) => void;
}

export function DurationInput({
  label,
  valueSec,
  onChangeSec,
  min,
  max,
  step = 1,
  error,
  id,
  helperText,
  className,
  onValidityChange,
}: DurationInputProps) {
  // Local string state lets the user pass through an intermediate/invalid
  // value (empty, out of range) while typing without being force-clamped —
  // onChangeSec only fires once the value is a valid integer in [min, max].
  const [text, setText] = useState(String(valueSec));
  const [rangeError, setRangeError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const parsed = Number(raw);
    const valid = raw !== '' && Number.isInteger(parsed) && parsed >= min && parsed <= max;
    if (valid) {
      setRangeError(null);
      onChangeSec(parsed);
    } else {
      setRangeError(`Must be between ${min} and ${max}`);
    }
    onValidityChange?.(valid);
  };

  const handleBlur = () => {
    // Resync displayed text to the last committed value if what's left in
    // the field is invalid (e.g. cleared or out of range).
    const parsed = Number(text);
    if (text === '' || !Number.isInteger(parsed) || parsed < min || parsed > max) {
      setText(String(valueSec));
      setRangeError(null);
      onValidityChange?.(true);
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-full px-3 py-2 border border-border-subtle rounded-md bg-surface-sunken text-fg focus:outline-none focus:ring-2 focus:ring-accent-primary"
      />
      {helperText && !error && !rangeError && <p className="text-xs text-fg-secondary">{helperText}</p>}
      {(error || rangeError) && <p className="text-xs text-status-danger">{error || rangeError}</p>}
    </div>
  );
}
