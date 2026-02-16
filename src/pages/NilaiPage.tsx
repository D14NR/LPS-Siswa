import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import type { RowRecord } from "@/utils/dataHelpers";
import { formatDateValue, getRowValue, matchesDateFilter, normalizeMatch } from "@/utils/dataHelpers";

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
  const displayHeaders = useMemo(
    () => headers.filter((header) => header && normalizeMatch(header) !== "timestamp"),
    [headers]
  );
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const filteredRows = useMemo(
    () => rows.filter((row) => matchesDateFilter(getRowValue(row, "Tanggal"), dateFilter)),
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
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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
                      ? "bg-red-600 text-white"
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

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
