type PaginationProps = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 shadow-sm transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sebelumnya
      </button>
      <span>
        Halaman {page} dari {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page >= totalPages}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 shadow-sm transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Berikutnya
      </button>
    </div>
  );
}
