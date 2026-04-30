export type RowRecord = Record<string, string>;

const MONTH_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const WEEKDAY_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export const getRowValue = (row: RowRecord | null, key: string) => {
  if (!row) return "";
  return row[key] ?? "";
};

export const matchesTextFilter = (value: string, filter: string) => {
  if (!filter) return true;
  return value.toLowerCase().includes(filter.toLowerCase());
};

export const normalizeMatch = (value: string) => value.toLowerCase().replace(/\s+/g, "").trim();

const toDateInputValue = (value: string) => {
  if (!value) return "";
  const parsed = parseFlexibleDate(value);
  if (!parsed) {
    return "";
  }
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return "";
};

export const matchesDateFilter = (value: string, filter: string) => {
  if (!filter) return true;
  const normalized = toDateInputValue(value);
  if (normalized) {
    return normalized === filter;
  }
  return value.includes(filter);
};

export const uniqueValues = (rows: RowRecord[], key: string) => {
  const values = new Set<string>();
  rows.forEach((row) => {
    const value = row[key];
    if (value) values.add(value);
  });
  return Array.from(values).sort();
};

function parseFlexibleDate(value: string) {
  if (!value) return null;

  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    return new Date(year, month, day);
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]) - 1;
    const year = Number(slashMatch[3]);
    return new Date(year, month, day);
  }

  return getDateFromLabel(trimmed) ?? (() => {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  })();
}

export const formatDateValue = (value: string) => {
  if (!value) return "-";
  const parsed = parseFlexibleDate(value);
  if (!parsed) return value;
  const weekday = WEEKDAY_ID[parsed.getDay()];
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = MONTH_SHORT_ID[parsed.getMonth()];
  const year = parsed.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

export const formatDateForStorage = (value: string) => {
  if (!value) return "";
  const parsed = parseFlexibleDate(value);
  if (!parsed) return "";
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = MONTH_SHORT_ID[parsed.getMonth()];
  const year = parsed.getFullYear();
  // Storage format: "29 Apr 2026"
  return `${day} ${month} ${year}`;
};

const monthMap: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  mei: 4,
  may: 4,
  jun: 5,
  jul: 6,
  agu: 7,
  aug: 7,
  sep: 8,
  okt: 9,
  oct: 9,
  nov: 10,
  des: 11,
  dec: 11,
};

export const getDateFromLabel = (label: string) => {
  if (!label) return null;
  const parsed = new Date(label);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  const [dayValue, monthValue, yearValue] = label.split(" ");
  const day = Number(dayValue);
  const month = monthMap[(monthValue || "").toLowerCase()];
  const year = Number(yearValue);
  if (!day || month === undefined || !year) return null;
  return new Date(year, month, day);
};

export const formatDateLabel = (label: string) => {
  const date = getDateFromLabel(label);
  if (!date) return label;
  const weekday = WEEKDAY_ID[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTH_SHORT_ID[date.getMonth()];
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

const mapelDictionary: Record<string, string> = {
  "p.mtk": "Pendalaman Matematika",
  "l.ind": "Literasi Indonesia",
  "l.ing": "Literasi Inggris",
  pu: "Penalaran Umum",
  ppu: "Pengetahuan dan Pemahaman Umum",
  pbm: "Penalaran Bahasa",
  pk: "Pengetahuan Kuantitatif",
  libur: "Libur",
};

export const expandMapel = (label: string) => {
  const key = label.trim().toLowerCase();
  return mapelDictionary[key] ?? label;
};

export const parseScheduleValue = (value: string) => {
  if (!value || value === "-") return { subject: "", time: "" };
  const [subject, time] = value.split("/").map((item) => item.trim());
  return {
    subject: subject || value,
    time: time || "",
  };
};

export const rowToRecord = (headers: string[], row: string[]) => {
  return headers.reduce<RowRecord>((acc, header, index) => {
    acc[header] = row[index] ?? "";
    return acc;
  }, {});
};

const parseSortableDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return null;
};

export const sortRowsByDateDesc = (
  rows: RowRecord[],
  dateKey = "Tanggal",
  fallbackKey = "Timestamp"
) => {
  return [...rows].sort((a, b) => {
    const dateA = parseSortableDate(a[dateKey]) ?? parseSortableDate(a[fallbackKey]);
    const dateB = parseSortableDate(b[dateKey]) ?? parseSortableDate(b[fallbackKey]);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.getTime() - dateA.getTime();
  });
};
