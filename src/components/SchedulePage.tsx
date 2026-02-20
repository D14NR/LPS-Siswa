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
  tambahanRows?: RowRecord[];
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
  tambahanRows,
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

  const asalSekolah = getRowValue(selectedSchedule, "Asal Sekolah") || "-";
  const cabang = getRowValue(selectedSchedule, "Cabang") || "-";

  if (variant === "tambahan") {
    // Build a map of dateLabel -> sessions from ALL tambahan rows
    type TambahanSession = { kelompokKelas: string; subject: string; time: string };
    const dateSessionMap: Record<string, TambahanSession[]> = {};

    const rows = tambahanRows && tambahanRows.length > 0 ? tambahanRows : [selectedSchedule];

    rows.forEach((row: RowRecord) => {
      const kelompokKelas =
        row["Kelompok Kelas"] || row["kelompok Kelas"] || "-";
      scheduleColumns.forEach((col) => {
        const cellValue = (row[col.dateLabel] || "").trim();
        if (!cellValue) return;
        const sessions = parseScheduleSessions(cellValue);
        sessions.forEach((session) => {
          if (!session.subject && !session.time) return;
          if (!dateSessionMap[col.dateLabel]) {
            dateSessionMap[col.dateLabel] = [];
          }
          dateSessionMap[col.dateLabel].push({
            kelompokKelas,
            subject: expandMapel(session.subject),
            time: session.time,
          });
        });
      });
    });

    const datesWithSessions = displayColumns.filter((col) => {
      const sessions = dateSessionMap[col.dateLabel];
      return sessions && sessions.length > 0;
    });

    return (
      <section className="grid gap-6">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cabang</p>
              <h2 className="text-lg font-semibold text-slate-900">{cabang}</h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Asal Sekolah</p>
              <h3 className="text-lg font-semibold text-red-600">{asalSekolah}</h3>
              <p className="text-xs text-slate-500">Menyesuaikan asal sekolah siswa.</p>
            </div>
          </div>

          {datesWithSessions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              Belum ada jadwal tambahan yang tersedia.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {datesWithSessions.map((col) => {
                const sessions = dateSessionMap[col.dateLabel] ?? [];
                const scheduleDate = getDateFromLabel(col.dateLabel);
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
                    key={col.dateLabel}
                    className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-red-50 p-5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {formatDateLabel(col.dateLabel)}
                      </p>
                      {statusLabel && (
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${statusClass}`}>
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{asalSekolah}</p>
                    <div className="mt-3 space-y-2">
                      {sessions.map((session, idx) => (
                        <div
                          key={`${col.dateLabel}-${idx}`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                              {session.kelompokKelas}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {session.subject || "-"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {session.time || "Jam belum ditentukan"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cabang</p>
            <h2 className="text-lg font-semibold text-slate-900">{getRowValue(selectedSchedule, "Cabang")}</h2>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Kelompok Kelas</p>
            <h3 className="text-lg font-semibold text-red-600">
              {getRowValue(selectedSchedule, scheduleClassKey)}
            </h3>
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
