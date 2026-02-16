import type { RowRecord } from "@/utils/dataHelpers";

const defaultLabels = {
  cabang: "Cabang",
  kelas: "Kelompok Kelas",
  siswa: "Pilih siswa",
  search: "Cari siswa",
};

type FilterBarProps = {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  selectedCabang: string;
  onCabangChange: (value: string) => void;
  selectedKelas: string;
  onKelasChange: (value: string) => void;
  selectedNis: string;
  onNisChange: (value: string) => void;
  scheduleCabangOptions: string[];
  scheduleKelasOptions: string[];
  filteredStudents: RowRecord[];
  totalStudents: number;
  activeMenu: string;
  getRowValue: (row: RowRecord, key: string) => string;
  labels?: Partial<typeof defaultLabels>;
};

export function FilterBar({
  searchText,
  onSearchTextChange,
  selectedCabang,
  onCabangChange,
  selectedKelas,
  onKelasChange,
  selectedNis,
  onNisChange,
  scheduleCabangOptions,
  scheduleKelasOptions,
  filteredStudents,
  totalStudents,
  activeMenu,
  getRowValue,
  labels,
}: FilterBarProps) {
  const mergedLabels = { ...defaultLabels, ...labels };

  return (
    <section className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-400">{mergedLabels.search}</label>
          <input
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder="NIS atau nama siswa"
            className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-500"
          />
        </div>
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">{mergedLabels.cabang}</label>
            <select
              value={selectedCabang}
              onChange={(event) => onCabangChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-500"
            >
              <option value="Semua">Semua</option>
              {scheduleCabangOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">{mergedLabels.kelas}</label>
            <select
              value={selectedKelas}
              onChange={(event) => onKelasChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-500"
            >
              {scheduleKelasOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">{mergedLabels.siswa}</label>
            <select
              value={selectedNis}
              onChange={(event) => onNisChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-500"
            >
              <option value="">Pilih siswa</option>
              {filteredStudents.map((row) => {
                const nis = getRowValue(row, "Nis");
                const nama = getRowValue(row, "Nama");
                return (
                  <option key={nis} value={nis}>
                    {nis} - {nama}
                  </option>
                );
              })}
            </select>
            <p className="mt-2 text-xs text-slate-400">Masukkan NIS tanpa spasi atau titik.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="rounded-full border border-slate-800 px-3 py-1">Total siswa: {totalStudents}</span>
        <span className="rounded-full border border-slate-800 px-3 py-1">Terfilter: {filteredStudents.length}</span>
        <span className="rounded-full border border-slate-800 px-3 py-1">Menu aktif: {activeMenu}</span>
      </div>
    </section>
  );
}
