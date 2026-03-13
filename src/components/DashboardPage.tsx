import { useState } from "react";
import type { DashboardCards } from "@/components/dataDashboard";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { SearchableSelect } from "@/components/SearchableSelect";
import type { RowRecord } from "@/utils/dataHelpers";
import { formatDateValue, getRowValue, uniqueValues } from "@/utils/dataHelpers";
import { postAppScript } from "@/utils/appScript";

const renderRowValue = (row: RowRecord | null, key: string) =>
  row ? getRowValue(row, key) || "" : "";
const renderDateValue = (row: RowRecord | null) =>
  row ? formatDateValue(getRowValue(row, "Tanggal") || getRowValue(row, "Timestamp")) : "";

const renderApprovalDate = (row: RowRecord | null) => {
  if (!row) return "";
  return formatDateValue(
    getRowValue(row, "Tanggal disetujui") || getRowValue(row, "Tanggal Disetujui")
  );
};

const renderApprovalTime = (row: RowRecord | null) => {
  if (!row) return "";
  return getRowValue(row, "Jam disetujui") || getRowValue(row, "Jam Disetujui") || "";
};

type DashboardPageProps = {
  selectedStudent: RowRecord | null;
  todaySchedule: DashboardCards["todaySchedule"];
  latestPresensi: RowRecord | null;
  latestPerkembangan: RowRecord | null;
  latestNilai: RowRecord | null;
  latestPelayanan: RowRecord | null;
  latestPermintaan: RowRecord | null;
  pengajarRows: RowRecord[];
  onNavigate?: (menu: string) => void;
};

export function DashboardPage({
  selectedStudent,
  todaySchedule,
  latestPresensi,
  latestPerkembangan,
  latestNilai,
  latestPelayanan,
  latestPermintaan,
  pengajarRows,
  onNavigate,
}: DashboardPageProps) {
  // --- Presensi Modal State ---
  const [presensiOpen, setPresensiOpen] = useState(false);
  const [presensiStatus, setPresensiStatus] = useState("");
  const [presensiSubmit, setPresensiSubmit] = useState({ loading: false, error: "", success: "" });

  // --- Pelayanan Modal State ---
  const [pelayananOpen, setPelayananOpen] = useState(false);
  const [pelayananForm, setPelayananForm] = useState({
    tanggal: "",
    mataPelajaran: "",
    materi: "",
    durasi: "",
    pengajar: "",
  });
  const [pelayananSubmit, setPelayananSubmit] = useState({ loading: false, error: "", success: "" });

  const mapelOptions = uniqueValues(pengajarRows, "Mata Pelajaran");
  const pengajarOptions = uniqueValues(pengajarRows, "Pengajar");

  const resolvedTanggal = todaySchedule?.dateValue ?? "";
  const resolvedMapel = todaySchedule?.subject ?? "";

  const resetPresensi = () => {
    setPresensiStatus("");
    setPresensiSubmit({ loading: false, error: "", success: "" });
  };

  const resetPelayanan = () => {
    setPelayananForm({ tanggal: "", mataPelajaran: "", materi: "", durasi: "", pengajar: "" });
    setPelayananSubmit({ loading: false, error: "", success: "" });
  };

  const handlePresensiSubmit = async () => {
    if (!selectedStudent) return;
    if (!resolvedTanggal || !resolvedMapel) {
      setPresensiSubmit({ loading: false, error: "Jadwal reguler hari ini belum tersedia.", success: "" });
      return;
    }
    if (!presensiStatus) {
      setPresensiSubmit({ loading: false, error: "Status wajib dipilih.", success: "" });
      return;
    }
    try {
      setPresensiSubmit({ loading: true, error: "", success: "" });
      await postAppScript("presensi", {
        nis: getRowValue(selectedStudent, "Nis"),
        nama: getRowValue(selectedStudent, "Nama"),
        tanggal: resolvedTanggal,
        kelas:
          getRowValue(selectedStudent, "Kelompok Kelas") ||
          getRowValue(selectedStudent, "Kelompok") ||
          getRowValue(selectedStudent, "Kelas"),
        mataPelajaran: resolvedMapel,
        status: presensiStatus,
        cabang: getRowValue(selectedStudent, "Cabang"),
      });
      setPresensiSubmit({ loading: false, error: "", success: "Presensi berhasil disimpan." });
      setTimeout(() => { setPresensiOpen(false); resetPresensi(); }, 1200);
    } catch (err) {
      setPresensiSubmit({
        loading: false,
        error: err instanceof Error ? err.message : "Gagal menyimpan presensi.",
        success: "",
      });
    }
  };

  const handlePelayananSubmit = async () => {
    if (!selectedStudent) return;
    if (!pelayananForm.tanggal || !pelayananForm.mataPelajaran) {
      setPelayananSubmit({ loading: false, error: "Tanggal dan mata pelajaran wajib diisi.", success: "" });
      return;
    }
    try {
      setPelayananSubmit({ loading: true, error: "", success: "" });
      await postAppScript("pelayanan", {
        nis: getRowValue(selectedStudent, "Nis"),
        nama: getRowValue(selectedStudent, "Nama"),
        tanggal: pelayananForm.tanggal,
        mataPelajaran: pelayananForm.mataPelajaran,
        materi: pelayananForm.materi,
        durasi: pelayananForm.durasi,
        pengajar: pelayananForm.pengajar,
        cabang: getRowValue(selectedStudent, "Cabang"),
      });
      setPelayananSubmit({ loading: false, error: "", success: "Pelayanan berhasil disimpan." });
      setTimeout(() => { setPelayananOpen(false); resetPelayanan(); }, 1200);
    } catch (err) {
      setPelayananSubmit({
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
    <div className="grid gap-6">
      {/* Latest Permintaan */}
      {latestPermintaan && (
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Permintaan Pelayanan Terakhir
          </h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tanggal Permintaan</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {renderDateValue(latestPermintaan)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mata Pelajaran</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {renderRowValue(latestPermintaan, "Mata Pelajaran") || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pengajar</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {renderRowValue(latestPermintaan, "Pengajar") || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {renderRowValue(latestPermintaan, "Status") || "Menunggu"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tanggal Disetujui</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {renderApprovalDate(latestPermintaan) || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Jam Disetujui</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {renderApprovalTime(latestPermintaan) || "-"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tempat/Cabang</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {renderRowValue(latestPermintaan, "Cabang") || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-4">Aksi Cepat</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Button Presensi */}
          <button
            onClick={() => { resetPresensi(); setPresensiOpen(true); }}
            className="group flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-left transition hover:border-red-300 hover:bg-red-100 hover:shadow-md"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-200 transition group-hover:bg-red-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Input Presensi</p>
              <p className="text-xs text-slate-500 mt-0.5">Sakit / Izin / Alpha</p>
            </div>
          </button>

          {/* Button Pelayanan */}
          <button
            onClick={() => { resetPelayanan(); setPelayananOpen(true); }}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-red-200 hover:bg-red-50 hover:shadow-md"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white shadow-md shadow-slate-200 transition group-hover:bg-red-600 group-hover:shadow-red-200">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Input Pelayanan</p>
              <p className="text-xs text-slate-500 mt-0.5">Catat jam tambahan belajar</p>
            </div>
          </button>
        </div>

        {/* Secondary navigation links */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "Jadwal Reguler", menu: "Jadwal Reguler" },
            { label: "Jadwal Tambahan", menu: "Jadwal Tambahan" },
            { label: "Riwayat Presensi", menu: "Riwayat Presensi" },
            { label: "Riwayat Nilai", menu: "Riwayat Nilai Tes" },
            { label: "No. WA Pengajar", menu: "No. Whatsapp Pengajar" },
          ].map((item) => (
            <button
              key={item.menu}
              onClick={() => onNavigate?.(item.menu)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Jadwal hari ini</h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {todaySchedule ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">{todaySchedule.label}</p>
                <p className="text-base font-semibold text-slate-900">{todaySchedule.subject}</p>
                <p className="text-sm text-slate-500">{todaySchedule.time || "Jam belum ditentukan"}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Jadwal hari ini belum tersedia untuk cabang dan kelompok kelas siswa.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Presensi Terakhir</h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {latestPresensi ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">{renderDateValue(latestPresensi)}</p>
                <p className="text-base font-semibold text-slate-900">
                  {renderRowValue(latestPresensi, "Mata Pelajaran") || "-"}
                </p>
                <p className="text-sm text-slate-500">
                  Status: {renderRowValue(latestPresensi, "Status") || "-"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Belum ada data presensi.</p>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Perkembangan Terakhir</h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {latestPerkembangan ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">{renderDateValue(latestPerkembangan)}</p>
                <p className="text-base font-semibold text-slate-900">
                  {renderRowValue(latestPerkembangan, "Mata Pelajaran") || "-"}
                </p>
                <p className="text-sm text-slate-500">
                  Materi: {renderRowValue(latestPerkembangan, "Materi") || "-"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Belum ada data perkembangan.</p>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Nilai Tes Terakhir</h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {latestNilai ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">{renderDateValue(latestNilai)}</p>
                <p className="text-base font-semibold text-slate-900">
                  {renderRowValue(latestNilai, "Jenis Tes") || "-"}
                </p>
                <p className="text-sm text-slate-500">
                  Rerata: {renderRowValue(latestNilai, "Rerata") || "-"} | Total:{" "}
                  {renderRowValue(latestNilai, "Total") || "-"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Belum ada data nilai.</p>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Pelayanan/Jam Tambahan Terakhir
          </h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {latestPelayanan ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">{renderDateValue(latestPelayanan)}</p>
                <p className="text-base font-semibold text-slate-900">
                  {renderRowValue(latestPelayanan, "Mata Pelajaran") || "-"}
                </p>
                <p className="text-sm text-slate-500">
                  Materi: {renderRowValue(latestPelayanan, "Materi") || "-"} | Durasi:{" "}
                  {renderRowValue(latestPelayanan, "Durasi") || "-"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Belum ada data pelayanan tambahan.</p>
            )}
          </div>
        </div>
      </div>

      {/* ===== PRESENSI MODAL ===== */}
      <Modal
        title="Input Presensi"
        description="Tanggal dan mata pelajaran diisi otomatis dari jadwal reguler hari ini. Pilih status presensi."
        isOpen={presensiOpen}
        onClose={() => { setPresensiOpen(false); resetPresensi(); }}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {presensiSubmit.error ? (
                <span className="text-red-600">{presensiSubmit.error}</span>
              ) : presensiSubmit.success ? (
                <span className="text-emerald-600">{presensiSubmit.success}</span>
              ) : (
                "Data akan tersimpan ke basis data."
              )}
            </p>
            <button
              onClick={handlePresensiSubmit}
              disabled={presensiSubmit.loading}
              className="rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {presensiSubmit.loading ? "Menyimpan..." : "Simpan Presensi"}
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
              value={presensiStatus}
              onChange={(e) => setPresensiStatus(e.target.value)}
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

      {/* ===== PELAYANAN MODAL ===== */}
      <Modal
        title="Input Pelayanan/Jam Tambahan"
        description="Isi data layanan tambahan untuk dicatat ke basis data."
        isOpen={pelayananOpen}
        onClose={() => { setPelayananOpen(false); resetPelayanan(); }}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {pelayananSubmit.error ? (
                <span className="text-red-600">{pelayananSubmit.error}</span>
              ) : pelayananSubmit.success ? (
                <span className="text-emerald-600">{pelayananSubmit.success}</span>
              ) : (
                "Data akan tersimpan ke basis data."
              )}
            </p>
            <button
              onClick={handlePelayananSubmit}
              disabled={pelayananSubmit.loading}
              className="rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {pelayananSubmit.loading ? "Menyimpan..." : "Simpan Pelayanan"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Tanggal</label>
            <input
              type="date"
              value={pelayananForm.tanggal}
              onChange={(e) => setPelayananForm((p) => ({ ...p, tanggal: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <SearchableSelect
            label="Mata Pelajaran"
            value={pelayananForm.mataPelajaran}
            onChange={(v) => setPelayananForm((p) => ({ ...p, mataPelajaran: v }))}
            options={mapelOptions}
            placeholder="Cari mata pelajaran"
            labelClassName="text-xs uppercase tracking-[0.3em] text-slate-500"
            inputClassName="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Materi</label>
            <input
              type="text"
              value={pelayananForm.materi}
              onChange={(e) => setPelayananForm((p) => ({ ...p, materi: e.target.value }))}
              placeholder="Materi pelayanan"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Durasi</label>
            <input
              type="text"
              value={pelayananForm.durasi}
              onChange={(e) => setPelayananForm((p) => ({ ...p, durasi: e.target.value }))}
              placeholder="Contoh: 60 menit"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <SearchableSelect
            label="Pengajar"
            value={pelayananForm.pengajar}
            onChange={(v) => setPelayananForm((p) => ({ ...p, pengajar: v }))}
            options={pengajarOptions}
            placeholder="Cari pengajar"
            labelClassName="text-xs uppercase tracking-[0.3em] text-slate-500"
            inputClassName="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>
      </Modal>
    </div>
  );
}
