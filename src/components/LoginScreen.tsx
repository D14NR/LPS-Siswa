import { EmptyState } from "./EmptyState";

type LoginScreenProps = {
  loading: boolean;
  error: string | null;
  loginNis: string;
  studentNisOptions: string[];
  loginError: string;
  onLoginNisChange: (value: string) => void;
  onSubmit: () => void;
};

export function LoginScreen({
  loading,
  error,
  loginNis,
  studentNisOptions,
  loginError,
  onLoginNisChange,
  onSubmit,
}: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <header className="rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-slate-900 p-10 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-red-200">Portal Siswa</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Masuk Dashboard Siswa</h1>
          <p className="mt-3 text-sm text-red-100/90 sm:text-base">
            Masukkan NIS untuk mengakses informasi akademik lengkap.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {loading && <EmptyState message="Memuat data siswa..." />}
          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
              {error}
            </div>
          )}
          {!loading && !error && (
            <div className="grid gap-6">
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Masukkan NIS</label>
                <input
                  value={loginNis}
                  onChange={(event) => onLoginNisChange(event.target.value)}
                  placeholder="Contoh: 33-442-001-5"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Masukkan NIS seperti di spreadsheet Data Siswa (contoh: 33-442-001-5).
                </p>
              </div>

              {studentNisOptions.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                  Contoh NIS tersedia: {studentNisOptions.slice(0, 5).join(", ")}
                  {studentNisOptions.length > 5 ? " ..." : ""}
                </div>
              )}

              {loginError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {loginError}
                </div>
              )}

              <button
                onClick={onSubmit}
                className="w-full rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Masuk Dashboard
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
