export type TodaySession = {
  label: string;
  subject: string;
  time: string;
  dateValue?: string;
};

export type DashboardCards = {
  biodata: { label: string; value: string }[];
  todaySchedule: TodaySession | null;
  todaySchedules: TodaySession[];
};

export type ScheduleColumn = {
  dateLabel: string;
  mapel?: string;
  jam?: string;
};
