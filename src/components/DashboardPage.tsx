import type { DashboardCards } from "@/components/dataDashboard";
import { EmptyState } from "@/components/EmptyState";
import type { RowRecord } from "@/utils/dataHelpers";
import { formatDateValue, getRowValue } from "@/utils/dataHelpers";

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
  biodata: { label: string; value: string }[];
  todaySchedule: DashboardCards["todaySchedule"];
  latestPresensi: RowRecord | null;
  latestPerkembangan: RowRecord | null;
  latestNilai: RowRecord | null;
  latestPelayanan: RowRecord | null;
  latestPermintaan: RowRecord | null;
};

export function DashboardPage({
  selectedStudent,
  biodata,
  todaySchedule,
  latestPresensi,
  latestPerkembangan,
  latestNilai,
  latestPelayanan,
  latestPermintaan,
}: DashboardPageProps) {
  if (!selectedStudent) {
    return <EmptyState message="Data siswa belum tersedia. Silakan masuk ulang." />;
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">
          Permintaan Pelayanan Terakhir
        </h3>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {latestPermintaan ? (
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
          ) : (
            <p className="text-sm text-slate-500">Belum ada data permintaan pelayanan.</p>
          )}
        </div>
      </div>

      <div className="hidden rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100 lg:block">
        <h2 className="text-lg font-semibold text-slate-900">Profil Siswa</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {biodata.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-red-50 p-4"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {item.value || "-"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Jadwal hari ini
          </h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {todaySchedule ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">{todaySchedule.label}</p>
                <p className="text-base font-semibold text-slate-900">
                  {todaySchedule.subject}
                </p>
                <p className="text-sm text-slate-500">
                  {todaySchedule.time || "Jam belum ditentukan"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Jadwal hari ini belum tersedia untuk cabang dan kelompok kelas siswa.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Presensi Terakhir
          </h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {latestPresensi ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">
                  {renderDateValue(latestPresensi)}
                </p>
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
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Perkembangan Terakhir
          </h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {latestPerkembangan ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">
                  {renderDateValue(latestPerkembangan)}
                </p>
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
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Nilai Tes Terakhir
          </h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {latestNilai ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">
                  {renderDateValue(latestNilai)}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {renderRowValue(latestNilai, "Jenis Tes") || "-"}
                </p>
                <p className="text-sm text-slate-500">
                  Rerata: {renderRowValue(latestNilai, "Rerata") || "-"} | Total: {renderRowValue(latestNilai, "Total") || "-"}
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
                <p className="text-sm text-slate-500">
                  {renderDateValue(latestPelayanan)}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {renderRowValue(latestPelayanan, "Mata Pelajaran") || "-"}
                </p>
                <p className="text-sm text-slate-500">
                  Materi: {renderRowValue(latestPelayanan, "Materi") || "-"} | Durasi: {renderRowValue(latestPelayanan, "Durasi") || "-"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Belum ada data pelayanan tambahan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
