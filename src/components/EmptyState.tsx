export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-lg shadow-red-100">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{message}</p>
    </div>
  );
}
