import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { SearchableSelect } from "@/components/SearchableSelect";
import type { RowRecord } from "@/utils/dataHelpers";
import { getRowValue, matchesTextFilter, uniqueValues } from "@/utils/dataHelpers";
import { postAppScript } from "@/utils/appScript";

type PengajarPageProps = {
  pengajarRows: RowRecord[];
  selectedStudent: RowRecord | null;
};

const PAGE_SIZE = 12;

export function PengajarPage({ pengajarRows, selectedStudent }: PengajarPageProps) {
  const [page, setPage] = useState(1);
  const [mapelFilter, setMapelFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    tanggal: "",
    mataPelajaran: "",
    pengajar: "",
    keperluan: "",
  });
  const [submitState, setSubmitState] = useState({ loading: false, error: "", success: "" });
  const [flashMessage, setFlashMessage] = useState("");

  const mapelOptions = useMemo(
    () => uniqueValues(pengajarRows, "Mata Pelajaran"),
    [pengajarRows]
  );
  const pengajarOptions = useMemo(
    () => uniqueValues(pengajarRows, "Pengajar"),
    [pengajarRows]
  );

  const filteredRows = useMemo(
    () =>
      pengajarRows.filter((row) =>
        matchesTextFilter(getRowValue(row, "Mata Pelajaran"), mapelFilter)
      ),
    [pengajarRows, mapelFilter]
  );

  useEffect(() => {
    setPage(1);
  }, [mapelFilter, pengajarRows.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );

  const resetForm = () => {
    setFormState({ tanggal: "", mataPelajaran: "", pengajar: "", keperluan: "" });
    setSubmitState({ loading: false, error: "", success: "" });
  };

  const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  const getValueByKeys = (row: RowRecord | null, keys: string[]) => {
    if (!row) return "";
    const entries = Object.entries(row);
    for (const key of keys) {
      const target = normalizeKey(key);
      const match = entries.find(([header]) => normalizeKey(header) === target);
      if (match && match[1]) return match[1];
    }
    return "";
  };

  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    return digits;
  };

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const handleSubmit = async () => {
    if (!selectedStudent) {
      setSubmitState({ loading: false, error: "Data siswa belum tersedia.", success: "" });
      return;
    }
    if (!formState.tanggal || !formState.mataPelajaran || !formState.pengajar) {
      setSubmitState({
        loading: false,
        error: "Tanggal, mata pelajaran, dan pengajar wajib diisi.",
        success: "",
      });
      return;
    }

    const normalizedPengajar = normalizeText(formState.pengajar);
    const normalizedMapel = normalizeText(formState.mataPelajaran);

    const matchedRow =
      pengajarRows.find((row) => {
        const pengajarValue = getValueByKeys(row, ["Pengajar"]) || getRowValue(row, "Pengajar");
        const mapelValue =
          getValueByKeys(row, ["Mata Pelajaran", "Mapel"]) || getRowValue(row, "Mata Pelajaran");
        return (
          normalizeText(pengajarValue) === normalizedPengajar &&
          (normalizeText(mapelValue) === normalizedMapel || !mapelValue)
        );
      }) ||
      pengajarRows.find((row) => {
        const pengajarValue = getValueByKeys(row, ["Pengajar"]) || getRowValue(row, "Pengajar");
        return normalizeText(pengajarValue) === normalizedPengajar;
      });

    const rawPhone = getValueByKeys(matchedRow ?? null, [
      "No.Whatsapp",
      "No. Whatsapp",
      "No.whatsapp",
      "No Whatsapp",
      "Nowhatsapp",
      "Whatsapp",
      "WA",
      "No WA",
    ]);
    const normalizedPhone = normalizePhone(rawPhone);
    const message = `Halo ${formState.pengajar}, saya ${getRowValue(
      selectedStudent,
      "Nama"
    )} (NIS ${getRowValue(selectedStudent, "Nis")}). Saya ingin permintaan pelayanan untuk ${
      formState.mataPelajaran
    } pada tanggal ${formState.tanggal}. Keperluan: ${
      formState.keperluan || "-"
    }.`;
    const waUrl = normalizedPhone
      ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
      : "";

    try {
      setSubmitState({ loading: true, error: "", success: "" });
      await postAppScript("permintaan", {
        nis: getRowValue(selectedStudent, "Nis"),
        nama: getRowValue(selectedStudent, "Nama"),
        cabang: getRowValue(selectedStudent, "Cabang"),
        tanggal: formState.tanggal,
        mataPelajaran: formState.mataPelajaran,
        pengajar: formState.pengajar,
        keperluan: formState.keperluan,
        status: "Menunggu",
      });

      if (!waUrl) {
        setFlashMessage(
          "Permintaan tersimpan, namun nomor WhatsApp pengajar belum tersedia."
        );
      } else {
        window.location.href = waUrl;
      }

      setSubmitState({ loading: false, error: "", success: "Permintaan berhasil dikirim." });
      setFlashMessage((prev) => prev || "Permintaan pelayanan berhasil dikirim.");
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      setSubmitState({
        loading: false,
        error: error instanceof Error ? error.message : "Gagal mengirim permintaan.",
        success: "",
      });
    }
  };

  if (pengajarRows.length === 0) {
    return <EmptyState message="Data pengajar belum tersedia pada basis data." />;
  }

  return (
    <section className="grid gap-6">
      {flashMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {flashMessage}
        </div>
      )}
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-red-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">No. Whatsapp Pengajar</h2>
            <p className="mt-1 text-sm text-slate-500">
              Daftar pengajar dan mata pelajaran untuk kebutuhan komunikasi siswa.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SearchableSelect
              label="Filter Mapel"
              value={mapelFilter}
              onChange={setMapelFilter}
              options={mapelOptions}
              placeholder="Cari mata pelajaran"
              labelClassName="text-[10px] uppercase tracking-[0.3em] text-slate-500"
              inputClassName="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
            />
            <button
              onClick={() => {
                setFlashMessage("");
                setIsModalOpen(true);
              }}
              className="rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-red-200 transition hover:bg-red-500"
            >
              Permintaan Pelayanan
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-lg shadow-red-100">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                {["Pengajar", "Mata Pelajaran", "No. Whatsapp"].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs uppercase tracking-[0.3em]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, index) => (
                <tr key={`${getRowValue(row, "Pengajar")}-${index}`} className="border-t border-slate-200">
                  <td className="px-6 py-3 text-slate-900">
                    {getRowValue(row, "Pengajar") || "-"}
                  </td>
                  <td className="px-6 py-3 text-slate-900">
                    {getRowValue(row, "Mata Pelajaran") || "-"}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {getValueByKeys(row, [
                      "No.Whatsapp",
                      "No. Whatsapp",
                      "No.whatsapp",
                      "No Whatsapp",
                      "Nowhatsapp",
                      "Whatsapp",
                      "WA",
                      "No WA",
                    ]) || "-"}
                  </td>
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

      <Modal
        title="Permintaan Pelayanan"
        description="Ajukan permintaan layanan tambahan sesuai kebutuhan belajar siswa."
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {submitState.error ? (
                <span className="text-red-600">{submitState.error}</span>
              ) : submitState.success ? (
                <span className="text-emerald-600">{submitState.success}</span>
              ) : (
                "Permintaan akan tersimpan ke basis data."
              )}
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitState.loading}
              className="rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-red-200 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {submitState.loading ? "Mengirim..." : "Kirim Permintaan & Buka WhatsApp"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Tanggal</label>
            <input
              type="date"
              value={formState.tanggal}
              onChange={(event) => setFormState((prev) => ({ ...prev, tanggal: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <SearchableSelect
            label="Mata Pelajaran"
            value={formState.mataPelajaran}
            onChange={(value) => setFormState((prev) => ({ ...prev, mataPelajaran: value }))}
            options={mapelOptions}
            placeholder="Pilih mata pelajaran"
            labelClassName="text-xs uppercase tracking-[0.3em] text-slate-500"
            inputClassName="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          <SearchableSelect
            label="Pengajar"
            value={formState.pengajar}
            onChange={(value) => setFormState((prev) => ({ ...prev, pengajar: value }))}
            options={pengajarOptions}
            placeholder="Pilih pengajar"
            labelClassName="text-xs uppercase tracking-[0.3em] text-slate-500"
            inputClassName="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Keperluan</label>
            <textarea
              value={formState.keperluan}
              onChange={(event) => setFormState((prev) => ({ ...prev, keperluan: event.target.value }))}
              placeholder="Contoh: butuh pendalaman materi tertentu"
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>
      </Modal>
    </section>
  );
}
