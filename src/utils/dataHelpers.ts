export type SheetTable = {
  cols: { label: string }[];
  rows: { c: { v: string | number | null }[] }[];
};

export type RowRecord = Record<string, string>;

export const normalizeValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
};

export const normalizeHeader = (value: string | number | null | undefined) =>
  normalizeValue(value).replace(/\s+/g, " ").trim();

export const normalizeMatch = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

export const splitGroupValues = (value: string) => {
  if (!value) return [] as string[];
  return value
    .split(/[,;\n|]+/)
    .map((item) => normalizeValue(item))
    .filter(Boolean);
};

export const isSameValue = (left: string, right: string) => {
  if (!left || !right) return false;
  return normalizeMatch(left) === normalizeMatch(right);
};

export const isInGroupValues = (left: string, right: string) => {
  if (!left || !right) return false;
  if (isSameValue(left, right)) return true;
  return splitGroupValues(right).some((value) => isSameValue(left, value));
};

export const normalizeNis = (value: string | number | null | undefined) =>
  normalizeValue(value)
    .replace(/\s+/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();

export const normalizeNisDigits = (value: string | number | null | undefined) =>
  normalizeNis(value).replace(/[^0-9]/g, "");

export const stripLeadingZeros = (value: string) => value.replace(/^0+/, "") || "0";

export const isNisMatch = (value: string | number | null | undefined, target: string) => {
  const normalizedValue = normalizeNis(value);
  const normalizedTarget = normalizeNis(target);
  if (!normalizedValue || !normalizedTarget) return false;
  if (normalizedValue === normalizedTarget) return true;

  const strippedValue = stripLeadingZeros(normalizedValue.replace(/[^0-9a-z]/gi, ""));
  const strippedTarget = stripLeadingZeros(normalizedTarget.replace(/[^0-9a-z]/gi, ""));
  if (strippedValue === strippedTarget) return true;

  const digitsValue = stripLeadingZeros(normalizeNisDigits(value));
  const digitsTarget = stripLeadingZeros(normalizeNisDigits(target));
  if (digitsValue && digitsTarget && digitsValue === digitsTarget) return true;

  const numericValue = Number(normalizedValue);
  const numericTarget = Number(normalizedTarget);
  if (!Number.isNaN(numericValue) && !Number.isNaN(numericTarget)) {
    return numericValue === numericTarget;
  }
  return false;
};

type HeaderMode = "firstRow" | "colLabels";

export const buildHeadersAndRows = (table: SheetTable, mode: HeaderMode = "colLabels") => {
  if (table.rows.length === 0) {
    return { headers: [] as string[], rows: [] as Record<string, string>[] };
  }

  const colHeaders = table.cols.map((col, index) =>
    normalizeHeader(col.label ?? `Kolom ${index + 1}`)
  );
  const hasUsefulColHeaders = colHeaders.some(
    (header) => header && !/^kolom\s+\d+$/i.test(header) && !/^[A-Z]$/i.test(header)
  );

  if (mode === "colLabels" && hasUsefulColHeaders) {
    const rows = table.rows.map((row) => {
      const record: Record<string, string> = {};
      row.c.forEach((cell, index) => {
        record[colHeaders[index]] = normalizeValue(cell?.v ?? "");
      });
      return record;
    });
    return { headers: colHeaders, rows };
  }

  const headers = table.rows[0].c.map((cell, index) =>
    normalizeHeader(cell?.v ?? `Kolom ${index + 1}`)
  );
  const rows = table.rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    row.c.forEach((cell, index) => {
      record[headers[index]] = normalizeValue(cell?.v ?? "");
    });
    return record;
  });
  return { headers, rows };
};

export const getRowValue = (row: Record<string, string>, key: string) => {
  const normalizedKey = normalizeMatch(key);
  const foundKey = Object.keys(row).find((header) => normalizeMatch(header) === normalizedKey);
  return foundKey ? row[foundKey] : "";
};

const mapelAliases: Record<string, string> = {
  mtk: "Matematika",
  "p.mtk": "Pendalaman Matematika",
  "l.ind": "Bahasa Indonesia",
  "l.ing": "Bahasa Inggris",
  pk: "Pengetahuan Keagamaan",
  pu: "Penalaran Umum",
  ppu: "Pengetahuan & Pemahaman Umum",
  pbm: "Pemahaman Bacaan & Menulis",
  libur: "Libur",
};

export const expandMapel = (value: string) => {
  const normalized = normalizeMatch(value.replace(/\./g, "."));
  return mapelAliases[normalized] ?? value;
};

export const parseScheduleValue = (value: string) => {
  if (!value) {
    return { subject: "", time: "" };
  }
  const parts = value.split("/").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const [subject, ...timeParts] = parts;
    return {
      subject: expandMapel(subject),
      time: timeParts.join(" / ").trim(),
    };
  }
  return { subject: expandMapel(value), time: "" };
};

export const getDateFromLabel = (dateLabel: string) => {
  const cleaned = normalizeHeader(dateLabel);
  const label = cleaned.includes(",") ? cleaned.split(",")[1]?.trim() : cleaned;
  const [day, month, year] = label?.split("/").map((part) => Number(part)) ?? [];
  if (day && month && year) {
    return new Date(year, month - 1, day);
  }
  return null;
};

export const formatDateLabel = (dateLabel: string) => {
  const cleaned = normalizeHeader(dateLabel);
  const date = getDateFromLabel(cleaned);
  if (date) {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  }
  return cleaned;
};

export const parseDateValue = (value: string) => {
  if (!value) return null;
  const trimmed = value.trim();
  const dateMatch = trimmed.match(/Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})(?:,\s*\d+)?\)/i);
  if (dateMatch) {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    if (year && !Number.isNaN(month) && day) {
      return new Date(year, month, day);
    }
  }
  const clean = trimmed.split(" ")[0].trim();
  const parts = clean.split(/[\/\-]/).filter(Boolean);
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      const [year, month, day] = parts.map((part) => Number(part));
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }
    const [day, month, year] = parts.map((part) => Number(part));
    if (day && month && year) {
      return new Date(year, month - 1, day);
    }
  }
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const monthNames = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];

const weekdayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const formatDateValue = (value: string) => {
  const date = parseDateValue(value);
  if (!date) return value || "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = monthNames[date.getMonth()];
  const weekday = weekdayNames[date.getDay()];
  return `${weekday}, ${day} ${month} ${date.getFullYear()}`;
};

export const sortByDateDesc = (rows: Record<string, string>[], dateKey = "Tanggal") => {
  return [...rows].sort((a, b) => {
    const dateA = parseDateValue(getRowValue(a, dateKey) || getRowValue(a, "Timestamp"))?.getTime() ?? 0;
    const dateB = parseDateValue(getRowValue(b, dateKey) || getRowValue(b, "Timestamp"))?.getTime() ?? 0;
    return dateB - dateA;
  });
};

export const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const matchesDateFilter = (value: string, filterValue: string) => {
  if (!filterValue) return true;
  const dateValue = parseDateValue(value);
  const filterDate = parseDateValue(filterValue);
  if (!dateValue || !filterDate) return false;
  return isSameDay(dateValue, filterDate);
};

export const matchesTextFilter = (value: string, filterValue: string) => {
  if (!filterValue) return true;
  return normalizeMatch(value).includes(normalizeMatch(filterValue));
};

export const uniqueValues = (rows: RowRecord[], key: string) => {
  const values = rows.map((row) => getRowValue(row, key)).filter(Boolean);
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
};
