type Props = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (value: string) => void;
};

export function InviteInputField({
  id,
  label,
  value,
  placeholder,
  disabled,
  autoFocus,
  onChange,
}: Props) {
  return (
    <label className="block text-xs font-medium uppercase tracking-wide text-secondary">
      {label}
      <input
        id={id}
        className="mt-1 w-full rounded border border-subtle bg-secondary px-3 py-2 text-sm text-primary placeholder:text-secondary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
      />
    </label>
  );
}
