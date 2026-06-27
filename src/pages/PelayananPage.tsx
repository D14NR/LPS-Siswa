import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { SearchableSelect } from "@/components/SearchableSelect";
import type { RowRecord } from "@/utils/dataHelpers";
import {
  formatDateForStorage,
  formatDateValue,
  getRowValue,
  matchesDateFilter,
  matchesTextFilter,
  optionContains,
  sortRowsByDateDesc,
  uniqueStringValues,
  uniqueValues,
} from "@/utils/dataHelpers";
import { supabase } from "@/utils/supabaseClient";

type PelayananPageProps = {
  selectedStudent: RowRecord | null;
  pelayananRows: RowRecord[];
  pengajarRows: RowRecord[];
  mataPelajaranOptions: string[];
};

const PAGE_SIZE = 10;

export function PelayananPage({
  selectedStudent,
  pelayananRows,
  pengajarRows,
  mataPelajaranOptions,
}: PelayananPageProps) {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    tanggal: "",
    mataPelajaran: "",
    materi: "",
    durasi: "",
    pengajar: "",
  });
  const layananSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    pelayananRows.forEach((row) => {
      const mapel = getRowValue(row, "Mata Pelajaran") || "Lainnya";
      summary[mapel] = (summary[mapel] || 0) + 1;
    });
    const entries = Object.entries(summary).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((acc, [, count]) => acc + count, 0);
    return { entries, total, top: entries[0]?.[0] ?? "-" };
  }, [pelayananRows]);
  const [submitState, setSubmitState] = useState({ loading: false, error: "", success: "" });
  const [flashMessage, setFlashMessage] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const mapelOptions = useMemo(() => {
    const source = mataPelajaranOptions.length
      ? mataPelajaranOptions
      : uniqueValues(pengajarRows, "Mata Pelajaran");
    return uniqueStringValues(source);
  }, [mataPelajaranOptions, pengajarRows]);

  const filteredPengajarRows = useMemo(() => {
    if (!formState.mataPelajaran) return pengajarRows;
    return pengajarRows.filter((row) =>
      optionContains(getRowValue(row, "Mata Pelajaran"), formState.mataPelajaran)
    );
  }, [formState.mataPelajaran, pengajarRows]);

  const pengajarOptions = useMemo(
    () => uniqueValues(filteredPengajarRows, "Pengajar"),
    [filteredPengajarRows]
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sortRowsByDateDesc(
      pelayananRows.filter((row) => {
        const dateOk = matchesDateFilter(getRowValue(row, "Tanggal"), dateFilter);
        if (!q) return dateOk;
        const mapel = (getRowValue(row, "Mata Pelajaran") || "").toLowerCase();
        const materi = (getRowValue(row, "Materi") || "").toLowerCase();
        const pengajar = (getRowValue(row, "Pengajar") || "").toLowerCase();
        return dateOk && (mapel.includes(q) || materi.includes(q) || pengajar.includes(q));
      })
    );
  }, [pelayananRows, dateFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [pelayananRows.length, dateFilter, searchQuery]);

  const pageRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );

  const resetForm = () => {
    setFormState({
      tanggal: "",
      mataPelajaran: "",
      materi: "",
      durasi: "",
      pengajar: "",
    });
    setSubmitState({ loading: false, error: "", success: "" });
  };

  const handleSubmit = async () => {
    if (!selectedStudent) return;
    if (!formState.tanggal || !formState.mataPelajaran) {
      setSubmitState({ loading: false, error: "Tanggal dan mata pelajaran wajib diisi.", success: "" });
      return;
    }
    try {
      setSubmitState({ loading: true, error: "", success: "" });
      const payload = {
        nis: getRowValue(selectedStudent, "Nis"),
        nama: getRowValue(selectedStudent, "Nama"),
        tanggal: formatDateForStorage(formState.tanggal),
        mata_pelajaran: formState.mataPelajaran,
        materi_sub_bab: formState.materi || null,
        durasi: formState.durasi || null,
        pengajar: formState.pengajar || null,
        cabang: getRowValue(selectedStudent, "Cabang") || null,
      };

      const { error } = await supabase.from("tambahan_pelayanan").insert([payload]);
      if (error) throw new Error(error.message || "Gagal menyimpan pelayanan.");
      setSubmitState({ loading: false, error: "", success: "Pelayanan berhasil disimpan." });
      setFlashMessage("Pelayanan berhasil disimpan.");
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setSubmitState({
        loading: false,
        error: err instanceof Error ? err.message : "Gagal menyimpan pelayanan.",
        success: "",
      });
    }
  };

  if (!selectedStudent) {
    return <EmptyState message="Data siswa belum tersedia. Silakan masuk ulang." />;
  }

  return (
    <section className="grid gap-6">
      {flashMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {flashMessage}
        </div>
      )}
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Presensi Pelayanan/Jam Tambahan</h2>
            <p className="mt-1 text-sm text-slate-500">Form disajikan dalam modal untuk input layanan tambahan.</p>
          </div>
          <button
            onClick={() => {
              setFlashMessage("");
              setIsModalOpen(true);
            }}
            className="rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-red-200 transition hover:bg-red-500"
          >
            Presensi Pelayanan/Jam Tambahan
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Grafik Pelayanan</h3>
          <div className="mt-4 space-y-4">
            {layananSummary.entries.slice(0, 4).map(([label, count]) => {
              const percent = layananSummary.total
                ? Math.round((count / layananSummary.total) * 100)
                : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{label}</span>
                    <span>{count} sesi</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-red-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Analisa</h3>
          <p className="mt-4 text-sm text-slate-600">
            Total sesi pelayanan: <span className="font-semibold text-slate-900">{layananSummary.total}</span>.
            Mata pelajaran paling sering: <span className="font-semibold text-red-600">{layananSummary.top}</span>.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Pertimbangkan menambah slot layanan untuk mapel yang paling banyak diminati.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-lg shadow-red-100">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Riwayat Pelayanan/Jam Tambahan</h2>
              <p className="mt-1 text-sm text-slate-500">Menampilkan 10 data terbaru per halaman.</p>
            </div>
              <div className="flex flex-wrap gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Filter Tanggal</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Cari Data</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari mapel, materi, atau pengajar"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
        {pageRows.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Belum ada data pelayanan tambahan untuk siswa ini.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    {["Tanggal", "Mata Pelajaran", "Materi", "Durasi", "Pengajar"].map((header) => (
                      <th key={header} className="px-6 py-3 text-left text-xs uppercase tracking-[0.3em]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, index) => (
                    <tr key={`${getRowValue(row, "Timestamp")}-${index}`} className="border-t border-slate-200">
                      <td className="px-6 py-3 text-slate-900">
                        {formatDateValue(getRowValue(row, "Tanggal"))}
                      </td>
                      <td className="px-6 py-3 text-slate-900">
                        {getRowValue(row, "Mata Pelajaran") || "-"}
                      </td>
                      <td className="px-6 py-3 text-slate-900">{getRowValue(row, "Materi") || "-"}</td>
                      <td className="px-6 py-3 text-slate-700">{getRowValue(row, "Durasi") || "-"}</td>
                      <td className="px-6 py-3 text-slate-500">{getRowValue(row, "Pengajar") || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            />
          </>
        )}
      </div>

      <Modal
        title="Presensi Pelayanan/Jam Tambahan"
        description="Isi data layanan tambahan untuk dicatat ke spreadsheet."
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {submitState.error ? (
                <span className="text-red-600">{submitState.error}</span>
              ) : submitState.success ? (
                <span className="text-emerald-600">{submitState.success}</span>
              ) : (
                "Data akan tersimpan ke basis data."
              )}
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitState.loading}
              className="rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-red-200 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {submitState.loading ? "Menyimpan..." : "Simpan Pelayanan"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Tanggal</label>
            <input
              type="date"
              value={formState.tanggal}
              onChange={(event) => setFormState((prev) => ({ ...prev, tanggal: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <SearchableSelect
            label="Mata Pelajaran"
            value={formState.mataPelajaran}
            onChange={(value) => setFormState((prev) => ({ ...prev, mataPelajaran: value }))}
            options={mapelOptions}
            placeholder="Cari mata pelajaran"
            labelClassName="text-xs uppercase tracking-[0.3em] text-slate-500"
            inputClassName="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Materi</label>
            <input
              type="text"
              value={formState.materi}
              onChange={(event) => setFormState((prev) => ({ ...prev, materi: event.target.value }))}
              placeholder="Materi pelayanan"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Durasi</label>
            <input
              type="text"
              value={formState.durasi}
              onChange={(event) => setFormState((prev) => ({ ...prev, durasi: event.target.value }))}
              placeholder="Contoh: 60 menit"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <SearchableSelect
            label="Pengajar"
            value={formState.pengajar}
            onChange={(value) => setFormState((prev) => ({ ...prev, pengajar: value }))}
            options={pengajarOptions}
            placeholder="Cari pengajar"
            labelClassName="text-xs uppercase tracking-[0.3em] text-slate-500"
            inputClassName="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>
      </Modal>
    </section>
  );
}
