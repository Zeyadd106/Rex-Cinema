'use client';
import { cn } from '@/lib/utils';

export const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#e31837]/70 focus:bg-white/10';

export const selectClass = cn(inputClass, 'pe-8 [&_option]:bg-[#0f0f0f]');

const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';

function FieldMessage({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <span className="mt-1.5 block text-xs font-medium text-[#ff6b81]">{error}</span>;
  if (hint) return <span className="mt-1.5 block text-xs text-white/40">{hint}</span>;
  return null;
}

interface FieldBase {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

interface TextFieldProps extends FieldBase {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

export function TextField({ label, value, onChange, type = 'text', error, hint, placeholder, required, className }: TextFieldProps) {
  return (
    <label className={cn('block', className)}>
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(inputClass, error && 'border-[#e31837]/70')}
      />
      <FieldMessage error={error} hint={hint} />
    </label>
  );
}

interface TextAreaFieldProps extends FieldBase {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}

export function TextAreaField({ label, value, onChange, rows = 4, error, hint, placeholder, required, className }: TextAreaFieldProps) {
  return (
    <label className={cn('block', className)}>
      <span className={labelClass}>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(inputClass, 'resize-y', error && 'border-[#e31837]/70')}
      />
      <FieldMessage error={error} hint={hint} />
    </label>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends FieldBase {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

export function SelectField({ label, value, onChange, options, placeholder, error, hint, required, className }: SelectFieldProps) {
  return (
    <label className={cn('block', className)}>
      <span className={labelClass}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(selectClass, error && 'border-[#e31837]/70')}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessage error={error} hint={hint} />
    </label>
  );
}

interface CheckboxFieldProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function CheckboxField({ label, hint, checked, onChange, className }: CheckboxFieldProps) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 transition hover:bg-white/[0.06]', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#e31837]"
      />
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-white/40">{hint}</span> : null}
      </span>
    </label>
  );
}
