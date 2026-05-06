import { supabase } from "@/utils/supabaseClient";
import type { RowRecord } from "@/utils/dataHelpers";

export interface PermintaanPelayanan {
  id?: string;
  nis: string;
  nama: string;
  cabang?: string;
  tanggal: string;
  mata_pelajaran: string;
  pengajar: string;
  keperluan?: string;
  status?: string;
  tanggal_disetujui?: string;
  jam_disetujui?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save a new permintaan pelayanan request to Supabase
 */
export async function savePermintaanPelayanan(data: PermintaanPelayanan) {
  try {
    const { data: result, error } = await supabase
      .from("permintaan_pelayanan")
      .insert([
        {
          nis: data.nis,
          nama: data.nama,
          cabang: data.cabang || null,
          tanggal: data.tanggal,
          mata_pelajaran: data.mata_pelajaran,
          pengajar: data.pengajar,
          keperluan: data.keperluan || null,
          status: data.status || "Menunggu",
        },
      ])
      .select();

    if (error) {
      throw new Error(error.message || "Gagal menyimpan permintaan pelayanan");
    }

    return result;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Gagal menyimpan permintaan pelayanan ke database");
  }
}

/**
 * Fetch all permintaan pelayanan requests for a specific student (NIS)
 */
export async function fetchPermintaanByNis(nis: string) {
  try {
    const normalizedNis = nis.trim();
    console.log("🔍 Fetching permintaan for NIS:", normalizedNis);
    
    const { data, error } = await supabase
      .from("permintaan_pelayanan")
      .select("*")
      .eq("nis", normalizedNis)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase error:", error);
      throw new Error(error.message || "Gagal mengambil data permintaan pelayanan");
    }

    console.log("✓ Found", data?.length || 0, "permintaan records for NIS:", normalizedNis);
    return data || [];
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Gagal mengambil data permintaan pelayanan");
  }
}

/**
 * Fetch all permintaan pelayanan requests
 */
export async function fetchAllPermintaan() {
  try {
    const { data, error } = await supabase
      .from("permintaan_pelayanan")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "Gagal mengambil data permintaan pelayanan");
    }

    return data || [];
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Gagal mengambil data permintaan pelayanan");
  }
}

/**
 * Convert Supabase permintaan data to RowRecord format for compatibility
 */
export function convertPermintaanToRowRecord(
  permintaan: PermintaanPelayanan
): RowRecord {
  return {
    Nis: permintaan.nis || "",
    Nama: permintaan.nama || "",
    Cabang: permintaan.cabang || "",
    Tanggal: permintaan.tanggal || "",
    "Mata Pelajaran": permintaan.mata_pelajaran || "",
    Pengajar: permintaan.pengajar || "",
    Keperluan: permintaan.keperluan || "",
    Status: permintaan.status || "Menunggu",
    "Tanggal Disetujui": permintaan.tanggal_disetujui || "",
    "Jam Disetujui": permintaan.jam_disetujui || "",
    Timestamp: permintaan.created_at || "",
  };
}

/**
 * Convert an array of Supabase permintaan data to RowRecord array
 */
export function convertPermintaanArrayToRowRecords(
  permintaanList: PermintaanPelayanan[]
): RowRecord[] {
  const rows = permintaanList.map(convertPermintaanToRowRecord);
  console.log("📊 Converted", rows.length, "permintaan records to RowRecord format");
  if (rows.length > 0) {
    console.log("Sample row:", rows[0]);
  }
  return rows;
}

/**
 * Synchronize approved permintaan into `jadwal_khusus` table.
 * This will insert a jadwal_khusus row for each permintaan with status 'Disetujui'
 * if an equivalent jadwal_khusus entry does not already exist.
 */
export async function syncApprovedToJadwalKhusus() {
  try {
    console.log("🔁 Checking approved permintaan to sync to jadwal_khusus...");
    const { data: approved, error } = await supabase
      .from("permintaan_pelayanan")
      .select("*")
      .eq("status", "Disetujui");

    if (error) {
      console.error("❌ Error fetching approved permintaan:", error);
      return;
    }

    if (!Array.isArray(approved) || approved.length === 0) {
      console.log("ℹ️ No approved permintaan found.");
      return;
    }

    for (const p of approved) {
      const tanggal = (p.tanggal_disetujui || p.tanggal || "").toString();
      const waktu = (p.jam_disetujui || "").toString();
      const cabang = (p.cabang || "").toString();
      const mapel = (p.mata_pelajaran || "").toString();
      const namaPengajar = (p.pengajar || "").toString();
      const namaSiswa = (p.nama || "").toString();

      // Get kode_pengajar from nama pengajar
      let kodePengajar = namaPengajar;
      try {
        const { data: pengajarData, error: pengajarError } = await supabase
          .from("pengajar")
          .select("kode_pengajar")
          .eq("nama", namaPengajar)
          .limit(1);

        if (!pengajarError && Array.isArray(pengajarData) && pengajarData.length > 0) {
          kodePengajar = pengajarData[0].kode_pengajar || namaPengajar;
        }
      } catch (e) {
        console.warn("⚠️ Could not fetch kode_pengajar for:", namaPengajar, e);
      }

      // Check for an existing jadwal_khusus matching the key fields
      const { data: exists, error: checkError } = await supabase
        .from("jadwal_khusus")
        .select("id")
        .eq("cabang", cabang)
        .eq("tanggal", tanggal)
        .eq("mapel", mapel)
        .eq("pengajar", kodePengajar)
        .eq("waktu", waktu)
        .limit(1);

      if (checkError) {
        console.error("❌ Error checking jadwal_khusus existence:", checkError);
        continue;
      }

      if (Array.isArray(exists) && exists.length > 0) {
        console.log("⏭️ jadwal_khusus already exists for:", { cabang, tanggal, mapel, pengajar: kodePengajar, waktu });
        continue;
      }

      // Insert a new jadwal_khusus row. Use 'Pelayanan(nama siswa)' for kelas.
      const insertPayload = {
        cabang,
        kelas: `Pelayanan(${namaSiswa})`,
        sekolah: "",
        tanggal,
        mapel,
        pengajar: kodePengajar,
        waktu,
      };

      const { error: insertError } = await supabase.from("jadwal_khusus").insert([insertPayload]);
      if (insertError) {
        console.error("❌ Failed to insert jadwal_khusus:", insertError, "payload:", insertPayload);
      } else {
        console.log("✅ Inserted jadwal_khusus for permintaan id:", p.id || "(unknown)", insertPayload);
      }
    }
  } catch (err) {
    console.error("❌ syncApprovedToJadwalKhusus error:", err);
  }
}
