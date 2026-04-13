import { formatDateForStorage } from "@/utils/dataHelpers";

const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMiNKXauDC71UAmo8b6xMgRGuZfaKiJmbXwG8-dq96IWZGf0vUCBiDs8v0z8kxun6q/exec";

type AppScriptPayload = Record<string, string>;

const normalizeDatePayload = (payload: AppScriptPayload) => {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      const isDateField = key.toLowerCase().includes("tanggal");
      return [key, isDateField ? formatDateForStorage(value) : value];
    })
  ) as AppScriptPayload;
};

export async function postAppScript(route: string, payload: AppScriptPayload) {
  try {
    const normalizedPayload = normalizeDatePayload(payload);
    const response = await fetch(APP_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...normalizedPayload, action: route }),
    });

    if (response.type === "opaque") {
      return { ok: true };
    }

    if (!response.ok) {
      throw new Error("Gagal menyimpan data ke basis data.");
    }

    return response.json().catch(() => ({}));
  } catch (error) {
    throw error instanceof Error ? error : new Error("Gagal menyimpan data ke basis data.");
  }
}
