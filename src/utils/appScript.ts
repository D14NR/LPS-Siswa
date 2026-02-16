export const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMiNKXauDC71UAmo8b6xMgRGuZfaKiJmbXwG8-dq96IWZGf0vUCBiDs8v0z8kxun6q/exec";

type AppScriptAction = "presensi" | "pelayanan";

export async function postAppScript(action: AppScriptAction, payload: Record<string, string>) {
  const body = JSON.stringify({ action, ...payload });

  try {
    const response = await fetch(APP_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      throw new Error("Gagal mengirim data ke server.");
    }

    const data = (await response.json()) as { ok?: boolean; message?: string };
    if (!data.ok) {
      throw new Error(data.message || "Terjadi kesalahan saat menyimpan data.");
    }

    return data;
  } catch {
    await fetch(APP_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body,
    });
    return { ok: true };
  }
}
