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

type PerkembanganPageProps = {
  selectedStudent: RowRecord | null;
  perkembanganRows: RowRecord[];
  pengajarRows: RowRecord[];
};

const PAGE_SIZE = 10;

export function PerkembanganPage({ selectedStudent, perkembanganRows, pengajarRows }: PerkembanganPageProps) {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const [mapelFilter, setMapelFilter] = useState("");

  const mapelOptions = useMemo(() => uniqueValues(pengajarRows, "Mata Pelajaran"), [pengajarRows]);

  const filteredRows = useMemo(
    () =>
      sortRowsByDateDesc(
        perkembanganRows.filter(
          (row) =>
            matchesDateFilter(getRowValue(row, "Tanggal"), dateFilter) &&
            matchesTextFilter(getRowValue(row, "Mata Pelajaran"), mapelFilter)
        )
      ),
    [perkembanganRows, dateFilter, mapelFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [perkembanganRows.length, dateFilter, mapelFilter]);

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

  return (
    <section className="grid gap-6">
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
              <SearchableSelect
                label="Filter Mapel"
                value={mapelFilter}
                onChange={setMapelFilter}
                options={mapelOptions}
                placeholder="Cari mata pelajaran"
                labelClassName="text-[10px] uppercase tracking-[0.3em] text-slate-500"
                inputClassName="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              />
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
