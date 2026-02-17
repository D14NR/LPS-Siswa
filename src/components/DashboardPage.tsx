import type { DashboardCards } from "@/components/dataDashboard";
import { EmptyState } from "@/components/EmptyState";
import type { RowRecord } from "@/utils/dataHelpers";
import { formatDateValue, getRowValue } from "@/utils/dataHelpers";

const renderRowValue = (row: RowRecord | null, key: string) =>
  row ? getRowValue(row, key) || "" : "";
const renderDateValue = (row: RowRecord | null) =>
  row ? formatDateValue(getRowValue(row, "Tanggal") || getRowValue(row, "Timestamp")) : "";

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
            Permintaan Pelayanan Terakhir
          </h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {latestPermintaan ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">
                  {renderDateValue(latestPermintaan)}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {renderRowValue(latestPermintaan, "Mata Pelajaran") || "-"}
                </p>
                <p className="text-sm text-slate-500">
                  Pengajar: {renderRowValue(latestPermintaan, "Pengajar") || "-"}
                </p>
                <p className="text-sm text-slate-500">
                  Status: {renderRowValue(latestPermintaan, "Status") || "Menunggu"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Belum ada data permintaan pelayanan.</p>
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
