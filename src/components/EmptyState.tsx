import type { ReactNode } from "react";

type EmptyStateProps = {
  message: ReactNode;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
      {message}
    </div>
  );
}
