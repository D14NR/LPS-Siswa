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
  permintaanRows: RowRecord[];
};

const PAGE_SIZE = 12;

export function PengajarPage({ pengajarRows, selectedStudent, permintaanRows }: PengajarPageProps) {
  const [page, setPage] = useState(1);
  const [mapelFilter, setMapelFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactRow, setContactRow] = useState<RowRecord | null>(null);
  const [contactKeperluan, setContactKeperluan] = useState("");
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

  const openContactModal = (row: RowRecord) => {
    if (!selectedStudent) {
      setFlashMessage("Data siswa belum tersedia.");
      return;
    }
    setContactRow(row);
    setContactKeperluan("");
    setIsContactModalOpen(true);
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

  const buildWaMessage = (keperluan: string) => {
    const namaSiswa = getRowValue(selectedStudent, "Nama");
    const asalSekolah = getRowValue(selectedStudent, "Asal Sekolah");
    const kelas =
      getRowValue(selectedStudent, "Kelompok Kelas") ||
      getRowValue(selectedStudent, "Kelas") ||
      getRowValue(selectedStudent, "Kelompok");
    const cabang = getRowValue(selectedStudent, "Cabang");
    return `Halo Kak, perkenalkan saya:\nNama: ${namaSiswa || "-"}\nAsal Sekolah: ${asalSekolah || "-"}\nKelas: ${kelas || "-"}\nCabang: ${cabang || "-"}\n\nKeperluan saya: ${keperluan || "-"}.\n\nMohon responsnya ya kak, Terima kasih.`;
  };

  const resolvePengajarRow = (pengajarName: string, mapel: string) => {
    const normalizedPengajar = normalizeText(pengajarName);
    const normalizedMapel = normalizeText(mapel);

    return (
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
      }) ||
      null
    );
  };

  const buildWaUrl = (row: RowRecord | null, keperluan: string) => {
    const rawPhone = getValueByKeys(row ?? null, [
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
    if (!normalizedPhone) return "";
    const message = buildWaMessage(keperluan);
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  };

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

    const matchedRow = resolvePengajarRow(formState.pengajar, formState.mataPelajaran);
    const waUrl = buildWaUrl(matchedRow, formState.keperluan);

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

  const handleContactSubmit = () => {
    if (!contactRow) return;
    if (!contactKeperluan.trim()) {
      setFlashMessage("Silakan tulis keperluan sebelum menghubungi pengajar.");
      return;
    }
    const waUrl = buildWaUrl(contactRow, contactKeperluan);
    if (!waUrl) {
      setFlashMessage("Nomor WhatsApp pengajar belum tersedia.");
      return;
    }
    setIsContactModalOpen(false);
    setContactKeperluan("");
    setContactRow(null);
    window.location.href = waUrl;
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
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-lg shadow-red-100">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Riwayat Permintaan Pelayanan</h3>
          <p className="mt-1 text-sm text-slate-500">Pantau status permintaan yang sudah diajukan.</p>
        </div>
        {permintaanRows.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Belum ada permintaan pelayanan yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  {["Tanggal", "Mata Pelajaran", "Pengajar", "Keperluan", "Status"].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs uppercase tracking-[0.3em]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permintaanRows.map((row, index) => (
                  <tr key={`${getRowValue(row, "Tanggal")}-${index}`} className="border-t border-slate-200">
                    <td className="px-6 py-3 text-slate-900">
                      {getRowValue(row, "Tanggal") || "-"}
                    </td>
                    <td className="px-6 py-3 text-slate-900">
                      {getRowValue(row, "Mata Pelajaran") || "-"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {getRowValue(row, "Pengajar") || "-"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {getRowValue(row, "Keperluan") || "-"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {getRowValue(row, "Status") || "Menunggu"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                    {(() => {
                      const rawPhone = getValueByKeys(row, [
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
                      const namaSiswa = selectedStudent ? getRowValue(selectedStudent, "Nama") : "";
                      const asalSekolah = selectedStudent ? getRowValue(selectedStudent, "Asal Sekolah") : "";
                      const kelas =
                        selectedStudent?.["Kelompok Kelas"] ||
                        selectedStudent?.["Kelas"] ||
                        selectedStudent?.["Kelompok"] ||
                        "";
                      const cabang = selectedStudent ? getRowValue(selectedStudent, "Cabang") : "";
                      const message = `Halo Kak, perkenalkan saya:\nNama: ${namaSiswa || "-"}\nAsal Sekolah: ${asalSekolah || "-"}\nKelas: ${kelas || "-"}\nCabang: ${cabang || "-"}\n\nKeperluan saya: Konsultasi PR.\n\nMohon responsnya ya kak, Terima kasih.`;
                      const waLink = normalizedPhone
                        ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
                        : "";
                      return (
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{rawPhone || "-"}</span>
                          {waLink && (
                            <button
                              type="button"
                              onClick={() => openContactModal(row)}
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
                            >
                              Hubungi
                            </button>
                          )}
                        </div>
                      );
                    })()}
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

      <Modal
        title="Hubungi Pengajar"
        description="Tuliskan keperluan sebelum membuka WhatsApp pengajar."
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setContactKeperluan("");
          setContactRow(null);
        }}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Pesan akan langsung diarahkan ke WhatsApp.</p>
            <button
              onClick={handleContactSubmit}
              className="rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-500"
            >
              Kirim Pesan
            </button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Keperluan</label>
            <textarea
              value={contactKeperluan}
              onChange={(event) => setContactKeperluan(event.target.value)}
              placeholder="Contoh: Konsultasi PR."
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>
      </Modal>
    </section>
  );
}
