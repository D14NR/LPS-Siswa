import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { SearchableSelect } from "@/components/SearchableSelect";
import type { RowRecord } from "@/utils/dataHelpers";
import {
  formatDateValue,
  getRowValue,
  matchesDateFilter,
  matchesTextFilter,
  uniqueValues,
} from "@/utils/dataHelpers";
import { postAppScript } from "@/utils/appScript";

type PresensiPageProps = {
  selectedStudent: RowRecord | null;
  presensiRows: RowRecord[];
  todaySchedule: { label: string; subject: string; time: string; dateValue?: string } | null;
  pengajarRows: RowRecord[];
};

const PAGE_SIZE = 10;

export function PresensiPage({
  selectedStudent,
  presensiRows,
  todaySchedule,
  pengajarRows,
}: PresensiPageProps) {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    tanggal: "",
    mataPelajaran: "",
    status: "",
    catatan: "",
  });
  const [submitState, setSubmitState] = useState({ loading: false, error: "", success: "" });
  const [flashMessage, setFlashMessage] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [mapelFilter, setMapelFilter] = useState("");

  const mapelOptions = useMemo(() => uniqueValues(pengajarRows, "Mata Pelajaran"), [pengajarRows]);

  const filteredRows = useMemo(
    () =>
      presensiRows.filter(
        (row) =>
          matchesDateFilter(getRowValue(row, "Tanggal"), dateFilter) &&
          matchesTextFilter(getRowValue(row, "Mata Pelajaran"), mapelFilter)
      ),
    [presensiRows, dateFilter, mapelFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [presensiRows.length, dateFilter, mapelFilter]);

  const pageRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );

  const resetForm = () => {
    setFormState({ tanggal: "", mataPelajaran: "", status: "", catatan: "" });
    setSubmitState({ loading: false, error: "", success: "" });
  };

  const resolvedTanggal = todaySchedule?.dateValue ?? "";
  const resolvedMapel = todaySchedule?.subject ?? "";

  const openModal = () => {
    setFlashMessage("");
    setFormState((prev) => ({
      ...prev,
      tanggal: resolvedTanggal,
      mataPelajaran: resolvedMapel,
    }));
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedStudent) return;
    if (!resolvedTanggal || !resolvedMapel) {
      setSubmitState({
        loading: false,
        error: "Jadwal reguler hari ini belum tersedia. Tidak bisa mengirim presensi.",
        success: "",
      });
      return;
    }
    if (!formState.status) {
      setSubmitState({ loading: false, error: "Status wajib dipilih.", success: "" });
      return;
    }
    try {
      setSubmitState({ loading: true, error: "", success: "" });
      await postAppScript("presensi", {
        nis: getRowValue(selectedStudent, "Nis"),
        nama: getRowValue(selectedStudent, "Nama"),
        tanggal: resolvedTanggal,
        kelas:
          getRowValue(selectedStudent, "Kelompok Kelas") ||
          getRowValue(selectedStudent, "Kelompok") ||
          getRowValue(selectedStudent, "Kelas"),
        mataPelajaran: resolvedMapel,
        status: formState.status,
        cabang: getRowValue(selectedStudent, "Cabang"),
      });
      setSubmitState({ loading: false, error: "", success: "Presensi berhasil disimpan." });
      setFlashMessage("Presensi berhasil disimpan.");
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setSubmitState({
        loading: false,
        error: err instanceof Error ? err.message : "Gagal menyimpan presensi.",
        success: "",
      });
    }
  };

  if (!selectedStudent) {
    return <EmptyState message="Data siswa belum tersedia. Silakan masuk ulang." />;
  }

  if (presensiRows.length === 0) {
    return <EmptyState message="Belum ada data presensi untuk siswa ini." />;
  }

  return (
    <section className="grid gap-6">
      {flashMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {flashMessage}
        </div>
      )}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Input Presensi (Sakit/Izin/Alpha)</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tanggal dan mata pelajaran diisi otomatis dari jadwal reguler hari ini. Siswa hanya memilih status.
            </p>
          </div>
          <button
            onClick={openModal}
            className="rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Tambah Presensi
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Riwayat Presensi</h2>
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
              <SearchableSelect
                label="Filter Mapel"
                value={mapelFilter}
                onChange={setMapelFilter}
                options={mapelOptions}
                placeholder="Cari mata pelajaran"
                labelClassName="text-[10px] uppercase tracking-[0.3em] text-slate-500"
                inputClassName="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                {["Tanggal", "Mata Pelajaran", "Status", "Cabang"].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs uppercase tracking-[0.3em]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, index) => (
                <tr key={`${getRowValue(row, "Timestamp")}-${index}`} className="border-t border-slate-200">
                  <td className="px-6 py-3 text-slate-900">{formatDateValue(getRowValue(row, "Tanggal"))}</td>
                  <td className="px-6 py-3 text-slate-900">{getRowValue(row, "Mata Pelajaran") || "-"}</td>
                  <td className="px-6 py-3 text-slate-700">{getRowValue(row, "Status") || "-"}</td>
                  <td className="px-6 py-3 text-slate-500">{getRowValue(row, "Cabang") || "-"}</td>
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
      </div>

      <Modal
        title="Input Presensi"
        description="Isi status presensi siswa. Tanggal dan mata pelajaran diambil dari jadwal reguler hari ini."
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
                "Data akan tersimpan ke spreadsheet."
              )}
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitState.loading}
              className="rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {submitState.loading ? "Menyimpan..." : "Simpan Presensi"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Tanggal (otomatis)</label>
            <input
              type="text"
              value={resolvedTanggal ? formatDateValue(resolvedTanggal) : "Belum ada jadwal hari ini"}
              readOnly
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Mata Pelajaran (otomatis)</label>
            <input
              type="text"
              value={resolvedMapel || "Belum ada jadwal hari ini"}
              readOnly
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</label>
            <select
              value={formState.status}
              onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            >
              <option value="">Pilih Status</option>
              <option value="Sakit">Sakit</option>
              <option value="Izin">Izin</option>
              <option value="Alpha">Alpha</option>
            </select>
          </div>
        </div>
      </Modal>
    </section>
  );
}
