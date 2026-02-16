import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { LoginScreen } from "@/components/LoginScreen";
import { DashboardShell } from "@/pages/DashboardShell";
import { useSheetsData } from "@/hooks/useSheetsData";
import type { ScheduleColumn } from "@/components/dataDashboard";
import {
  expandMapel,
  formatDateLabel,
  getDateFromLabel,
  getRowValue,
  isInGroupValues,
  isNisMatch,
  isSameValue,
  normalizeHeader,
  normalizeMatch,
  normalizeNisDigits,
  parseScheduleValue,
  sortByDateDesc,
} from "@/utils/dataHelpers";

const menus = [
  "Dashboard Siswa",
  "Jadwal Reguler",
  "Presensi",
  "Perkembangan Siswa",
  "Nilai Siswa",
  "Pelayanan/Jam Tambahan",
];

export function App() {
  const [activeMenu, setActiveMenu] = useState(menus[0]);
  const [selectedNis, setSelectedNis] = useState(() => localStorage.getItem("portalNis") ?? "");
  const [loginNis, setLoginNis] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem("portalNis")));
  const [loginError, setLoginError] = useState("");

  const {
    scheduleHeaders,
    scheduleRows,
    studentRows,
    presensiRows,
    perkembanganRows,
    nilaiRows,
    nilaiUtbkRows,
    nilaiUtbkHeaders,
    nilaiTkaSmaRows,
    nilaiTkaSmaHeaders,
    nilaiTkaSmpRows,
    nilaiTkaSmpHeaders,
    nilaiTkaSdRows,
    nilaiTkaSdHeaders,
    nilaiStandarRows,
    nilaiStandarHeaders,
    nilaiEvaluasiRows,
    nilaiEvaluasiHeaders,
    pelayananRows,
    pengajarRows,
    loading,
    error,
    refresh,
  } = useSheetsData();

  const scheduleClassKey = useMemo(() => {
    const normalizedHeaders = scheduleHeaders.map((header) => normalizeMatch(header));
    if (normalizedHeaders.includes("kelompok kelas")) {
      return "Kelompok Kelas";
    }
    return "Kelas";
  }, [scheduleHeaders]);

  const scheduleColumns = useMemo<ScheduleColumn[]>(() => {
    const normalizedHeaders = scheduleHeaders.map((header) => normalizeHeader(header)).filter(Boolean);
    const hasMapelJam = normalizedHeaders.some((header) =>
      ["mapel ", "jam "].some((prefix) => normalizeMatch(header).startsWith(prefix))
    );

    if (!hasMapelJam) {
      return normalizedHeaders
        .filter((header) => {
          const normalized = normalizeMatch(header);
          return normalized !== "cabang" && normalized !== "kelas" && normalized !== "kelompok kelas";
        })
        .map((header) => ({
          dateLabel: header,
          mapel: header,
          jam: "",
        }))
        .sort((a, b) => {
          const aDate = getDateFromLabel(a.dateLabel)?.getTime() ?? 0;
          const bDate = getDateFromLabel(b.dateLabel)?.getTime() ?? 0;
          return aDate - bDate;
        });
    }

    const columnMap = new Map<string, { mapel?: string; jam?: string }>();
    scheduleHeaders.forEach((header) => {
      const normalized = normalizeMatch(header);
      if (normalized.startsWith("mapel ")) {
        const dateLabel = header.replace(/mapel\s+/i, "").trim();
        columnMap.set(dateLabel, { ...(columnMap.get(dateLabel) ?? {}), mapel: header });
      }
      if (normalized.startsWith("jam ")) {
        const dateLabel = header.replace(/jam\s+/i, "").trim();
        columnMap.set(dateLabel, { ...(columnMap.get(dateLabel) ?? {}), jam: header });
      }
    });
    return Array.from(columnMap.entries())
      .map(([dateLabel, columns]) => ({
        dateLabel: normalizeHeader(dateLabel),
        mapel: columns.mapel ?? "",
        jam: columns.jam ?? "",
      }))
      .sort((a, b) => {
        const aDate = getDateFromLabel(a.dateLabel)?.getTime() ?? 0;
        const bDate = getDateFromLabel(b.dateLabel)?.getTime() ?? 0;
        return aDate - bDate;
      });
  }, [scheduleHeaders]);

  const findStudentByNis = (nisValue: string) => {
    if (!nisValue) return null;
    const targetDigits = normalizeNisDigits(nisValue);
    return (
      studentRows.find((row) => {
        const nis = getRowValue(row, "Nis");
        return isNisMatch(nis, nisValue) || (targetDigits && normalizeNisDigits(nis) === targetDigits);
      }) ?? null
    );
  };

  const studentNisOptions = useMemo(
    () => Array.from(new Set(studentRows.map((row) => getRowValue(row, "Nis")).filter(Boolean))),
    [studentRows]
  );

  const selectedStudent = useMemo(() => {
    return selectedNis ? findStudentByNis(selectedNis) : null;
  }, [studentRows, selectedNis]);

  const studentSchedule = useMemo(() => {
    if (!selectedStudent) return null;
    const studentCabang = getRowValue(selectedStudent, "Cabang");
    const studentGroup =
      getRowValue(selectedStudent, "Kelompok Kelas") ||
      getRowValue(selectedStudent, "Kelompok") ||
      getRowValue(selectedStudent, "Kelas");
    if (!studentCabang || !studentGroup) return null;
    return (
      scheduleRows.find((row) => {
        const cabangValue = getRowValue(row, "Cabang");
        const kelasValue = getRowValue(row, scheduleClassKey);
        return isSameValue(cabangValue, studentCabang) && isInGroupValues(kelasValue, studentGroup);
      }) ?? null
    );
  }, [scheduleRows, selectedStudent, scheduleClassKey]);

  const todaySchedule = useMemo(() => {
    if (!studentSchedule) return null;
    const today = new Date();
    const todayKey = scheduleColumns.find((column) => {
      const date = getDateFromLabel(column.dateLabel);
      return (
        date &&
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    });
    if (!todayKey) return null;
    const mapelValue = todayKey.mapel ? getRowValue(studentSchedule, todayKey.mapel) : "";
    const jamValue = todayKey.jam ? getRowValue(studentSchedule, todayKey.jam) : "";
    const combined = mapelValue || jamValue;
    if (!combined) return null;
    const parsed = todayKey.mapel && todayKey.jam
      ? { subject: expandMapel(mapelValue), time: jamValue }
      : parseScheduleValue(combined);
    return {
      label: formatDateLabel(todayKey.dateLabel),
      dateValue: getDateFromLabel(todayKey.dateLabel)?.toISOString().slice(0, 10) ?? "",
      ...parsed,
    };
  }, [studentSchedule, scheduleColumns]);

  const presensiByStudent = useMemo(() => {
    if (!selectedNis) return [];
    return sortByDateDesc(presensiRows.filter((row) => isNisMatch(getRowValue(row, "Nis"), selectedNis)));
  }, [presensiRows, selectedNis]);

  const perkembanganByStudent = useMemo(() => {
    if (!selectedNis) return [];
    return sortByDateDesc(
      perkembanganRows.filter((row) => isNisMatch(getRowValue(row, "Nis"), selectedNis))
    );
  }, [perkembanganRows, selectedNis]);

  const nilaiByStudent = useMemo(() => {
    if (!selectedNis) return [];
    return sortByDateDesc(nilaiRows.filter((row) => isNisMatch(getRowValue(row, "Nis"), selectedNis)));
  }, [nilaiRows, selectedNis]);

  const nilaiUtbkByStudent = useMemo(() => {
    if (!selectedNis) return [];
    return sortByDateDesc(nilaiUtbkRows.filter((row) => isNisMatch(getRowValue(row, "Nis"), selectedNis)));
  }, [nilaiUtbkRows, selectedNis]);

  const nilaiTkaSmaByStudent = useMemo(() => {
    if (!selectedNis) return [];
    return sortByDateDesc(
      nilaiTkaSmaRows.filter((row) => isNisMatch(getRowValue(row, "Nis"), selectedNis))
    );
  }, [nilaiTkaSmaRows, selectedNis]);

  const nilaiTkaSmpByStudent = useMemo(() => {
    if (!selectedNis) return [];
    return sortByDateDesc(
      nilaiTkaSmpRows.filter((row) => isNisMatch(getRowValue(row, "Nis"), selectedNis))
    );
  }, [nilaiTkaSmpRows, selectedNis]);

  const nilaiTkaSdByStudent = useMemo(() => {
    if (!selectedNis) return [];
    return sortByDateDesc(
      nilaiTkaSdRows.filter((row) => isNisMatch(getRowValue(row, "Nis"), selectedNis))
    );
  }, [nilaiTkaSdRows, selectedNis]);

  const nilaiStandarByStudent = useMemo(() => {
    if (!selectedNis) return [];
    return sortByDateDesc(
      nilaiStandarRows.filter((row) => isNisMatch(getRowValue(row, "Nis"), selectedNis))
    );
  }, [nilaiStandarRows, selectedNis]);

  const nilaiEvaluasiByStudent = useMemo(() => {
    if (!selectedNis) return [];
    return sortByDateDesc(
      nilaiEvaluasiRows.filter((row) => isNisMatch(getRowValue(row, "Nis"), selectedNis))
    );
  }, [nilaiEvaluasiRows, selectedNis]);

  const pelayananByStudent = useMemo(() => {
    if (!selectedNis) return [];
    return sortByDateDesc(
      pelayananRows.filter((row) => isNisMatch(getRowValue(row, "Nis"), selectedNis))
    );
  }, [pelayananRows, selectedNis]);

  const latestPresensi = presensiByStudent[0] ?? null;
  const latestPerkembangan = perkembanganByStudent[0] ?? null;
  const latestNilai = nilaiByStudent[0] ?? null;
  const latestPelayanan = pelayananByStudent[0] ?? null;

  const biodata = useMemo(() => {
    if (!selectedStudent) return [];
    return [
      { label: "NIS", value: getRowValue(selectedStudent, "Nis") },
      { label: "Nama Siswa", value: getRowValue(selectedStudent, "Nama") },
      { label: "Asal Sekolah", value: getRowValue(selectedStudent, "Asal Sekolah") },
      { label: "Jenjang Studi", value: getRowValue(selectedStudent, "Jenjang Studi") },
      {
        label: "Kelompok Kelas",
        value: getRowValue(selectedStudent, "Kelompok Kelas") || getRowValue(selectedStudent, "Kelompok"),
      },
      { label: "Cabang", value: getRowValue(selectedStudent, "Cabang") },
    ];
  }, [selectedStudent]);

  const handleLogin = () => {
    if (!loginNis) {
      setLoginError("Masukkan NIS terlebih dahulu.");
      return;
    }
    const student = findStudentByNis(loginNis.trim());
    if (!student) {
      const known = studentRows
        .map((row) => getRowValue(row, "Nis"))
        .filter(Boolean)
        .slice(0, 5)
        .join(", ");
      setLoginError(
        `Data siswa tidak ditemukan. Pastikan NIS sama persis seperti di spreadsheet. Contoh: ${known || "-"}`
      );
      return;
    }
    const nisValue = getRowValue(student, "Nis");
    localStorage.setItem("portalNis", nisValue);
    setSelectedNis(nisValue);
    setLoginError("");
    setActiveMenu(menus[0]);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <LoginScreen
        loading={loading}
        error={error}
        loginNis={loginNis}
        studentNisOptions={studentNisOptions}
        loginError={loginError}
        onLoginNisChange={setLoginNis}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <Layout
      activeMenu={activeMenu}
      menus={menus}
      onMenuChange={setActiveMenu}
      onReload={refresh}
      onLogout={() => {
        localStorage.removeItem("portalNis");
        setSelectedNis("");
        setIsLoggedIn(false);
      }}
    >
      <DashboardShell
        loading={loading}
        error={error}
        activeMenu={activeMenu}
        selectedStudent={selectedStudent}
        selectedSchedule={studentSchedule}
        biodata={biodata}
        todaySchedule={todaySchedule}
        latestPresensi={latestPresensi}
        latestPerkembangan={latestPerkembangan}
        latestNilai={latestNilai}
        latestPelayanan={latestPelayanan}
        scheduleColumns={scheduleColumns}
        scheduleClassKey={scheduleClassKey}
        presensiByStudent={presensiByStudent}
        perkembanganByStudent={perkembanganByStudent}
        nilaiUtbkByStudent={nilaiUtbkByStudent}
        nilaiUtbkHeaders={nilaiUtbkHeaders}
        nilaiTkaSmaByStudent={nilaiTkaSmaByStudent}
        nilaiTkaSmaHeaders={nilaiTkaSmaHeaders}
        nilaiTkaSmpByStudent={nilaiTkaSmpByStudent}
        nilaiTkaSmpHeaders={nilaiTkaSmpHeaders}
        nilaiTkaSdByStudent={nilaiTkaSdByStudent}
        nilaiTkaSdHeaders={nilaiTkaSdHeaders}
        nilaiStandarByStudent={nilaiStandarByStudent}
        nilaiStandarHeaders={nilaiStandarHeaders}
        nilaiEvaluasiByStudent={nilaiEvaluasiByStudent}
        nilaiEvaluasiHeaders={nilaiEvaluasiHeaders}
        pelayananByStudent={pelayananByStudent}
        pengajarRows={pengajarRows}
      />
    </Layout>
  );
}
