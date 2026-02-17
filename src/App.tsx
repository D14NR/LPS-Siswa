import { useEffect, useMemo, useState } from "react";
import { DashboardPage } from "@/components/DashboardPage";
import { SchedulePage } from "@/components/SchedulePage";
import { PresensiPage } from "@/pages/PresensiPage";
import { PerkembanganPage } from "@/pages/PerkembanganPage";
import { NilaiPage } from "@/pages/NilaiPage";
import { PelayananPage } from "@/pages/PelayananPage";
import { PengajarPage } from "@/pages/PengajarPage";
import { BankSoalPage } from "@/pages/BankSoalPage";
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

const NILAI_ID = "1yb_UoQKe3tgbbTmnfYUFQiNQLe9NGdWsE-fzVLGthmw";
const NILAI_SHEETS = [
  { label: "Nilai UTBK", sheet: "Nilai UTBK" },
  { label: "Nilai TKA SMA", sheet: "Nilai TKA SMA" },
  { label: "Nilai TKA SMP", sheet: "Nilai TKA SMP" },
  { label: "Nilai TKA SD", sheet: "Nilai TKA SD" },
  { label: "Nilai Tes STANDAR", sheet: "Nilai TES STANDAR" },
  { label: "Nilai EVALUASI", sheet: "Nilai EVALUASI" },
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

const TableView = ({
  headers,
  data,
  stickyFirst = false,
}: {
  headers: string[];
  data: string[][];
  stickyFirst?: boolean;
}) => (
  <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
    <table className="min-w-full border-collapse text-left text-sm">
      <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
        <tr>
          {headers.map((header, index) => (
            <th
              key={header + index}
              className={`px-4 py-3 font-semibold ${
                stickyFirst && index === 0 ? "sticky left-0 bg-slate-50" : ""
              }`}
            >
              {header || "-"}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr
            key={`row-${rowIndex}`}
            className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
          >
            {headers.map((_, cellIndex) => (
              <td
                key={`cell-${rowIndex}-${cellIndex}`}
                className={`px-4 py-3 text-slate-700 ${
                  stickyFirst && cellIndex === 0 ? "sticky left-0 bg-inherit" : ""
                }`}
              >
                {row[cellIndex] || "-"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const nilaiRequests = NILAI_SHEETS.map((item) =>
          fetchSheetText(NILAI_ID, item.sheet)
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
    if (!studentRow) return { reguler: null, tambahan: null };
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

    const regulerRow = kelasList.length
      ? selectRowWithSchedule(jadwalReguler, (row, _cabangIdx, kelasIdx) =>
          kelasIdx >= 0 ? kelasList.includes(row[kelasIdx]) : false
        )
      : null;

    const tambahanRow = asalSekolah
      ? selectRowWithSchedule(jadwalTambahan, (row, cabangIdx, kelasIdx) => {
          const cabangValue = cabangIdx >= 0 ? row[cabangIdx] : "";
          const kelasValue = kelasIdx >= 0 ? row[kelasIdx] : "";
          return cabangValue === asalSekolah || kelasValue === asalSekolah;
        })
      : null;

    return {
      reguler: regulerRow,
      tambahan: tambahanRow,
    };
  }, [studentRow, biodata.headers, jadwalReguler, jadwalTambahan]);

  const regulerScheduleRecord = useMemo<RowRecord | null>(() => {
    if (!studentSchedule.reguler) return null;
    return rowToRecord(jadwalReguler.headers, studentSchedule.reguler);
  }, [jadwalReguler.headers, studentSchedule.reguler]);

  const scheduleColumns = useMemo<ScheduleColumn[]>(() => {
    if (!jadwalReguler.headers.length) return [];
    return jadwalReguler.headers
      .filter((header) => header !== "Cabang" && header !== "Kelompok Kelas")
      .map((header) => ({ dateLabel: header, mapel: header }));
  }, [jadwalReguler.headers]);

  const scheduleValues = useMemo(() => {
    if (!studentSchedule.reguler && !studentSchedule.tambahan) {
      return { reguler: "-", tambahan: "-", summary: "-" };
    }
    const todayKey = formatDateHeader(new Date());
    const regulerIndex = getHeaderIndex(jadwalReguler.headers, todayKey);
    const tambahanIndex = getHeaderIndex(jadwalTambahan.headers, todayKey);

    const regulerValue =
      regulerIndex >= 0 && studentSchedule.reguler
        ? studentSchedule.reguler[regulerIndex] || "-"
        : "-";
    const tambahanValue =
      tambahanIndex >= 0 && studentSchedule.tambahan
        ? studentSchedule.tambahan[tambahanIndex] || "-"
        : "-";

    return {
      reguler: regulerValue,
      tambahan: tambahanValue,
      summary:
        regulerValue !== "-"
          ? regulerValue
          : tambahanValue !== "-"
          ? tambahanValue
          : "-",
    };
  }, [studentSchedule, jadwalReguler.headers, jadwalTambahan.headers]);

  const todaySchedule = useMemo<DashboardCards["todaySchedule"]>(() => {
    if (scheduleValues.summary === "-") return null;
    const isReguler = scheduleValues.reguler !== "-";
    const parsed = parseScheduleValue(scheduleValues.summary);
    if (!parsed) return null;
    return {
      label: isReguler ? "Jadwal Reguler" : "Jadwal Tambahan",
      subject: parsed.subject,
      time: parsed.time,
    };
  }, [scheduleValues]);

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
            biodata={studentProfile}
            todaySchedule={todaySchedule}
            latestPresensi={latestPresensi}
            latestPerkembangan={latestPerkembangan}
            latestNilai={latestNilai}
            latestPelayanan={latestPelayanan}
            latestPermintaan={latestPermintaan}
          />
        );
      case "Jadwal Reguler":
        return jadwalReguler.headers.length > 0 && regulerScheduleRecord ? (
          <SchedulePage
            selectedSchedule={regulerScheduleRecord}
            scheduleColumns={scheduleColumns}
            scheduleClassKey="Kelompok Kelas"
          />
        ) : (
          <PlaceholderSection
            title="Jadwal Reguler"
            description="Data jadwal reguler belum tersedia."
          />
        );
      case "Jadwal Tambahan":
        return jadwalTambahan.headers.length > 0 && studentSchedule.tambahan ? (
          <TableView
            headers={jadwalTambahan.headers}
            data={[studentSchedule.tambahan]}
            stickyFirst
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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-red-50 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
          <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-2xl shadow-red-100">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-xl text-white shadow-lg shadow-red-200">
                LS
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  LPS Semarang-Kendal
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                  Portal Rapor Siswa
                </h1>
              </div>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-slate-900">
              Masuk dengan NIS
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Masukkan NIS siswa untuk mengakses dashboard rapor dan histori belajar.
            </p>
            <div className="mt-6 space-y-4">
              <input
                value={nisInput}
                onChange={(event) => setNisInput(event.target.value)}
                placeholder="Contoh: 12345"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <button
                onClick={() => {
                  const trimmed = nisInput.trim();
                  if (!trimmed) return;
                  setActiveNis(trimmed);
                  setIsSidebarOpen(false);
                }}
                className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
              >
                Masuk Dashboard
              </button>
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              Pastikan NIS sudah terdaftar pada basis data biodata siswa.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-100 via-white to-red-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-base font-semibold text-white shadow-lg shadow-red-200">
              LS
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                LPS Semarang-Kendal
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Rapor Siswa Digital
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 shadow-sm transition hover:border-red-200 hover:text-red-600 lg:hidden"
            >
              {isSidebarOpen ? "Tutup Menu" : "Buka Menu"}
            </button>
            <button
              onClick={() => setRefreshToken((prev) => prev + 1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 shadow-sm transition hover:border-red-200 hover:text-red-600"
            >
              Muat Ulang
            </button>
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                LS
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  Siswa Aktif
                </p>
                <p className="font-semibold text-slate-700">{selectedStudent?.Nama || activeNis}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveNis(null);
                setNisInput("");
                setActiveMenu(MENU_ITEMS[0]);
                setIsSidebarOpen(false);
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 shadow-sm transition hover:border-red-200 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div
          className={`mx-auto grid h-full max-w-7xl gap-6 px-6 py-8 ${
            isSidebarCollapsed ? "lg:grid-cols-[92px_1fr]" : "lg:grid-cols-[260px_1fr]"
          }`}
        >
          <aside
            className={`space-y-4 transition-all ${
              isSidebarOpen ? "block" : "hidden"
            } lg:block ${isSidebarCollapsed ? "lg:w-[92px]" : "lg:w-auto"} lg:h-full lg:overflow-y-auto`}
          >
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 ${
                    isSidebarCollapsed ? "sr-only" : ""}
                  `}
                >
                  Menu Rapor
                </p>
                <button
                  onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                  className={`hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 shadow-sm transition hover:border-red-200 hover:text-red-600 lg:inline-flex ${
                    isSidebarCollapsed ? "w-full" : ""
                  }`}
                >
                  {isSidebarCollapsed ? "Buka Menu" : "Perkecil"}
                </button>
              </div>
              <nav className="mt-4 space-y-2">
                {MENU_ITEMS.map((item) => {
                  const icon = item === "Dashboard Siswa" ? "🏠" : item === "Jadwal Reguler" ? "📅" : item === "Jadwal Tambahan" ? "🗓️" : item === "Riwayat Presensi" ? "📝" : item === "Riwayat Perkembangan Belajar" ? "📈" : item === "Riwayat Nilai Tes" ? "🏆" : item === "Bank Soal" ? "📚" : item === "Riwayat Pelayanan/Tambahan" ? "🎯" : "📞";
                  return (
                    <button
                      key={item}
                      onClick={() => {
                        setActiveMenu(item);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                        activeMenu === item
                          ? "bg-red-600 text-white shadow-lg shadow-red-200"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">{icon}</span>
                        <span className={isSidebarCollapsed ? "sr-only" : ""}>{item}</span>
                      </span>
                      <span className={`text-xs opacity-70 ${isSidebarCollapsed ? "sr-only" : ""}`}>›</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div
              className={`rounded-3xl border border-slate-200 bg-white/90 p-5 text-sm text-slate-600 shadow-sm ${
                isSidebarCollapsed ? "hidden lg:block" : ""
              }`}
            >
              <p className="font-semibold text-slate-700">Sumber Data</p>
              <p className="mt-2 text-xs text-slate-500">
                Sistem menarik data langsung dari basis data terpusat yang diperbarui
                secara berkala untuk kebutuhan rapor.
              </p>
            </div>
          </aside>

          <main className="flex h-full flex-col overflow-hidden">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {activeMenu}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                {activeMenu}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Pantau informasi siswa dan histori belajar secara terstruktur.
              </p>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto pr-1">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
