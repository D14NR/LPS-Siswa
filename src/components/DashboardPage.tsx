import { useState } from "react";
import type { DashboardCards, TodaySession } from "@/components/dataDashboard";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { SearchableSelect } from "@/components/SearchableSelect";
import type { RowRecord } from "@/utils/dataHelpers";
import { formatDateForStorage, formatDateValue, getRowValue, uniqueValues } from "@/utils/dataHelpers";
import { postAppScript } from "@/utils/appScript";

const rv = (row: RowRecord | null, key: string) => (row ? getRowValue(row, key) || "" : "");
const rdv = (row: RowRecord | null) =>
  row ? formatDateValue(getRowValue(row, "Tanggal") || getRowValue(row, "Timestamp")) : "";
const approvalDate = (row: RowRecord | null) =>
  row ? formatDateValue(getRowValue(row, "Tanggal disetujui") || getRowValue(row, "Tanggal Disetujui")) : "";
const approvalTime = (row: RowRecord | null) =>
  row ? getRowValue(row, "Jam disetujui") || getRowValue(row, "Jam Disetujui") || "" : "";

const statusColor = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "disetujui" || s === "approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "ditolak" || s === "rejected") return "bg-red-100 text-red-700 border-red-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
};

type DashboardPageProps = {
  selectedStudent: RowRecord | null;
  todaySchedule: DashboardCards["todaySchedule"];
  todaySchedules?: TodaySession[];
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
  todaySchedules = [],
  latestPresensi,
  latestPerkembangan,
  latestNilai,
  latestPelayanan,
  latestPermintaan,
  pengajarRows,
  onNavigate,
}: DashboardPageProps) {
  const [presensiOpen, setPresensiOpen] = useState(false);
  const [presensiStatus, setPresensiStatus] = useState("");
  const [presensiSubmit, setPresensiSubmit] = useState({ loading: false, error: "", success: "" });

  const [pelayananOpen, setPelayananOpen] = useState(false);
  const [pelayananForm, setPelayananForm] = useState({
    tanggal: "", mataPelajaran: "", materi: "", durasi: "", pengajar: "",
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
        tanggal: formatDateForStorage(resolvedTanggal),
        kelas: getRowValue(selectedStudent, "Kelompok Kelas") || getRowValue(selectedStudent, "Kelompok") || getRowValue(selectedStudent, "Kelas"),
        mataPelajaran: resolvedMapel,
        status: presensiStatus,
        cabang: getRowValue(selectedStudent, "Cabang"),
      });
      setPresensiSubmit({ loading: false, error: "", success: "Presensi berhasil disimpan." });
      setTimeout(() => { setPresensiOpen(false); resetPresensi(); }, 1200);
    } catch (err) {
      setPresensiSubmit({ loading: false, error: err instanceof Error ? err.message : "Gagal menyimpan presensi.", success: "" });
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
        tanggal: formatDateForStorage(pelayananForm.tanggal),
        mataPelajaran: pelayananForm.mataPelajaran,
        materi: pelayananForm.materi,
        durasi: pelayananForm.durasi,
        pengajar: pelayananForm.pengajar,
        cabang: getRowValue(selectedStudent, "Cabang"),
      });
      setPelayananSubmit({ loading: false, error: "", success: "Pelayanan berhasil disimpan." });
      setTimeout(() => { setPelayananOpen(false); resetPelayanan(); }, 1200);
    } catch (err) {
      setPelayananSubmit({ loading: false, error: err instanceof Error ? err.message : "Gagal menyimpan pelayanan.", success: "" });
    }
  };

  if (!selectedStudent) return <EmptyState message="Data siswa belum tersedia. Silakan masuk ulang." />;

  const permintaanStatus = rv(latestPermintaan, "Status") || "Menunggu";

  const quickNavItems = [
    { label: "Jadwal Reguler", menu: "Jadwal Reguler", icon: "📅", color: "from-red-50 to-red-100 border-red-200 text-red-700 hover:from-red-100 hover:to-red-200" },
    { label: "Jadwal Tambahan", menu: "Jadwal Tambahan", icon: "🗓️", color: "from-slate-50 to-slate-100 border-slate-200 text-slate-700 hover:from-slate-100 hover:to-slate-200" },
    { label: "Riwayat Presensi", menu: "Riwayat Presensi", icon: "📝", color: "from-slate-50 to-slate-100 border-slate-200 text-slate-700 hover:from-slate-100 hover:to-slate-200" },
    { label: "Riwayat Nilai", menu: "Riwayat Nilai Tes", icon: "🏆", color: "from-slate-50 to-slate-100 border-slate-200 text-slate-700 hover:from-slate-100 hover:to-slate-200" },
    { label: "Perkembangan", menu: "Riwayat Perkembangan Belajar", icon: "📈", color: "from-slate-50 to-slate-100 border-slate-200 text-slate-700 hover:from-slate-100 hover:to-slate-200" },
    { label: "No. WA Pengajar", menu: "No. Whatsapp Pengajar", icon: "📞", color: "from-slate-50 to-slate-100 border-slate-200 text-slate-700 hover:from-slate-100 hover:to-slate-200" },
  ];

  return (
    <div className="space-y-6">

      {/* ── Permintaan Alert ── */}
      {latestPermintaan && (
        <div className="relative overflow-hidden rounded-2xl border border-l-4 border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 shadow-sm"
          style={{ borderLeftColor: "#f59e0b" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Permintaan Pelayanan Terakhir</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {rv(latestPermintaan, "Mata Pelajaran") || "-"} &mdash; {rv(latestPermintaan, "Pengajar") || "-"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {rdv(latestPermintaan)} &bull; {rv(latestPermintaan, "Cabang") || "-"}
                  {approvalDate(latestPermintaan) ? ` &bull; Disetujui: ${approvalDate(latestPermintaan)} ${approvalTime(latestPermintaan)}` : ""}
                </p>
              </div>
            </div>
            <span className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusColor(permintaanStatus)}`}>
              {permintaanStatus}
            </span>
          </div>
        </div>
      )}

      {/* ── Hero: Jadwal Hari Ini + Aksi Cepat ── */}
      <div className="grid gap-4 lg:grid-cols-5">

        {/* Jadwal Hari Ini */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-6 text-white shadow-lg shadow-red-200 lg:col-span-3">
          {/* decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-sm">📅</span>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-100">Jadwal Hari Ini</p>
            </div>
            {todaySchedules.length > 0 ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-red-200">
                  {todaySchedules[0].label} &bull; {todaySchedules.length} Sesi
                </p>
                {todaySchedules.map((session, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-bold text-white">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold text-white">{session.subject}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-red-100">
                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {session.time || "Jam belum ditentukan"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : todaySchedule ? (
              <div className="mt-4">
                <p className="text-sm text-red-200">{todaySchedule.label}</p>
                <p className="mt-1 text-2xl font-bold leading-tight text-white">{todaySchedule.subject}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {todaySchedule.time || "Jam belum ditentukan"}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-lg font-semibold text-white/70">Tidak ada jadwal hari ini</p>
                <p className="mt-1 text-sm text-red-200">Cek jadwal reguler atau tambahan untuk minggu ini.</p>
              </div>
            )}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => onNavigate?.("Jadwal Reguler")}
                className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
              >
                Jadwal Reguler →
              </button>
              <button
                onClick={() => onNavigate?.("Jadwal Tambahan")}
                className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
              >
                Jadwal Tambahan →
              </button>
            </div>
          </div>
        </div>

        {/* Aksi Cepat */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <button
            onClick={() => { resetPresensi(); setPresensiOpen(true); }}
            className="group flex flex-1 items-center gap-4 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-5 text-left shadow-sm transition hover:border-red-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 shadow-md shadow-red-200 transition group-hover:scale-105">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Input Presensi</p>
              <p className="mt-0.5 text-xs text-slate-500">Sakit · Izin · Alpha</p>
            </div>
            <svg className="ml-auto h-4 w-4 text-red-400 opacity-0 transition group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => { resetPelayanan(); setPelayananOpen(true); }}
            className="group flex flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 text-left shadow-sm transition hover:border-red-200 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 shadow-md shadow-slate-200 transition group-hover:scale-105 group-hover:bg-red-600 group-hover:shadow-red-200">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Input Pelayanan</p>
              <p className="mt-0.5 text-xs text-slate-500">Catat jam tambahan belajar</p>
            </div>
            <svg className="ml-auto h-4 w-4 text-slate-400 opacity-0 transition group-hover:opacity-100 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Quick Nav Grid ── */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {quickNavItems.map((item) => (
          <button
            key={item.menu}
            onClick={() => onNavigate?.(item.menu)}
            className={`flex flex-col items-center gap-2 rounded-2xl border bg-gradient-to-br px-2 py-4 text-center transition hover:shadow-md ${item.color}`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── Activity Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Presensi Terakhir */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Presensi Terakhir</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-sm text-red-600">📝</span>
          </div>
          {latestPresensi ? (
            <div className="mt-4">
              <p className="text-lg font-bold text-slate-900">{rv(latestPresensi, "Mata Pelajaran") || "-"}</p>
              <p className="mt-1 text-xs text-slate-500">{rdv(latestPresensi)}</p>
              <div className="mt-3">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  (rv(latestPresensi, "Status") || "").toLowerCase() === "hadir"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {rv(latestPresensi, "Status") || "-"}
                </span>
              </div>
              <button
                onClick={() => onNavigate?.("Riwayat Presensi")}
                className="mt-3 text-xs font-semibold text-red-600 opacity-0 transition group-hover:opacity-100 hover:underline"
              >
                Lihat semua →
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Belum ada data presensi.</p>
          )}
        </div>

        {/* Perkembangan Terakhir */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Perkembangan</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-sm text-red-600">📈</span>
          </div>
          {latestPerkembangan ? (
            <div className="mt-4">
              <p className="text-lg font-bold text-slate-900">{rv(latestPerkembangan, "Mata Pelajaran") || "-"}</p>
              <p className="mt-1 text-xs text-slate-500">{rdv(latestPerkembangan)}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {rv(latestPerkembangan, "Materi") || "-"}
              </p>
              {rv(latestPerkembangan, "Penguasaan") && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Penguasaan</span>
                    <span className="font-semibold text-slate-700">{rv(latestPerkembangan, "Penguasaan")}</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => onNavigate?.("Riwayat Perkembangan Belajar")}
                className="mt-3 text-xs font-semibold text-red-600 opacity-0 transition group-hover:opacity-100 hover:underline"
              >
                Lihat semua →
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Belum ada data perkembangan.</p>
          )}
        </div>

        {/* Nilai Terakhir */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nilai Tes Terakhir</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-sm text-red-600">🏆</span>
          </div>
          {latestNilai ? (
            <div className="mt-4">
              <p className="text-lg font-bold text-slate-900">{rv(latestNilai, "Jenis Tes") || "-"}</p>
              <p className="mt-1 text-xs text-slate-500">{rdv(latestNilai)}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-red-50 px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-red-400">Rerata</p>
                  <p className="mt-1 text-base font-bold text-red-700">{rv(latestNilai, "Rerata") || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Total</p>
                  <p className="mt-1 text-base font-bold text-slate-700">{rv(latestNilai, "Total") || "-"}</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.("Riwayat Nilai Tes")}
                className="mt-3 text-xs font-semibold text-red-600 opacity-0 transition group-hover:opacity-100 hover:underline"
              >
                Lihat semua →
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Belum ada data nilai.</p>
          )}
        </div>

        {/* Pelayanan Terakhir */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pelayanan Terakhir</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-sm text-red-600">🎯</span>
          </div>
          {latestPelayanan ? (
            <div className="mt-4">
              <p className="text-lg font-bold text-slate-900">{rv(latestPelayanan, "Mata Pelajaran") || "-"}</p>
              <p className="mt-1 text-xs text-slate-500">{rdv(latestPelayanan)}</p>
              <p className="mt-2 text-sm text-slate-600 line-clamp-1">{rv(latestPelayanan, "Materi") || "-"}</p>
              {rv(latestPelayanan, "Durasi") && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {rv(latestPelayanan, "Durasi")}
                </div>
              )}
              <button
                onClick={() => onNavigate?.("Riwayat Pelayanan/Tambahan")}
                className="mt-3 text-xs font-semibold text-red-600 opacity-0 transition group-hover:opacity-100 hover:underline"
              >
                Lihat semua →
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Belum ada data pelayanan.</p>
          )}
        </div>
      </div>

      {/* ── PRESENSI MODAL ── */}
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

      {/* ── PELAYANAN MODAL ── */}
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
