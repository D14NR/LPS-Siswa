export type RowRecord = Record<string, string>;

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
  const parsed = new Date(value);
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

export const formatDateValue = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const monthMap: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
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
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
