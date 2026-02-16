import type { RowRecord } from "@/utils/dataHelpers";

export type DashboardCards = {
  biodata: { label: string; value: string }[];
  todaySchedule: { label: string; subject: string; time: string; dateValue?: string } | null;
  latestPresensi: RowRecord | null;
  latestPerkembangan: RowRecord | null;
  latestNilai: RowRecord | null;
  latestPelayanan: RowRecord | null;
};

export type ScheduleColumn = {
  dateLabel: string;
  mapel: string;
  jam: string;
};
