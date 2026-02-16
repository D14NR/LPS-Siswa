import { useCallback, useEffect, useRef, useState } from "react";
import { buildHeadersAndRows, normalizeMatch } from "@/utils/dataHelpers";
import type { SheetTable } from "@/utils/dataHelpers";

const SCHEDULE_SHEET = {
  id: "1DSon0f5M1PeMAE_xeHVWLDlmVTDQM_Vr1RuCdcCYQB0",
  sheet: "Jadwal_Siswa",
};

const STUDENT_SHEET = {
  id: "1qN1MJ7kVRbSnsV9-WblGikHmCTzLZOTezmuUBgrZ3-k",
  sheet: "Siswa",
};

const PRESENSI_SHEET = {
  id: "13oDDldQdcVBg5ai3nS9oGtYuq8ijWsloNRmXK87IHnw",
  sheet: "Presensi",
};

const PERKEMBANGAN_SHEET = {
  id: "1fZmtYB5nPslds7pjQ6sIDHfVYTf_wg1KeTXbmKeUBMw",
  sheet: "Perkembangan",
};

const NILAI_SHEET_UTBK = {
  id: "1yb_UoQKe3tgbbTmnfYUFQiNQLe9NGdWsE-fzVLGthmw",
  sheet: "Nilai UTBK",
};

const NILAI_SHEET_TKA_SMA = {
  id: "1yb_UoQKe3tgbbTmnfYUFQiNQLe9NGdWsE-fzVLGthmw",
  sheet: "Nilai TKA SMA",
};

const NILAI_SHEET_TKA_SMP = {
  id: "1yb_UoQKe3tgbbTmnfYUFQiNQLe9NGdWsE-fzVLGthmw",
  sheet: "Nilai TKA SMP",
};

const NILAI_SHEET_TKA_SD = {
  id: "1yb_UoQKe3tgbbTmnfYUFQiNQLe9NGdWsE-fzVLGthmw",
  sheet: "Nilai TKA SD",
};

const NILAI_SHEET_STANDAR = {
  id: "1yb_UoQKe3tgbbTmnfYUFQiNQLe9NGdWsE-fzVLGthmw",
  sheet: "Nilai Tes Standar",
};

const NILAI_SHEET_EVALUASI = {
  id: "1yb_UoQKe3tgbbTmnfYUFQiNQLe9NGdWsE-fzVLGthmw",
  sheet: "Nilai Evaluasi",
};

const PELAYANAN_SHEET = {
  id: "1KcsMCeFmGAmwKHFqnIxiUxDmLDpR6YDBZBd8Zbd-s6w",
  sheet: "Pelayanan",
};

const PENGAJAR_SHEET = {
  id: "1PQNdVQUJa-YQaWv-KZdIC7WE3VVlRAxpX5XT79NMJos",
  sheet: "Pengajar",
};

const fetchSheetData = async (sheetId: string, sheetName: string) => {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    sheetName
  )}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Gagal memuat data spreadsheet.");
  }
  const text = await response.text();
  const jsonText = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const data = JSON.parse(jsonText);
  return data.table as SheetTable;
};

export type SheetsData = {
  scheduleHeaders: string[];
  scheduleRows: Record<string, string>[];
  studentRows: Record<string, string>[];
  presensiRows: Record<string, string>[];
  perkembanganRows: Record<string, string>[];
  nilaiRows: Record<string, string>[];
  nilaiHeaders: string[];
  nilaiUtbkRows: Record<string, string>[];
  nilaiUtbkHeaders: string[];
  nilaiTkaSmaRows: Record<string, string>[];
  nilaiTkaSmaHeaders: string[];
  nilaiTkaSmpRows: Record<string, string>[];
  nilaiTkaSmpHeaders: string[];
  nilaiTkaSdRows: Record<string, string>[];
  nilaiTkaSdHeaders: string[];
  nilaiStandarRows: Record<string, string>[];
  nilaiStandarHeaders: string[];
  nilaiEvaluasiRows: Record<string, string>[];
  nilaiEvaluasiHeaders: string[];
  pelayananRows: Record<string, string>[];
  pengajarRows: Record<string, string>[];
};

export function useSheetsData() {
  const emptyData: SheetsData = {
    scheduleHeaders: [],
    scheduleRows: [],
    studentRows: [],
    presensiRows: [],
    perkembanganRows: [],
    nilaiRows: [],
    nilaiHeaders: [],
    nilaiUtbkRows: [],
    nilaiUtbkHeaders: [],
    nilaiTkaSmaRows: [],
    nilaiTkaSmaHeaders: [],
    nilaiTkaSmpRows: [],
    nilaiTkaSmpHeaders: [],
    nilaiTkaSdRows: [],
    nilaiTkaSdHeaders: [],
    nilaiStandarRows: [],
    nilaiStandarHeaders: [],
    nilaiEvaluasiRows: [],
    nilaiEvaluasiHeaders: [],
    pelayananRows: [],
    pengajarRows: [],
  };

  const [data, setData] = useState<SheetsData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const cacheKey = "portalSheetsCache";

  const buildCachePayload = (payload: SheetsData, maxRows = 200) => ({
    ...payload,
    presensiRows: payload.presensiRows.slice(0, maxRows),
    perkembanganRows: payload.perkembanganRows.slice(0, maxRows),
    nilaiRows: payload.nilaiRows.slice(0, maxRows),
    nilaiUtbkRows: payload.nilaiUtbkRows.slice(0, maxRows),
    nilaiTkaSmaRows: payload.nilaiTkaSmaRows.slice(0, maxRows),
    nilaiTkaSmpRows: payload.nilaiTkaSmpRows.slice(0, maxRows),
    nilaiTkaSdRows: payload.nilaiTkaSdRows.slice(0, maxRows),
    nilaiStandarRows: payload.nilaiStandarRows.slice(0, maxRows),
    nilaiEvaluasiRows: payload.nilaiEvaluasiRows.slice(0, maxRows),
    pelayananRows: payload.pelayananRows.slice(0, maxRows),
    pengajarRows: payload.pengajarRows.slice(0, maxRows),
  });

  const saveCache = (key: string, payload: SheetsData) => {
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      try {
        localStorage.setItem(key, JSON.stringify(buildCachePayload(payload)));
      } catch {
        try {
          const minimalPayload: SheetsData = {
            ...emptyData,
            scheduleHeaders: payload.scheduleHeaders,
            scheduleRows: payload.scheduleRows,
            studentRows: payload.studentRows,
            nilaiHeaders: payload.nilaiHeaders,
            nilaiUtbkHeaders: payload.nilaiUtbkHeaders,
            nilaiTkaSmaHeaders: payload.nilaiTkaSmaHeaders,
            nilaiTkaSmpHeaders: payload.nilaiTkaSmpHeaders,
            nilaiTkaSdHeaders: payload.nilaiTkaSdHeaders,
            nilaiStandarHeaders: payload.nilaiStandarHeaders,
            nilaiEvaluasiHeaders: payload.nilaiEvaluasiHeaders,
          };
          localStorage.setItem(key, JSON.stringify(minimalPayload));
        } catch {
          // Ignore cache write failures
        }
      }
    }
  };

  const loadSheets = useCallback(
    () =>
      Promise.all([
        fetchSheetData(SCHEDULE_SHEET.id, SCHEDULE_SHEET.sheet),
        fetchSheetData(STUDENT_SHEET.id, STUDENT_SHEET.sheet),
        fetchSheetData(PRESENSI_SHEET.id, PRESENSI_SHEET.sheet),
        fetchSheetData(PERKEMBANGAN_SHEET.id, PERKEMBANGAN_SHEET.sheet),
        fetchSheetData(NILAI_SHEET_UTBK.id, NILAI_SHEET_UTBK.sheet),
        fetchSheetData(NILAI_SHEET_TKA_SMA.id, NILAI_SHEET_TKA_SMA.sheet),
        fetchSheetData(NILAI_SHEET_TKA_SMP.id, NILAI_SHEET_TKA_SMP.sheet),
        fetchSheetData(NILAI_SHEET_TKA_SD.id, NILAI_SHEET_TKA_SD.sheet),
        fetchSheetData(NILAI_SHEET_STANDAR.id, NILAI_SHEET_STANDAR.sheet),
        fetchSheetData(NILAI_SHEET_EVALUASI.id, NILAI_SHEET_EVALUASI.sheet),
        fetchSheetData(PELAYANAN_SHEET.id, PELAYANAN_SHEET.sheet),
        fetchSheetData(PENGAJAR_SHEET.id, PENGAJAR_SHEET.sheet),
      ]),
    []
  );

  const refresh = useCallback(() => {
    setLoading(true);
    return loadSheets()
      .then(([
        scheduleTable,
        studentTable,
        presensiTable,
        perkembanganTable,
        nilaiUtbkTable,
        nilaiTkaSmaTable,
        nilaiTkaSmpTable,
        nilaiTkaSdTable,
        nilaiStandarTable,
        nilaiEvaluasiTable,
        pelayananTable,
        pengajarTable,
      ]) => {
        if (!isMountedRef.current) return;
        const schedule = buildHeadersAndRows(scheduleTable, "firstRow");
        const students = buildHeadersAndRows(studentTable, "colLabels");
        const presensi = buildHeadersAndRows(presensiTable, "colLabels");
        const perkembangan = buildHeadersAndRows(perkembanganTable, "colLabels");
        const nilaiUtbk = buildHeadersAndRows(nilaiUtbkTable, "colLabels");
        const nilaiTkaSma = buildHeadersAndRows(nilaiTkaSmaTable, "colLabels");
        const nilaiTkaSmp = buildHeadersAndRows(nilaiTkaSmpTable, "colLabels");
        const nilaiTkaSd = buildHeadersAndRows(nilaiTkaSdTable, "colLabels");
        const nilaiStandar = buildHeadersAndRows(nilaiStandarTable, "colLabels");
        const nilaiEvaluasi = buildHeadersAndRows(nilaiEvaluasiTable, "colLabels");
        const mergedNilai = [
          ...nilaiUtbk.rows,
          ...nilaiTkaSma.rows,
          ...nilaiTkaSmp.rows,
          ...nilaiTkaSd.rows,
          ...nilaiStandar.rows,
          ...nilaiEvaluasi.rows,
        ];
        const mergedNilaiHeaders = Array.from(
          new Set([
            ...nilaiUtbk.headers,
            ...nilaiTkaSma.headers,
            ...nilaiTkaSmp.headers,
            ...nilaiTkaSd.headers,
            ...nilaiStandar.headers,
            ...nilaiEvaluasi.headers,
          ])
        );
        const pelayanan = buildHeadersAndRows(pelayananTable, "colLabels");

        // Parse Pengajar sheet: try firstRow first, then colLabels, then raw fallback
        let pengajarParsed = buildHeadersAndRows(pengajarTable, "firstRow");
        // Check if we got useful headers
        const pengajarHeadersNorm = pengajarParsed.headers.map((h) => normalizeMatch(h));
        const hasPengajarHeader = pengajarHeadersNorm.some((h) => h === "pengajar");
        const hasMapelHeader = pengajarHeadersNorm.some(
          (h) => h === "mata pelajaran" || h.startsWith("mata pelajaran")
        );
        if (!hasPengajarHeader && !hasMapelHeader) {
          // Try colLabels mode
          pengajarParsed = buildHeadersAndRows(pengajarTable, "colLabels");
        }
        // If still no useful headers, manually build from raw table
        // assuming column A = Pengajar, column B = Mata Pelajaran
        const pengajarHdrNorm2 = pengajarParsed.headers.map((h) => normalizeMatch(h));
        const hasPH2 = pengajarHdrNorm2.some((h) => h === "pengajar");
        const hasMH2 = pengajarHdrNorm2.some(
          (h) => h === "mata pelajaran" || h.startsWith("mata pelajaran")
        );
        let finalPengajarRows: Record<string, string>[];
        if (!hasPH2 && !hasMH2 && pengajarTable.rows.length > 0) {
          // Raw fallback: skip first row (header), map col 0 = Pengajar, col 1 = Mata Pelajaran
          finalPengajarRows = pengajarTable.rows.slice(1).map((row) => ({
            Pengajar: String(row.c?.[0]?.v ?? "").trim(),
            "Mata Pelajaran": String(row.c?.[1]?.v ?? "").trim(),
          })).filter((r) => r.Pengajar || r["Mata Pelajaran"]);
        } else {
          // Normalize keys to canonical "Pengajar" and "Mata Pelajaran"
          finalPengajarRows = pengajarParsed.rows.map((row) => {
            const record: Record<string, string> = {};
            Object.entries(row).forEach(([key, value]) => {
              const nk = normalizeMatch(key);
              if (nk === "pengajar") {
                record["Pengajar"] = value;
              } else if (
                nk === "mata pelajaran" ||
                nk.startsWith("mata pelajaran") ||
                nk === "mata_pelajaran" ||
                nk === "mapel"
              ) {
                record["Mata Pelajaran"] = value;
              } else {
                record[key] = value;
              }
            });
            return record;
          });
        }
        const nextData = {
          scheduleHeaders: schedule.headers,
          scheduleRows: schedule.rows,
          studentRows: students.rows,
          presensiRows: presensi.rows,
          perkembanganRows: perkembangan.rows,
          nilaiRows: mergedNilai,
          nilaiHeaders: mergedNilaiHeaders,
          nilaiUtbkRows: nilaiUtbk.rows,
          nilaiUtbkHeaders: nilaiUtbk.headers,
          nilaiTkaSmaRows: nilaiTkaSma.rows,
          nilaiTkaSmaHeaders: nilaiTkaSma.headers,
          nilaiTkaSmpRows: nilaiTkaSmp.rows,
          nilaiTkaSmpHeaders: nilaiTkaSmp.headers,
          nilaiTkaSdRows: nilaiTkaSd.rows,
          nilaiTkaSdHeaders: nilaiTkaSd.headers,
          nilaiStandarRows: nilaiStandar.rows,
          nilaiStandarHeaders: nilaiStandar.headers,
          nilaiEvaluasiRows: nilaiEvaluasi.rows,
          nilaiEvaluasiHeaders: nilaiEvaluasi.headers,
          pelayananRows: pelayanan.rows,
          pengajarRows: finalPengajarRows,
        };

        setData(nextData);
        saveCache(cacheKey, nextData);
        setError(null);
      })
      .catch((err: Error) => {
        if (!isMountedRef.current) return;
        setError(err.message);
      })
      .finally(() => {
        if (!isMountedRef.current) return;
        setLoading(false);
      });
  }, [loadSheets]);

  useEffect(() => {
    isMountedRef.current = true;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as SheetsData;
        // If cached pengajarRows is empty, discard cache (likely stale)
        if (parsed.pengajarRows && parsed.pengajarRows.length > 0 && isMountedRef.current) {
          setData(parsed);
          setLoading(false);
        } else {
          localStorage.removeItem(cacheKey);
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    refresh();
    const interval = window.setInterval(refresh, 600_000);

    return () => {
      isMountedRef.current = false;
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { ...data, loading, error, refresh };
}
