import { ReactNode } from "react";

type ModalProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

export function Modal({ title, description, isOpen, onClose, footer, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] bg-white shadow-2xl shadow-red-100">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-200"
          >
            Tutup
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="border-t border-slate-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
