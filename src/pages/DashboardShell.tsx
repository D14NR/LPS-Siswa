import type { RowRecord } from "@/utils/dataHelpers";
import type { DashboardCards, ScheduleColumn } from "@/components/dataDashboard";
import { EmptyState } from "@/components/EmptyState";
import { DashboardPage } from "@/pages/DashboardPage";
import { SchedulePage } from "@/pages/SchedulePage";
import { PresensiPage } from "@/pages/PresensiPage";
import { PerkembanganPage } from "@/pages/PerkembanganPage";
import { NilaiPage } from "@/pages/NilaiPage";
import { PelayananPage } from "@/pages/PelayananPage";

type DashboardShellProps = {
  loading: boolean;
  error: string | null;
  activeMenu: string;
  selectedStudent: RowRecord | null;
  selectedSchedule: RowRecord | null;
  biodata: DashboardCards["biodata"];
  todaySchedule: DashboardCards["todaySchedule"];
  latestPresensi: RowRecord | null;
  latestPerkembangan: RowRecord | null;
  latestNilai: RowRecord | null;
  latestPelayanan: RowRecord | null;
  scheduleColumns: ScheduleColumn[];
  scheduleClassKey: string;
  presensiByStudent: RowRecord[];
  perkembanganByStudent: RowRecord[];
  nilaiUtbkByStudent: RowRecord[];
  nilaiUtbkHeaders: string[];
  nilaiTkaSmaByStudent: RowRecord[];
  nilaiTkaSmaHeaders: string[];
  nilaiTkaSmpByStudent: RowRecord[];
  nilaiTkaSmpHeaders: string[];
  nilaiTkaSdByStudent: RowRecord[];
  nilaiTkaSdHeaders: string[];
  nilaiStandarByStudent: RowRecord[];
  nilaiStandarHeaders: string[];
  nilaiEvaluasiByStudent: RowRecord[];
  nilaiEvaluasiHeaders: string[];
  pelayananByStudent: RowRecord[];
  pengajarRows: RowRecord[];
};

export function DashboardShell({
  loading,
  error,
  activeMenu,
  selectedStudent,
  selectedSchedule,
  biodata,
  todaySchedule,
  latestPresensi,
  latestPerkembangan,
  latestNilai,
  latestPelayanan,
  scheduleColumns,
  scheduleClassKey,
  presensiByStudent,
  perkembanganByStudent,
  nilaiUtbkByStudent,
  nilaiUtbkHeaders,
  nilaiTkaSmaByStudent,
  nilaiTkaSmaHeaders,
  nilaiTkaSmpByStudent,
  nilaiTkaSmpHeaders,
  nilaiTkaSdByStudent,
  nilaiTkaSdHeaders,
  nilaiStandarByStudent,
  nilaiStandarHeaders,
  nilaiEvaluasiByStudent,
  nilaiEvaluasiHeaders,
  pelayananByStudent,
  pengajarRows,
}: DashboardShellProps) {
  if (loading) {
    return <EmptyState message="Memuat data siswa dari spreadsheet..." />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (activeMenu === "Dashboard Siswa") {
    return (
      <DashboardPage
        selectedStudent={selectedStudent}
        biodata={biodata}
        todaySchedule={todaySchedule}
        latestPresensi={latestPresensi}
        latestPerkembangan={latestPerkembangan}
        latestNilai={latestNilai}
        latestPelayanan={latestPelayanan}
      />
    );
  }

  if (activeMenu === "Jadwal Reguler") {
    return (
      <SchedulePage
        selectedSchedule={selectedSchedule}
        scheduleColumns={scheduleColumns}
        scheduleClassKey={scheduleClassKey}
      />
    );
  }

  if (activeMenu === "Presensi") {
    return (
      <PresensiPage
        selectedStudent={selectedStudent}
        presensiRows={presensiByStudent}
        todaySchedule={todaySchedule}
        pengajarRows={pengajarRows}
      />
    );
  }

  if (activeMenu === "Perkembangan Siswa") {
    return (
      <PerkembanganPage
        selectedStudent={selectedStudent}
        perkembanganRows={perkembanganByStudent}
        pengajarRows={pengajarRows}
      />
    );
  }

  if (activeMenu === "Nilai Siswa") {
    return (
      <NilaiPage
        selectedStudent={selectedStudent}
        datasets={[
          { key: "utbk", label: "Nilai UTBK", rows: nilaiUtbkByStudent, headers: nilaiUtbkHeaders },
          { key: "tka-sma", label: "Nilai TKA SMA", rows: nilaiTkaSmaByStudent, headers: nilaiTkaSmaHeaders },
          { key: "tka-smp", label: "Nilai TKA SMP", rows: nilaiTkaSmpByStudent, headers: nilaiTkaSmpHeaders },
          { key: "tka-sd", label: "Nilai TKA SD", rows: nilaiTkaSdByStudent, headers: nilaiTkaSdHeaders },
          {
            key: "tes-standar",
            label: "Nilai TES STANDAR",
            rows: nilaiStandarByStudent,
            headers: nilaiStandarHeaders,
          },
          {
            key: "evaluasi",
            label: "Nilai EVALUASI",
            rows: nilaiEvaluasiByStudent,
            headers: nilaiEvaluasiHeaders,
          },
        ]}
      />
    );
  }

  if (activeMenu === "Pelayanan/Jam Tambahan") {
    return (
      <PelayananPage
        selectedStudent={selectedStudent}
        pelayananRows={pelayananByStudent}
        pengajarRows={pengajarRows}
      />
    );
  }

  return <EmptyState message="Menu belum tersedia." />;
}
