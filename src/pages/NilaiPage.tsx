import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import type { RowRecord } from "@/utils/dataHelpers";
import {
  formatDateValue,
  getRowValue,
  matchesDateFilter,
  normalizeMatch,
  sortRowsByDateDesc,
} from "@/utils/dataHelpers";

type NilaiDataset = {
  key: string;
  label: string;
  rows: RowRecord[];
  headers: string[];
};

type NilaiPageProps = {
  selectedStudent: RowRecord | null;
  datasets: NilaiDataset[];
};

const PAGE_SIZE = 10;

export function NilaiPage({ selectedStudent, datasets }: NilaiPageProps) {
  const availableDatasets = useMemo(
    () => datasets.filter((dataset) => dataset.rows.length > 0),
    [datasets]
  );
  const [activeKey, setActiveKey] = useState(availableDatasets[0]?.key ?? "");
  const activeDataset =
    availableDatasets.find((dataset) => dataset.key === activeKey) ?? availableDatasets[0];
  const rows = activeDataset?.rows ?? [];
  const headers = activeDataset?.headers ?? [];
  const orderedRows = useMemo(() => sortRowsByDateDesc(rows), [rows]);

  const parseScore = (value: string) => {
    if (!value) return NaN;
    let cleaned = value.replace(/[^0-9.,-]/g, "");
    if (cleaned.includes(",") && cleaned.includes(".")) {
      if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      } else {
        cleaned = cleaned.replace(/,/g, "");
      }
    } else if (cleaned.includes(",")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
    const numberValue = Number(cleaned);
    return Number.isFinite(numberValue) ? numberValue : NaN;
  };

  const getScoreFromRow = (row: RowRecord) => {
    const rerataValue = parseScore(getRowValue(row, "Rerata"));
    if (Number.isFinite(rerataValue)) return rerataValue;
    return NaN;
  };

  const nilaiSummary = useMemo(() => {
    const numericValues: number[] = [];
    orderedRows.forEach((row) => {
      const score = getScoreFromRow(row);
      if (Number.isFinite(score)) {
        numericValues.push(score);
      }
    });
    const total = numericValues.length;
    const avg = total
      ? Math.round(numericValues.reduce((acc, value) => acc + value, 0) / total)
      : 0;
    const max = total ? Math.max(...numericValues) : 0;
    const min = total ? Math.min(...numericValues) : 0;
    const latest = numericValues[0] ?? 0;
    const previous = numericValues[1] ?? 0;
    const delta = latest && previous ? latest - previous : 0;
    return { total, avg, max, min, latest, previous, delta };
  }, [orderedRows]);
  const displayHeaders = useMemo(
    () => headers.filter((header) => header && normalizeMatch(header) !== "timestamp"),
    [headers]
  );
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const filteredRows = useMemo(
    () =>
      sortRowsByDateDesc(
        rows.filter((row) => matchesDateFilter(getRowValue(row, "Tanggal"), dateFilter))
      ),
    [rows, dateFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    if (availableDatasets.length > 0 && !activeKey) {
      setActiveKey(availableDatasets[0].key);
    }
  }, [availableDatasets, activeKey]);

  useEffect(() => {
    setPage(1);
  }, [rows.length, activeKey, dateFilter]);

  useEffect(() => {
    if (availableDatasets.length === 0) {
      setActiveKey("");
      return;
    }

    if (!availableDatasets.some((dataset) => dataset.key === activeKey)) {
      setActiveKey(availableDatasets[0].key);
    }
  }, [availableDatasets, activeKey]);

  const pageRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );

  if (!selectedStudent) {
    return <EmptyState message="Data siswa belum tersedia. Silakan masuk ulang." />;
  }

  if (availableDatasets.length === 0) {
    return <EmptyState message="Belum ada data nilai untuk siswa ini." />;
  }

  if (!activeDataset || filteredRows.length === 0) {
    return <EmptyState message="Belum ada data nilai untuk kategori ini." />;
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Ringkasan Nilai</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Rata-rata Total", value: nilaiSummary.avg, color: "bg-red-500" },
              { label: "Nilai Tertinggi", value: nilaiSummary.max, color: "bg-emerald-500" },
              { label: "Nilai Terendah", value: nilaiSummary.min, color: "bg-amber-500" },
              { label: "Jumlah Tes", value: nilaiSummary.total, color: "bg-slate-500" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full ${item.color}`} style={{ width: "70%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Perbandingan Tes Terakhir</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Tes Terakhir</span>
              <span className="font-semibold text-slate-900">{nilaiSummary.latest || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tes Sebelumnya</span>
              <span className="font-semibold text-slate-900">{nilaiSummary.previous || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Selisih</span>
              <span className={`font-semibold ${nilaiSummary.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {nilaiSummary.delta >= 0 ? "+" : ""}{nilaiSummary.delta || 0}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Perbandingan dihitung dari dua data nilai terbaru pada sub menu aktif.
          </p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-500">Analisa & Keterangan</h3>
          <p className="mt-4 text-sm text-slate-600">
            Rata-rata total nilai berada di <span className="font-semibold text-red-600">{nilaiSummary.avg}</span>.
            Nilai tertinggi tercatat {nilaiSummary.max} dan terendah {nilaiSummary.min}.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Pantau tren peningkatan dengan membandingkan tes terakhir terhadap tes sebelumnya.
          </p>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-red-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sub Menu Nilai</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableDatasets.map((dataset) => (
                <button
                  key={dataset.key}
                  onClick={() => setActiveKey(dataset.key)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeKey === dataset.key
                      ? "bg-red-600 text-white shadow-md shadow-red-200"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {dataset.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Filter Tanggal</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-lg shadow-red-100">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{activeDataset.label}</h2>
          <p className="mt-1 text-sm text-slate-500">Menampilkan 10 data terbaru per halaman.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                {displayHeaders.map((header) => (
                  <th key={header} className="px-4 py-3 text-left uppercase tracking-[0.3em]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, index) => (
                <tr key={`${getRowValue(row, "Timestamp")}-${index}`} className="border-t border-slate-200">
                  {displayHeaders.map((header) => {
                    const value = getRowValue(row, header);
                    if (normalizeMatch(header) === "tanggal") {
                      return (
                        <td key={header} className="px-4 py-3 text-slate-900">
                          {formatDateValue(value)}
                        </td>
                      );
                    }
                    return (
                      <td key={header} className="px-4 py-3 text-slate-900">
                        {value || "-"}
                      </td>
                    );
                  })}
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
