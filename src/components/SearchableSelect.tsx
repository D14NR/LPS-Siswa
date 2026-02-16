import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";

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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((option) => option.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const selectValue = (option: string) => {
    onChange(option);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="relative">
      {label && <label className={labelClassName}>{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700",
          inputClassName
        )}
      >
        <span>{value || placeholder || "Pilih opsi"}</span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-10 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-red-100">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-red-300 focus:outline-none"
          />
          <div className="mt-2 max-h-48 overflow-y-auto text-xs">
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => selectValue(option)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-red-50"
              >
                {option}
                {option === value && <span className="text-red-500">✔</span>}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-center text-slate-400">Tidak ada data</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
