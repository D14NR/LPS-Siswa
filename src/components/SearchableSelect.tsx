import { useMemo, useState } from "react";

type SearchableSelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  labelClassName?: string;
  inputClassName?: string;
};

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  labelClassName,
  inputClassName,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    if (!value) return options;
    const lowerValue = value.toLowerCase();
    return options.filter((option) => option.toLowerCase().includes(lowerValue));
  }, [options, value]);

  return (
    <div className="relative">
      {label && <label className={labelClassName}>{label}</label>}
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 150);
        }}
        placeholder={placeholder}
        className={inputClassName}
      />
      {isOpen && (
        <div className="absolute z-10 mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-lg">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500">Tidak ada data yang cocok.</div>
          ) : (
            filteredOptions.map((option) => (
              <button
                type="button"
                key={option}
                onMouseDown={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
