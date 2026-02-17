import { EmptyState } from "@/components/EmptyState";

export function BankSoalPage() {
  return (
    <section className="grid gap-6">
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
        <h2 className="text-lg font-semibold text-slate-900">Bank Soal</h2>
        <p className="mt-2 text-sm text-slate-500">
          Modul bank soal akan segera tersedia. Siswa dapat mengakses kumpulan latihan soal dan pembahasan di halaman ini.
        </p>
      </div>
      <EmptyState message="Bank soal belum tersedia pada basis data." />
    </section>
  );
}
