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
  emptyMessage?: string;
  variant?: "reguler" | "tambahan";
};

const parseScheduleLine = (value: string) => {
  if (!value) return { subject: "", time: "" };
  if (value.includes("/")) {
    return parseScheduleValue(value);
  }
  const match = value.match(/^(\d{1,2}\.\d{2}\s*-\s*\d{1,2}\.\d{2})\s+(.*)$/);
  if (match) {
    return { time: match[1].trim(), subject: match[2].trim() };
  }
  return { subject: value.trim(), time: "" };
};

const parseScheduleSessions = (value: string) => {
  if (!value) return [] as { subject: string; time: string }[];
  const normalized = value.replace(/\r/g, "").replace(/\\n/g, "\n");
  let parts = normalized
    .split(/\n|;|\|/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    const timePattern = /(\d{1,2}\.\d{2}\s*-\s*\d{1,2}\.\d{2})/g;
    const segments = normalized
      .split(timePattern)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length >= 3) {
      parts = [];
      for (let i = 1; i < segments.length; i += 2) {
        const time = segments[i];
        const subject = segments[i + 1] || "";
        parts.push(`${time} ${subject}`.trim());
      }
    }
  }

  return parts.map(parseScheduleLine).filter((item) => item.subject || item.time);
};

export function SchedulePage({
  selectedSchedule,
  scheduleColumns,
  scheduleClassKey,
  emptyMessage = "Jadwal reguler belum tersedia untuk cabang dan kelompok kelas siswa.",
  variant = "reguler",
}: SchedulePageProps) {
  if (!selectedSchedule) {
    return <EmptyState message={emptyMessage} />;
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

  const tambahanInfo = {
    kelas:
      getRowValue(selectedSchedule, "Kelompok Kelas") ||
      getRowValue(selectedSchedule, "kelompok Kelas") ||
      "-",
    asalSekolah: getRowValue(selectedSchedule, "Asal Sekolah") || "-",
  };

  return (
    <section className="grid gap-6">
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cabang</p>
            <h2 className="text-lg font-semibold text-slate-900">{getRowValue(selectedSchedule, "Cabang")}</h2>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {variant === "tambahan" ? "Asal Sekolah" : "Kelompok Kelas"}
            </p>
            <h3 className="text-lg font-semibold text-red-600">
              {getRowValue(selectedSchedule, scheduleClassKey)}
            </h3>
            <p className="text-xs text-slate-500">
              {variant === "tambahan"
                ? "Menyesuaikan asal sekolah siswa."
                : "Menyesuaikan salah satu kelompok kelas siswa."}
            </p>
          </div>
        </div>
        <div
          className={`mt-6 grid gap-4 ${
            variant === "tambahan" ? "lg:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {displayColumns.map((schedule) => {
            const mapelValue = schedule.mapel ? getRowValue(selectedSchedule, schedule.mapel) : "";
            const jamValue = schedule.jam ? getRowValue(selectedSchedule, schedule.jam) : "";
            const combined = mapelValue || jamValue;
            if (!combined) return null;

            if (variant === "tambahan") {
              const sessions = parseScheduleSessions(combined);

              return (
                <div
                  key={schedule.dateLabel}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-red-50 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {formatDateLabel(schedule.dateLabel)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {tambahanInfo.kelas} , {tambahanInfo.asalSekolah}
                  </p>
                  <div className="mt-4 space-y-3">
                    {sessions.map((session, idx) => (
                      <div key={`${schedule.dateLabel}-${idx}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="text-xs text-slate-500">
                          {session.time || "Jam belum ditentukan"}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {expandMapel(session.subject) || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

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
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-red-50 p-4"
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
