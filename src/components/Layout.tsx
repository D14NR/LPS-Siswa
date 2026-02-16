import { useState } from "react";
import type { ReactNode } from "react";

type LayoutProps = {
  activeMenu: string;
  menus: string[];
  onMenuChange: (menu: string) => void;
  onReload: () => void;
  onLogout: () => void;
  children: ReactNode;
};

const menuIcons: Record<string, string> = {
  "Dashboard Siswa": "🏠",
  "Jadwal Reguler": "📅",
  Presensi: "✅",
  "Perkembangan Siswa": "📈",
  "Nilai Siswa": "📝",
  "Pelayanan/Jam Tambahan": "🕒",
};

export function Layout({ activeMenu, menus, onMenuChange, onReload, onLogout, children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const renderMenuItems = (collapsed: boolean) => (
    <div className="flex flex-col gap-2">
      {menus.map((menu) => (
        <button
          key={menu}
          onClick={() => {
            onMenuChange(menu);
            setIsMenuOpen(false);
          }}
          title={menu}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
            activeMenu === menu ? "bg-red-50 text-red-600" : "text-slate-600 hover:bg-slate-100"
          } ${collapsed ? "justify-center" : ""}`}
        >
          <span className="text-base">{menuIcons[menu] ?? "•"}</span>
          {!collapsed && <span>{menu}</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-slate-900 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-red-200">Portal Siswa</p>
              <h1 className="text-3xl font-semibold sm:text-4xl">Dashboard & Layanan Akademik</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="rounded-2xl border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/10 lg:hidden"
              >
                Menu
              </button>
              <button
                onClick={onReload}
                className="rounded-2xl border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/10"
              >
                Refresh Data
              </button>
              <button
                onClick={onLogout}
                className="rounded-2xl border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/10"
              >
                Keluar
              </button>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-red-100/90 sm:text-base">
            Pantau biodata, jadwal, presensi, perkembangan, nilai, dan layanan tambahan siswa berdasarkan
            data spreadsheet terintegrasi.
          </p>
        </header>

        <section className={`grid gap-6 ${isCollapsed ? "lg:grid-cols-[88px_1fr]" : "lg:grid-cols-[260px_1fr]"}`}>
          <aside className="hidden flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex">
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
              {!isCollapsed && <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Menu</p>}
              <button
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:bg-slate-100"
                title={isCollapsed ? "Perbesar menu" : "Perkecil menu"}
              >
                {isCollapsed ? "»" : "«"}
              </button>
            </div>
            {renderMenuItems(isCollapsed)}
          </aside>

          <div className="flex flex-col gap-6">{children}</div>
        </section>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setIsMenuOpen(false)}>
          <aside
            className="absolute left-0 top-0 flex h-full w-72 flex-col gap-4 overflow-y-auto rounded-r-3xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Menu</p>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
            {renderMenuItems(false)}
          </aside>
        </div>
      )}
    </div>
  );
}
