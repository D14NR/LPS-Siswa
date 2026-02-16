export type DashboardCards = {
  biodata: { label: string; value: string }[];
  todaySchedule: {
    label: string;
    subject: string;
    time: string;
  } | null;
};

export type ScheduleColumn = {
  dateLabel: string;
  mapel?: string;
  jam?: string;
};
