import { EmptyState } from "@/components/EmptyState";
import type { ScheduleColumn } from "@/components/dataDashboard";
import {
  expandMapel,
  formatDateLabel,
  getDateFromLabel,
  getRowValue,
  parseScheduleValue,
} from "@/utils/dataHelpers";
import type { RowRecord } from "@/utils/dataHelpers";

type SchedulePageProps = {
  selectedSchedule: RowRecord | null;
  scheduleColumns: ScheduleColumn[];
  scheduleClassKey: string;
};

export function SchedulePage({ selectedSchedule, scheduleColumns, scheduleClassKey }: SchedulePageProps) {
  if (!selectedSchedule) {
    return <EmptyState message="Jadwal reguler belum tersedia untuk cabang dan kelompok kelas siswa." />;
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const orderedColumns = [...scheduleColumns].sort((a, b) => {
    const aDate = getDateFromLabel(a.dateLabel)?.getTime() ?? 0;
    const bDate = getDateFromLabel(b.dateLabel)?.getTime() ?? 0;
    return aDate - bDate;
  });

  const beforeToday = orderedColumns.filter((column) => {
    const date = getDateFromLabel(column.dateLabel);
    return date ? date < startOfToday : false;
  });

  const fromToday = orderedColumns.filter((column) => {
    const date = getDateFromLabel(column.dateLabel);
    return date ? date >= startOfToday : false;
  });

  const displayColumns = [...fromToday, ...beforeToday];

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cabang</p>
            <h2 className="text-lg font-semibold text-slate-900">{getRowValue(selectedSchedule, "Cabang")}</h2>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Kelompok Kelas</p>
            <h3 className="text-lg font-semibold text-red-600">{getRowValue(selectedSchedule, scheduleClassKey)}</h3>
            <p className="text-xs text-slate-500">Menyesuaikan salah satu kelompok kelas siswa.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayColumns.map((schedule) => {
            const mapelValue = schedule.mapel ? getRowValue(selectedSchedule, schedule.mapel) : "";
            const jamValue = schedule.jam ? getRowValue(selectedSchedule, schedule.jam) : "";
            const combined = mapelValue || jamValue;
            if (!combined) return null;
            const parsed = schedule.mapel && schedule.jam
              ? { subject: expandMapel(mapelValue), time: jamValue }
              : parseScheduleValue(combined);
            const scheduleDate = getDateFromLabel(schedule.dateLabel);
            const statusLabel = scheduleDate
              ? scheduleDate.getTime() === startOfToday.getTime()
                ? "Hari ini"
                : scheduleDate < startOfToday
                  ? "Sudah terlewat"
                  : "Akan datang"
              : "";
            const statusClass = scheduleDate
              ? scheduleDate.getTime() === startOfToday.getTime()
                ? "bg-red-600 text-white"
                : scheduleDate < startOfToday
                  ? "bg-slate-200 text-slate-600"
                  : "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500";

            return (
              <div
                key={schedule.dateLabel}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {formatDateLabel(schedule.dateLabel)}
                  </p>
                  {statusLabel && (
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${statusClass}`}>
                      {statusLabel}
                    </span>
                  )}
                </div>
                <p className="text-base font-semibold text-slate-900">{parsed.subject || "-"}</p>
                <p className="text-sm text-slate-500">{parsed.time || "Jam belum ditentukan"}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
