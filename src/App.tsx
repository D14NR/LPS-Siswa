import { useEffect, useMemo, useState } from "react";
import logo from "@/assets/logo.svg";
import { DashboardPage } from "@/components/DashboardPage";
import { SchedulePage } from "@/components/SchedulePage";
import { PresensiPage } from "@/pages/PresensiPage";
import { PerkembanganPage } from "@/pages/PerkembanganPage";
import { NilaiPage } from "@/pages/NilaiPage";
import { PelayananPage } from "@/pages/PelayananPage";
import { PengajarPage } from "@/pages/PengajarPage";
import { BankSoalPage } from "@/pages/BankSoalPage";
import { Modal } from "@/components/Modal";
import type { DashboardCards, ScheduleColumn } from "@/components/dataDashboard";
import {
  parseScheduleValue,
  rowToRecord,
  sortRowsByDateDesc,
  type RowRecord,
} from "@/utils/dataHelpers";

const MENU_ITEMS = [
  "Dashboard Siswa",
  "Jadwal Reguler",
  "Jadwal Tambahan",
  "Riwayat Presensi",
  "Riwayat Perkembangan Belajar",
  "Riwayat Nilai Tes",
  "Bank Soal",
  "Riwayat Pelayanan/Tambahan",
  "No. Whatsapp Pengajar",
];

const SHEETS = {
  biodata: {
    id: "1qN1MJ7kVRbSnsV9-WblGikHmCTzLZOTezmuUBgrZ3-k",
    sheet: "Siswa",
  },
  reguler: {
    id: "1DSon0f5M1PeMAE_xeHVWLDlmVTDQM_Vr1RuCdcCYQB0",
    sheet: "Jadwal_Siswa",
  },
  tambahan: {
    id: "1DSon0f5M1PeMAE_xeHVWLDlmVTDQM_Vr1RuCdcCYQB0",
    sheet: "Jadwal_Tambahan",
  },
  presensi: {
    id: "13oDDldQdcVBg5ai3nS9oGtYuq8ijWsloNRmXK87IHnw",
    sheet: "Presensi",
  },
  perkembangan: {
    id: "1fZmtYB5nPslds7pjQ6sIDHfVYTf_wg1KeTXbmKeUBMw",
    sheet: "Perkembangan",
  },
  pelayanan: {
    id: "1KcsMCeFmGAmwKHFqnIxiUxDmLDpR6YDBZBd8Zbd-s6w",
    sheet: "Pelayanan",
  },
  pengajar: {
    id: "1PQNdVQUJa-YQaWv-KZdIC7WE3VVlRAxpX5XT79NMJos",
    sheet: "Pengajar",
  },
  waPengajar: {
    id: "1PQNdVQUJa-YQaWv-KZdIC7WE3VVlRAxpX5XT79NMJos",
    sheet: "Wa_Pengajar",
  },
  permintaan: {
    id: "1PQNdVQUJa-YQaWv-KZdIC7WE3VVlRAxpX5XT79NMJos",
    sheet: "Permintaan",
  },
};

const NILAI_SHEETS = [
  { label: "Nilai UTBK",       id: "1DKI84nBDAc8d3W7UQRP6f713AxqAJv1YVeZOhyso1qg", sheet: "Nilai UTBK" },
  { label: "Nilai TKA SMA",    id: "1Wbx_ZuKCOeH1Ed8yxIn-jDkwmP7ZS4p1Sn7kOhWaDVM", sheet: "Nilai TKA SMA" },
  { label: "Nilai TKA SMP",    id: "1yb_UoQKe3tgbbTmnfYUFQiNQLe9NGdWsE-fzVLGthmw", sheet: "Nilai TKA SMP" },
  { label: "Nilai TKA SD",     id: "1KWZfvlxVkXJGs4yCwOIIHFU92z11AMF7YWIrCMbkGjQ", sheet: "Nilai TKA SD" },
  { label: "Nilai EVALUASI",   id: "1gCIG5FDpcfKZsbkwyC3eAXOnTl_dEJB88ZyMiue5ytM", sheet: "Nilai EVALUASI" },
];

const createCsvUrl = (id: string, sheet: string) =>
  `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

const fetchSheetText = async (id: string, sheet: string) => {
  try {
    const response = await fetch(createCsvUrl(id, sheet));
    if (!response.ok) {
      throw new Error("Gagal mengambil data.");
    }
    return await response.text();
  } catch {
    return null;
  }
};

const parseCSV = (text: string) => {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows.map((rowItem) => rowItem.map((cell) => cell.trim()));
};

const formatRows = (rows: string[][]) => {
  if (rows.length === 0) {
    return { headers: [], data: [] };
  }
  const [headers, ...data] = rows;
  return { headers, data };
};

type TableData = { headers: string[]; data: string[][] };

const getHeaderIndex = (headers: string[], label: string) =>
  headers.findIndex(
    (item) => item.toLowerCase().trim() === label.toLowerCase().trim()
  );

const parseDate = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateHeader = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const filterRowsByNis = (table: TableData, nis: string) => {
  const nisIndex = getHeaderIndex(table.headers, "Nis");
  if (nisIndex === -1) {
    return table;
  }
  return {
    headers: table.headers,
    data: table.data.filter((row) => row[nisIndex] === nis),
  };
};

const getLatestRow = (table: TableData, nis: string) => {
  const nisIndex = getHeaderIndex(table.headers, "Nis");
  const tanggalIndex = getHeaderIndex(table.headers, "Tanggal");
  const timestampIndex = getHeaderIndex(table.headers, "Timestamp");
  if (nisIndex === -1) return null;

  const rows = table.data.filter((row) => row[nisIndex] === nis);
  if (rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => {
    const dateA = parseDate(a[tanggalIndex] || a[timestampIndex]);
    const dateB = parseDate(b[tanggalIndex] || b[timestampIndex]);
    if (!dateA || !dateB) return 0;
    return dateB.getTime() - dateA.getTime();
  });

  return rowToRecord(table.headers, sorted[0]);
};

const getLatestRowWithDate = (table: TableData, nis: string) => {
  const row = getLatestRow(table, nis);
  if (!row) return null;
  const dateValue = row["Tanggal"] || row["Timestamp"] || "";
  return { row, date: parseDate(dateValue) };
};



const PlaceholderSection = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{title}</p>
    <h3 className="mt-3 text-xl font-semibold text-slate-800">{description}</h3>
    <p className="mt-2 text-sm text-slate-500">
      Data akan otomatis tampil ketika basis data terhubung sudah tersedia.
    </p>

  </div>
);

export function App() {
  const [activeMenu, setActiveMenu] = useState(MENU_ITEMS[0]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [biodata, setBiodata] = useState<TableData>({ headers: [], data: [] });
  const [jadwalReguler, setJadwalReguler] = useState<TableData>({
    headers: [],
    data: [],
  });
  const [jadwalTambahan, setJadwalTambahan] = useState<TableData>({
    headers: [],
    data: [],
  });
  const [presensi, setPresensi] = useState<TableData>({ headers: [], data: [] });
  const [perkembangan, setPerkembangan] = useState<TableData>({
    headers: [],
    data: [],
  });
  const [pelayanan, setPelayanan] = useState<TableData>({
    headers: [],
    data: [],
  });
  const [pengajar, setPengajar] = useState<TableData>({ headers: [], data: [] });
  const [waPengajar, setWaPengajar] = useState<TableData>({ headers: [], data: [] });
  const [permintaan, setPermintaan] = useState<TableData>({ headers: [], data: [] });
  const [nilaiTes, setNilaiTes] = useState<Record<string, TableData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nisInput, setNisInput] = useState("");
  const [activeNis, setActiveNis] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem("activeNis")
  );
  const [refreshToken, setRefreshToken] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRefreshToken((prev) => prev + 1);
    }, 5 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const nilaiRequests = NILAI_SHEETS.map((item) =>
          fetchSheetText(item.id, item.sheet)
        );

        const [
          biodataText,
          regulerText,
          tambahanText,
          presensiText,
          perkembanganText,
          pelayananText,
          pengajarText,
          waPengajarText,
          permintaanText,
          ...nilaiTexts
        ] = await Promise.all([
          fetchSheetText(SHEETS.biodata.id, SHEETS.biodata.sheet),
          fetchSheetText(SHEETS.reguler.id, SHEETS.reguler.sheet),
          fetchSheetText(SHEETS.tambahan.id, SHEETS.tambahan.sheet),
          fetchSheetText(SHEETS.presensi.id, SHEETS.presensi.sheet),
          fetchSheetText(SHEETS.perkembangan.id, SHEETS.perkembangan.sheet),
          fetchSheetText(SHEETS.pelayanan.id, SHEETS.pelayanan.sheet),
          fetchSheetText(SHEETS.pengajar.id, SHEETS.pengajar.sheet),
          fetchSheetText(SHEETS.waPengajar.id, SHEETS.waPengajar.sheet),
          fetchSheetText(SHEETS.permintaan.id, SHEETS.permintaan.sheet),
          ...nilaiRequests,
        ]);

        if (!biodataText) {
          throw new Error("Gagal mengambil data biodata dari basis data.");
        }

        setBiodata(formatRows(parseCSV(biodataText)));
        setJadwalReguler(formatRows(parseCSV(regulerText || "")));
        setJadwalTambahan(formatRows(parseCSV(tambahanText || "")));
        setPresensi(formatRows(parseCSV(presensiText || "")));
        setPerkembangan(formatRows(parseCSV(perkembanganText || "")));
        setPelayanan(formatRows(parseCSV(pelayananText || "")));
        setPengajar(formatRows(parseCSV(pengajarText || "")));
        setWaPengajar(formatRows(parseCSV(waPengajarText || "")));
        setPermintaan(formatRows(parseCSV(permintaanText || "")));

        const nilaiData: Record<string, TableData> = {};
        NILAI_SHEETS.forEach((item, index) => {
          nilaiData[item.label] = formatRows(parseCSV(nilaiTexts[index] || ""));
        });
        setNilaiTes(nilaiData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshToken]);

  useEffect(() => {
    if (activeNis) {
      localStorage.setItem("activeNis", activeNis);
      return;
    }
    localStorage.removeItem("activeNis");
  }, [activeNis]);

  const studentRow = useMemo(() => {
    if (!activeNis) return null;
    const nisIndex = getHeaderIndex(biodata.headers, "Nis");
    if (nisIndex === -1) return null;
    return biodata.data.find((row) => row[nisIndex] === activeNis) || null;
  }, [activeNis, biodata]);

  const selectedStudent = useMemo(() => {
    if (!studentRow) return null;
    return rowToRecord(biodata.headers, studentRow);
  }, [biodata.headers, studentRow]);

  const studentProfile = useMemo(() => {
    if (!studentRow) return [];
    const findValue = (header: string) => {
      const index = getHeaderIndex(biodata.headers, header);
      return index >= 0 ? studentRow[index] : "-";
    };
    return [
      { label: "Nama", value: findValue("Nama") },
      { label: "NIS", value: findValue("Nis") },
      { label: "Tanggal Lahir", value: findValue("Tanggal Lahir") },
      { label: "Asal Sekolah", value: findValue("Asal Sekolah") },
      { label: "Jenjang Studi", value: findValue("Jenjang Studi") },
      { label: "Kelompok Kelas", value: findValue("Kelompok Kelas") },
      { label: "Cabang", value: findValue("Cabang") },
      { label: "No. WhatsApp", value: findValue("No.whatsapp siswa") },
      { label: "Email", value: findValue("Email") },
    ];
  }, [biodata.headers, studentRow]);



  const filteredPresensi = useMemo(() => {
    if (!activeNis) return { headers: presensi.headers, data: [] };
    return filterRowsByNis(presensi, activeNis);
  }, [presensi, activeNis]);

  const filteredPerkembangan = useMemo(() => {
    if (!activeNis) return { headers: perkembangan.headers, data: [] };
    return filterRowsByNis(perkembangan, activeNis);
  }, [perkembangan, activeNis]);

  const filteredPelayanan = useMemo(() => {
    if (!activeNis) return { headers: pelayanan.headers, data: [] };
    return filterRowsByNis(pelayanan, activeNis);
  }, [pelayanan, activeNis]);

  const filteredPermintaan = useMemo(() => {
    if (!activeNis) return { headers: permintaan.headers, data: [] };
    return filterRowsByNis(permintaan, activeNis);
  }, [permintaan, activeNis]);

  const filteredNilai = useMemo(() => {
    if (!activeNis) return {};
    const result: Record<string, TableData> = {};
    Object.entries(nilaiTes).forEach(([label, table]) => {
      result[label] = filterRowsByNis(table, activeNis);
    });
    return result;
  }, [nilaiTes, activeNis]);

  const studentSchedule = useMemo(() => {
    if (!studentRow) return { reguler: null, tambahan: [], tambahanPrimary: null };
    const kelasIndex = getHeaderIndex(biodata.headers, "Kelompok Kelas");
    const asalSekolahIndex = getHeaderIndex(biodata.headers, "Asal Sekolah");
    const kelasRaw = kelasIndex >= 0 ? studentRow[kelasIndex] : "";
    const asalSekolah = asalSekolahIndex >= 0 ? studentRow[asalSekolahIndex] : "";
    const kelasList = kelasRaw
      .split(/,|;/)
      .map((item) => item.trim())
      .filter(Boolean);

    const selectRowWithSchedule = (
      table: TableData,
      predicate: (row: string[], cabangIdx: number, kelasIdx: number) => boolean
    ) => {
      const cabangIdx = getHeaderIndex(table.headers, "Cabang");
      const kelasIdx = getHeaderIndex(table.headers, "Kelompok Kelas");
      const matches = table.data.filter((row) => predicate(row, cabangIdx, kelasIdx));
      if (matches.length === 0) return null;
      const hasSchedule = (row: string[]) =>
        row.some((cell, idx) => idx > 1 && cell.trim() !== "");
      return matches.find(hasSchedule) || matches[0];
    };

    const studentCabang = getHeaderIndex(biodata.headers, "Cabang") >= 0
      ? studentRow[getHeaderIndex(biodata.headers, "Cabang")]
      : "";

    const regulerRow = kelasList.length
      ? selectRowWithSchedule(jadwalReguler, (row, cabangIdx, kelasIdx) => {
          const kelasMatch = kelasIdx >= 0 ? kelasList.includes(row[kelasIdx]) : false;
          const cabangMatch = !studentCabang || cabangIdx === -1 || row[cabangIdx] === studentCabang;
          return kelasMatch && cabangMatch;
        })
      : null;

    const tambahanRows = asalSekolah
      ? (() => {
          const asalIndex = getHeaderIndex(jadwalTambahan.headers, "Asal Sekolah");
          const cabangIndex = getHeaderIndex(jadwalTambahan.headers, "Cabang");
          const normalize = (value: string) => value.trim().toLowerCase();
          return jadwalTambahan.data.filter((row) => {
            const asalValue = asalIndex >= 0 ? row[asalIndex] : "";
            const cabangValue = cabangIndex >= 0 ? row[cabangIndex] : "";
            const asalMatch = normalize(asalValue) === normalize(asalSekolah);
            const cabangMatch =
              !studentCabang || cabangIndex === -1 || normalize(cabangValue) === normalize(studentCabang);
            return asalMatch && cabangMatch;
          });
        })()
      : [];

    const tambahanPrimary = tambahanRows.length
      ? tambahanRows.find((row) => row.some((cell, idx) => idx > 2 && cell.trim() !== "")) || tambahanRows[0]
      : null;

    return {
      reguler: regulerRow,
      tambahan: tambahanRows,
      tambahanPrimary,
    };
  }, [studentRow, biodata.headers, jadwalReguler, jadwalTambahan]);

  const regulerScheduleRecord = useMemo<RowRecord | null>(() => {
    if (!studentSchedule.reguler) return null;
    return rowToRecord(jadwalReguler.headers, studentSchedule.reguler);
  }, [jadwalReguler.headers, studentSchedule.reguler]);

  // All matching reguler rows (same Kelompok Kelas AND same Cabang) — may have multiple rows per date
  const regulerAllRows = useMemo<RowRecord[]>(() => {
    if (!studentRow) return [];
    const kelasIndex = getHeaderIndex(biodata.headers, "Kelompok Kelas");
    const cabangIndex = getHeaderIndex(biodata.headers, "Cabang");
    const kelasRaw = kelasIndex >= 0 ? studentRow[kelasIndex] : "";
    const studentCabang = cabangIndex >= 0 ? studentRow[cabangIndex] : "";
    const kelasList = kelasRaw.split(/,|;/).map((k) => k.trim()).filter(Boolean);
    const kelasIdx = getHeaderIndex(jadwalReguler.headers, "Kelompok Kelas");
    const cabangIdx = getHeaderIndex(jadwalReguler.headers, "Cabang");
    if (kelasIdx === -1 || !kelasList.length) return [];
    return jadwalReguler.data
      .filter((row) => {
        const rowKelas = kelasIdx >= 0 ? row[kelasIdx] : "";
        const rowCabang = cabangIdx >= 0 ? row[cabangIdx] : "";
        const kelasMatch = kelasList.includes(rowKelas);
        // Only filter by cabang if student has a cabang value and schedule has cabang column
        const cabangMatch = !studentCabang || cabangIdx === -1 || rowCabang === studentCabang;
        return kelasMatch && cabangMatch;
      })
      .map((row) => rowToRecord(jadwalReguler.headers, row));
  }, [studentRow, biodata.headers, jadwalReguler]);

  const tambahanScheduleRecord = useMemo<RowRecord | null>(() => {
    if (!studentSchedule.tambahan.length || !jadwalTambahan.headers.length) return null;
    const metaKeys = ["Cabang", "Kelompok Kelas", "kelompok Kelas", "Asal Sekolah"];
    const merged = jadwalTambahan.headers.reduce<RowRecord>((acc, header, index) => {
      const values = studentSchedule.tambahan
        .map((row) => row[index] ?? "")
        .map((value) => value.trim())
        .filter(Boolean);
      acc[header] = metaKeys.includes(header) ? values[0] ?? "" : values.join("\n");
      return acc;
    }, {});
    return merged;
  }, [jadwalTambahan.headers, studentSchedule.tambahan]);

  const scheduleColumns = useMemo<ScheduleColumn[]>(() => {
    if (!jadwalReguler.headers.length) return [];
    return jadwalReguler.headers
      .filter((header) => header !== "Cabang" && header !== "Kelompok Kelas")
      .map((header) => ({ dateLabel: header, mapel: header }));
  }, [jadwalReguler.headers]);



  // Compute ALL today's sessions from every matching reguler row
  const todaySchedules = useMemo(() => {
    const todayKey = formatDateHeader(new Date());
    const regulerIndex = getHeaderIndex(jadwalReguler.headers, todayKey);
    const sessions: import("@/components/dataDashboard").TodaySession[] = [];

    if (regulerIndex >= 0 && regulerAllRows.length > 0) {
      for (const row of regulerAllRows) {
        const rawVal = jadwalReguler.headers[regulerIndex]
          ? (row as Record<string, string>)[jadwalReguler.headers[regulerIndex]] || ""
          : "";
        if (rawVal && rawVal !== "-") {
          const parsed = parseScheduleValue(rawVal);
          if (parsed && parsed.subject) {
            sessions.push({
              label: "Jadwal Reguler",
              subject: parsed.subject,
              time: parsed.time,
              dateValue: new Date().toISOString().slice(0, 10),
            });
          }
        }
      }
    }

    // If no reguler sessions, try tambahan
    if (sessions.length === 0) {
      const tambahanIndex = getHeaderIndex(jadwalTambahan.headers, todayKey);
      if (tambahanIndex >= 0 && studentSchedule.tambahanPrimary) {
        const rawVal = studentSchedule.tambahanPrimary[tambahanIndex] || "";
        if (rawVal && rawVal !== "-") {
          // split by newline in case merged rows
          const parts = rawVal.split("\n").filter(Boolean);
          for (const part of parts) {
            const parsed = parseScheduleValue(part);
            if (parsed && parsed.subject) {
              sessions.push({
                label: "Jadwal Tambahan",
                subject: parsed.subject,
                time: parsed.time,
                dateValue: new Date().toISOString().slice(0, 10),
              });
            }
          }
        }
      }
    }

    return sessions;
  }, [jadwalReguler.headers, jadwalTambahan.headers, regulerAllRows, studentSchedule.tambahanPrimary]);

  // Keep single todaySchedule for backward compat (presensi modal etc.)
  const todaySchedule = useMemo<DashboardCards["todaySchedule"]>(() => {
    return todaySchedules.length > 0 ? todaySchedules[0] : null;
  }, [todaySchedules]);

  const todayScheduleWithDate = useMemo(() => {
    if (!todaySchedule) return null;
    return {
      ...todaySchedule,
      dateValue: new Date().toISOString().slice(0, 10),
    };
  }, [todaySchedule]);

  const presensiRowsRecord = useMemo<RowRecord[]>(() => {
    const rows = filteredPresensi.data.map((row) => rowToRecord(filteredPresensi.headers, row));
    return sortRowsByDateDesc(rows);
  }, [filteredPresensi]);

  const pengajarRecords = useMemo<RowRecord[]>(() => {
    if (!pengajar.headers.length && pengajar.data.length === 0) return [];
    const hasPengajar = getHeaderIndex(pengajar.headers, "Pengajar") >= 0;
    const hasMapel = getHeaderIndex(pengajar.headers, "Mata Pelajaran") >= 0;
    if (hasPengajar || hasMapel) {
      return pengajar.data.map((row) => rowToRecord(pengajar.headers, row));
    }
    return [pengajar.headers, ...pengajar.data]
      .map((row) => ({
        Pengajar: row[0] ?? "",
        "Mata Pelajaran": row[1] ?? "",
      }))
      .filter((row) => row.Pengajar || row["Mata Pelajaran"]);
  }, [pengajar]);

  const waPengajarRecords = useMemo<RowRecord[]>(() => {
    if (!waPengajar.headers.length && waPengajar.data.length === 0) return [];
    const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
    const headers = waPengajar.headers;
    const hasHeaders = headers.some((header) => normalize(header) === "pengajar");
    if (hasHeaders) {
      return waPengajar.data.map((row) => rowToRecord(headers, row));
    }

    const rows = [headers, ...waPengajar.data]
      .map((row) => ({
        Pengajar: row[0] ?? "",
        "Mata Pelajaran": row[1] ?? "",
        "No. Whatsapp": row[2] ?? "",
      }))
      .filter((row) => row.Pengajar || row["Mata Pelajaran"] || row["No. Whatsapp"]);

    return rows;
  }, [waPengajar]);

  const latestPresensi = useMemo<RowRecord | null>(
    () => (activeNis ? getLatestRow(presensi, activeNis) : null),
    [presensi, activeNis]
  );

  const latestPerkembangan = useMemo<RowRecord | null>(
    () => (activeNis ? getLatestRow(perkembangan, activeNis) : null),
    [perkembangan, activeNis]
  );

  const latestPelayanan = useMemo<RowRecord | null>(
    () => (activeNis ? getLatestRow(pelayanan, activeNis) : null),
    [pelayanan, activeNis]
  );

  const latestPermintaan = useMemo<RowRecord | null>(
    () => (activeNis ? getLatestRow(permintaan, activeNis) : null),
    [permintaan, activeNis]
  );

  const latestNilai = useMemo<RowRecord | null>(() => {
    if (!activeNis) return null;
    let latestRow: RowRecord | null = null;
    let latestDate: Date | null = null;

    Object.values(nilaiTes).forEach((table) => {
      const record = getLatestRowWithDate(table, activeNis);
      if (!record) return;
      if (!latestDate || (record.date && record.date > latestDate)) {
        latestRow = record.row;
        latestDate = record.date;
      }
    });

    return latestRow;
  }, [nilaiTes, activeNis]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-200 bg-white/70">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Memuat data...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center text-rose-600">
          <p className="text-sm uppercase tracking-[0.2em]">{error}</p>
          <p className="mt-3 text-sm text-rose-500">
            Pastikan basis data dapat diakses publik.
          </p>
        </div>
      );
    }

    if (!studentRow) {
      return (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-500">
            NIS tidak ditemukan
          </p>
          <p className="mt-2 text-sm text-amber-600">
            Pastikan NIS siswa sudah benar dan tersedia pada basis data biodata.
          </p>
        </div>
      );
    }

    switch (activeMenu) {
      case "Dashboard Siswa":
        return (
          <DashboardPage
            selectedStudent={selectedStudent}
            todaySchedule={todaySchedule}
            todaySchedules={todaySchedules}
            latestPresensi={latestPresensi}
            latestPerkembangan={latestPerkembangan}
            latestNilai={latestNilai}
            latestPelayanan={latestPelayanan}
            latestPermintaan={latestPermintaan}
            pengajarRows={pengajarRecords}
            onNavigate={setActiveMenu}
          />
        );
      case "Jadwal Reguler":
        return jadwalReguler.headers.length > 0 && regulerScheduleRecord ? (
          <SchedulePage
            selectedSchedule={regulerScheduleRecord}
            scheduleColumns={scheduleColumns}
            scheduleClassKey="Kelompok Kelas"
            regulerAllRows={regulerAllRows}
          />
        ) : (
          <PlaceholderSection
            title="Jadwal Reguler"
            description="Data jadwal reguler belum tersedia."
          />
        );
      case "Jadwal Tambahan":
        return jadwalTambahan.headers.length > 0 && tambahanScheduleRecord ? (
          <SchedulePage
            selectedSchedule={tambahanScheduleRecord}
            scheduleColumns={jadwalTambahan.headers
              .filter((header) => !["Cabang", "Kelompok Kelas", "kelompok Kelas", "Asal Sekolah"].includes(header))
              .map((header) => ({ dateLabel: header, mapel: header }))}
            scheduleClassKey="Asal Sekolah"
            emptyMessage="Jadwal tambahan belum tersedia untuk asal sekolah siswa."
            variant="tambahan"
            tambahanRows={studentSchedule.tambahan.map((row) => rowToRecord(jadwalTambahan.headers, row))}
          />
        ) : (
          <PlaceholderSection
            title="Jadwal Tambahan"
            description="Data jadwal tambahan belum tersedia."
          />
        );
      case "Riwayat Presensi":
        return (
          <PresensiPage
            selectedStudent={selectedStudent}
            presensiRows={presensiRowsRecord}
            todaySchedule={todayScheduleWithDate}
            pengajarRows={pengajarRecords.length ? pengajarRecords : presensiRowsRecord}
          />
        );
      case "Riwayat Perkembangan Belajar": {
        const perkembanganRows = sortRowsByDateDesc(
          filteredPerkembangan.data.map((row) => rowToRecord(filteredPerkembangan.headers, row))
        );
        return (
          <PerkembanganPage
            selectedStudent={selectedStudent}
            perkembanganRows={perkembanganRows}
            pengajarRows={pengajarRecords}
          />
        );
      }
      case "Riwayat Pelayanan/Tambahan": {
        const pelayananRows = sortRowsByDateDesc(
          filteredPelayanan.data.map((row) => rowToRecord(filteredPelayanan.headers, row))
        );
        return (
          <PelayananPage
            selectedStudent={selectedStudent}
            pelayananRows={pelayananRows}
            pengajarRows={pengajarRecords}
          />
        );
      }
      case "Riwayat Nilai Tes": {
        const datasets = NILAI_SHEETS.map((category) => {
          const data = filteredNilai[category.label];
          const rows = data?.data?.map((row) => rowToRecord(data.headers, row)) ?? [];
          return {
            key: category.sheet.toLowerCase().replace(/\s+/g, "-"),
            label: category.label,
            rows: sortRowsByDateDesc(rows),
            headers: data?.headers ?? [],
          };
        });
        return <NilaiPage selectedStudent={selectedStudent} datasets={datasets} />;
      }
      case "Bank Soal": {
        return <BankSoalPage />;
      }
      case "No. Whatsapp Pengajar": {
        return (
          <PengajarPage
            pengajarRows={waPengajarRecords}
            selectedStudent={selectedStudent}
            permintaanRows={sortRowsByDateDesc(
              filteredPermintaan.data.map((row) => rowToRecord(filteredPermintaan.headers, row))
            )}
          />
        );
      }
      default:
        return (
          <PlaceholderSection
            title={activeMenu}
            description="Belum ada data yang tersedia untuk menu ini."
          />
        );
    }
  };

  if (!activeNis) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-slate-900">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-white/5" />
          <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-white/5" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
          <div className="grid w-full gap-8 lg:grid-cols-2 lg:items-center">
            {/* Left branding */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-white/15 px-5 py-3 backdrop-blur-sm">
                <img src={logo} alt="Logo LPS" className="h-10 w-10" />
                <div className="text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-red-100">LPS Semarang-Kendal</p>
                  <p className="text-sm font-bold text-white">Laporan Perkembangan Siswa</p>
                </div>
              </div>
              <h1 className="mt-8 text-4xl font-black leading-tight text-white lg:text-5xl">
                Portal<br />Rapor Siswa<br />
                <span className="text-red-200">Digital</span>
              </h1>
              <p className="mt-4 max-w-md text-base text-red-100 lg:text-lg">
                Akses jadwal, presensi, perkembangan belajar, dan riwayat nilai secara real-time.
              </p>
              <div className="mt-8 hidden flex-wrap gap-3 lg:flex">
                {["Jadwal Belajar", "Riwayat Presensi", "Nilai Tes", "Perkembangan Siswa"].map((f) => (
                  <span key={f} className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Right login card */}
            <div className="w-full rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-md shadow-red-200">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Portal Siswa</p>
                  <p className="text-base font-bold text-slate-900">Masuk dengan NIS</p>
                </div>
              </div>

              <p className="mb-5 text-sm text-slate-500">
                Masukkan Nomor Induk Siswa (NIS) untuk mengakses dashboard rapor dan histori belajarmu.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Nomor Induk Siswa (NIS)
                  </label>
                  <input
                    value={nisInput}
                    onChange={(event) => setNisInput(event.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const trimmed = nisInput.trim();
                        if (trimmed) { setActiveNis(trimmed); setIsSidebarOpen(false); }
                      }
                    }}
                    placeholder="Contoh: 31-443-001-5"
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-700 shadow-sm transition focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100"
                  />
                </div>
                <button
                  onClick={() => {
                    const trimmed = nisInput.trim();
                    if (!trimmed) return;
                    setActiveNis(trimmed);
                    setIsSidebarOpen(false);
                  }}
                  className="group w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:from-red-700 hover:to-red-800 hover:shadow-red-300 active:scale-[0.99]"
                >
                  <span className="flex items-center justify-center gap-2">
                    Masuk Dashboard
                    <svg className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-slate-500">
                  Pastikan NIS sudah terdaftar pada basis data biodata siswa. Hubungi admin LPS jika mengalami masalah.
                </p>
              </div>

              <p className="mt-5 text-center text-[10px] uppercase tracking-widest text-slate-300">© 2026 by D14nr</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const menuIcons: Record<string, string> = {
    "Dashboard Siswa": "🏠",
    "Jadwal Reguler": "📅",
    "Jadwal Tambahan": "🗓️",
    "Riwayat Presensi": "📝",
    "Riwayat Perkembangan Belajar": "📈",
    "Riwayat Nilai Tes": "🏆",
    "Bank Soal": "📚",
    "Riwayat Pelayanan/Tambahan": "🎯",
    "No. Whatsapp Pengajar": "📞",
  };

  const studentInitial = (selectedStudent as Record<string, string> | null)?.["Nama"]?.slice(0, 1)?.toUpperCase() || "S";
  const studentName = (selectedStudent as Record<string, string> | null)?.["Nama"] || activeNis || "Siswa";

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 shadow-md shadow-red-200">
              <img src={logo} alt="Logo LPS" className="h-7 w-7" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">LPS Semarang-Kendal</p>
              <p className="text-sm font-bold text-slate-900 leading-tight">Rapor Siswa Digital</p>
            </div>
          </div>

          {/* Center: Active menu breadcrumb */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5">
            <span className="text-base">{menuIcons[activeMenu] || "📋"}</span>
            <span className="text-xs font-semibold text-slate-600">{activeMenu}</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-red-200 hover:text-red-600 lg:hidden"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>

            {/* Reload */}
            <button
              onClick={() => setRefreshToken((prev) => prev + 1)}
              title="Muat Ulang Data"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-red-200 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Profile button */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:border-red-200"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-xs font-bold text-white shadow-sm">
                {studentInitial}
              </span>
              <span className="hidden max-w-[120px] truncate text-xs font-semibold text-slate-700 sm:block">
                {studentName}
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={() => {
                setActiveNis(null);
                setNisInput("");
                setActiveMenu(MENU_ITEMS[0]);
                setIsSidebarOpen(false);
              }}
              title="Logout"
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 shadow-sm transition hover:border-red-200 hover:text-red-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? "flex" : "hidden"
          } lg:flex flex-col border-r border-slate-200 bg-white shadow-sm transition-all ${
            isSidebarCollapsed ? "lg:w-[68px]" : "lg:w-[240px]"
          } w-full absolute inset-y-0 top-[57px] z-30 lg:relative lg:top-0 lg:inset-y-auto overflow-y-auto`}
        >
          {/* Collapse toggle */}
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
            {!isSidebarCollapsed && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Menu Rapor</p>
            )}
            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden lg:flex ml-auto h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-red-200 hover:text-red-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarCollapsed
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                }
              </svg>
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 space-y-0.5 p-2">
            {MENU_ITEMS.map((item) => {
              const icon = menuIcons[item] || "📋";
              const isActive = activeMenu === item;
              return (
                <button
                  key={item}
                  onClick={() => {
                    setActiveMenu(item);
                    setIsSidebarOpen(false);
                  }}
                  title={item}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-200"
                      : "text-slate-600 hover:bg-red-50 hover:text-red-700"
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base transition ${
                    isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-red-100"
                  }`}>
                    {icon}
                  </span>
                  <span className={`truncate leading-tight ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
                    {item}
                  </span>
                  {isActive && !isSidebarCollapsed && (
                    <svg className="ml-auto h-3.5 w-3.5 shrink-0 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          {!isSidebarCollapsed && (
            <div className="border-t border-slate-100 p-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sumber Data</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Data diambil langsung dari basis data terpusat LPS yang diperbarui secara berkala.
                </p>
              </div>
              <p className="mt-3 text-center text-[9px] uppercase tracking-widest text-slate-300">© 2026 by D14nr</p>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Page header strip */}
          <div className="border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-xl">
                {menuIcons[activeMenu] || "📋"}
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">{activeMenu}</h2>
                <p className="text-xs text-slate-400">Pantau informasi siswa dan histori belajar secara terstruktur.</p>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {renderContent()}
          </div>
        </main>
      </div>

      <Modal
        title="Profil Siswa"
        description="Informasi lengkap biodata siswa."
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {studentProfile.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-red-50 p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{item.label}</p>
              <p className="mt-1.5 text-sm font-semibold text-slate-900">{item.value || "-"}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
