import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { SearchableSelect } from "@/components/SearchableSelect";
import type { RowRecord } from "@/utils/dataHelpers";
import {
  formatDateValue,
  getRowValue,
  matchesDateFilter,
  matchesTextFilter,
  sortRowsByDateDesc,
  uniqueValues,
} from "@/utils/dataHelpers";
import { DonutChart, HorizontalBarChart, MultiLineChart } from "@/components/Charts";

type PerkembanganPageProps = {
  selectedStudent: RowRecord | null;
  perkembanganRows: RowRecord[];
  pengajarRows: RowRecord[];
};

const PAGE_SIZE = 10;

export function PerkembanganPage({ selectedStudent, perkembanganRows, pengajarRows }: PerkembanganPageProps) {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const penguasaanSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    perkembanganRows.forEach((row) => {
      const value = getRowValue(row, "Penguasaan") || "Lainnya";
      summary[value] = (summary[value] || 0) + 1;
    });
    const entries = Object.entries(summary).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((acc, [, count]) => acc + count, 0);
    return { entries, total, top: entries[0]?.[0] ?? "-" };
  }, [perkembanganRows]);

  const penjelasanSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    perkembanganRows.forEach((row) => {
      const value = getRowValue(row, "Penjelasan") || "Lainnya";
      summary[value] = (summary[value] || 0) + 1;
    });
    const entries = Object.entries(summary).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((acc, [, count]) => acc + count, 0);
    return { entries, total, top: entries[0]?.[0] ?? "-" };
  }, [perkembanganRows]);

  const kondisiSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    perkembanganRows.forEach((row) => {
      const value = getRowValue(row, "Kondisi") || "Lainnya";
      summary[value] = (summary[value] || 0) + 1;
    });
    const entries = Object.entries(summary).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((acc, [, count]) => acc + count, 0);
    return { entries, total, top: entries[0]?.[0] ?? "-" };
  }, [perkembanganRows]);

  const mapelOptions = useMemo(() => uniqueValues(pengajarRows, "Mata Pelajaran"), [pengajarRows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sortRowsByDateDesc(
      perkembanganRows.filter((row) => {
        const dateOk = matchesDateFilter(getRowValue(row, "Tanggal"), dateFilter);
        if (!q) return dateOk;
        const mapel = (getRowValue(row, "Mata Pelajaran") || "").toLowerCase();
        const materi = (getRowValue(row, "Materi") || "").toLowerCase();
        const penguasaan = (getRowValue(row, "Penguasaan") || "").toLowerCase();
        const kondisi = (getRowValue(row, "Kondisi") || "").toLowerCase();
        return dateOk && (mapel.includes(q) || materi.includes(q) || penguasaan.includes(q) || kondisi.includes(q));
      })
    );
  }, [perkembanganRows, dateFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [perkembanganRows.length, dateFilter, searchQuery]);

  const pageRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );

  if (!selectedStudent) {
    return <EmptyState message="Data siswa belum tersedia. Silakan masuk ulang." />;
  }

  if (perkembanganRows.length === 0) {
    return <EmptyState message="Belum ada data perkembangan untuk siswa ini." />;
  }

  const trendData = (() => {
    const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    const parsePercent = (v: string) => {
      if (!v && v !== 0) return NaN;
      const s = String(v).trim().replace(/%/g, "");
      if (!s) return NaN;
      let cleaned = s.replace(/[^0-9.,-]/g, "");
      if (cleaned.includes(",") && cleaned.includes(".")) {
        if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
          cleaned = cleaned.replace(/\./g, "").replace(",", ".");
        } else {
          cleaned = cleaned.replace(/,/g, "");
        }
      } else if (cleaned.includes(",")) {
        cleaned = cleaned.replace(/\./g, "").replace(/,/, ".");
      } else {
        cleaned = cleaned.replace(/,/g, "");
      }
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : NaN;
    };

    const findPercentInRow = (row: any, keywords: string[]) => {
      for (const k of Object.keys(row)) {
        const nk = normalize(k);
        if (keywords.every((kw) => nk.includes(kw))) {
          const v = parsePercent(row[k]);
          if (Number.isFinite(v)) return v;
        }
      }
      const main = keywords[keywords.length - 1];
      for (const k of Object.keys(row)) {
        const nk = normalize(k);
        if (nk.includes(main)) {
          const v = parsePercent(row[k]);
          if (Number.isFinite(v)) return v;
        }
      }
      return NaN;
    };

    const accByDate: any = {};
    perkembanganRows.forEach((row) => {
      const date = formatDateValue(getRowValue(row, "Tanggal")) || "-";
      accByDate[date] = accByDate[date] || { Penguasaan: { sum: 0, count: 0 }, Penjelasan: { sum: 0, count: 0 }, Kondisi: { sum: 0, count: 0 } };

      const pVal = findPercentInRow(row, ["prosen", "penguasaan"]);
      const penVal = findPercentInRow(row, ["prosen", "penjelasan"]);
      const kVal = findPercentInRow(row, ["prosen", "kondisi"]);

      if (Number.isFinite(pVal)) { accByDate[date].Penguasaan.sum += pVal; accByDate[date].Penguasaan.count += 1; }
      if (Number.isFinite(penVal)) { accByDate[date].Penjelasan.sum += penVal; accByDate[date].Penjelasan.count += 1; }
      if (Number.isFinite(kVal)) { accByDate[date].Kondisi.sum += kVal; accByDate[date].Kondisi.count += 1; }
    });

    const rows = Object.entries(accByDate)
      .map(([name, v]) => ({
        name,
        Penguasaan: v.Penguasaan.count ? Math.round(v.Penguasaan.sum / v.Penguasaan.count) : 0,
        Penjelasan: v.Penjelasan.count ? Math.round(v.Penjelasan.sum / v.Penjelasan.count) : 0,
        Kondisi: v.Kondisi.count ? Math.round(v.Kondisi.sum / v.Kondisi.count) : 0,
      }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
      .slice(-12);
    return rows;
  })();

  return (
    <section className="grid gap-6">
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Tren Catatan Perkembangan</h3>
        <div className="mt-4">
          <MultiLineChart
            title="Tren Persentase Penguasaan / Penjelasan / Kondisi"
            series={[
              { key: "Penguasaan", color: "#ef4444", label: "Penguasaan" },
              { key: "Penjelasan", color: "#f59e0b", label: "Penjelasan" },
              { key: "Kondisi", color: "#10b981", label: "Kondisi" },
            ]}
            data={trendData}
          />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <HorizontalBarChart
            title="Grafik Penguasaan Materi"
            data={penguasaanSummary.entries.slice(0, 6).map(([name, value]) => ({ name, value }))}
          />
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <HorizontalBarChart
            title="Grafik Penjelasan Materi"
            data={penjelasanSummary.entries.slice(0, 6).map(([name, value]) => ({ name, value }))}
            colors={["#f59e0b", "#ef4444", "#3b82f6", "#10b981"]}
          />
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <HorizontalBarChart
            title="Grafik Kondisi Belajar"
            data={kondisiSummary.entries.slice(0, 6).map(([name, value]) => ({ name, value }))}
            colors={["#10b981", "#34d399", "#60a5fa", "#f97316"]}
          />
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Analisa & Keterangan</h3>
        <p className="mt-4 text-sm text-slate-600">
          Total catatan perkembangan: <span className="font-semibold text-slate-900">{penguasaanSummary.total}</span>.
          Penguasaan materi dominan: <span className="font-semibold text-red-600">{penguasaanSummary.top}</span>.
          Penjelasan materi terbanyak: <span className="font-semibold text-amber-600">{penjelasanSummary.top}</span>.
          Kondisi belajar paling sering: <span className="font-semibold text-emerald-600">{kondisiSummary.top}</span>.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Catatan ini membantu memantau fokus, keaktifan, dan kualitas pemahaman siswa selama belajar.
        </p>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-lg shadow-red-100">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Riwayat Perkembangan</h2>
              <p className="mt-1 text-sm text-slate-500">Menampilkan 10 data terbaru per halaman.</p>
            </div>
              <div className="flex flex-wrap gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Filter Tanggal</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Cari Data</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari mapel, materi, penguasaan, atau kondisi"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                {["Tanggal", "Mata Pelajaran", "Materi", "Penguasaan", "Kondisi"].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs uppercase tracking-[0.3em]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, index) => (
                <tr key={`${getRowValue(row, "Timestamp")}-${index}`} className="border-t border-slate-200">
                  <td className="px-6 py-3 text-slate-900">{formatDateValue(getRowValue(row, "Tanggal"))}</td>
                  <td className="px-6 py-3 text-slate-900">{getRowValue(row, "Mata Pelajaran") || "-"}</td>
                  <td className="px-6 py-3 text-slate-900">{getRowValue(row, "Materi") || "-"}</td>
                  <td className="px-6 py-3 text-slate-700">{getRowValue(row, "Penguasaan") || "-"}</td>
                  <td className="px-6 py-3 text-slate-500">{getRowValue(row, "Kondisi") || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </div>
    </section>
  );
}
