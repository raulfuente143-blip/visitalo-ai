"use client";

import { useState } from "react";
import { buttonStyles } from "@/components/panel-ui";

// Descarga el archivo y lo guarda con un nombre claro (Supabase no siempre respeta el nombre pedido).
export function DownloadVideoButton({ url, fileName }: { url: string; fileName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("download");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } catch {
      setError("No se ha podido descargar el video. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          void handleDownload();
        }}
        disabled={busy}
        className={`${buttonStyles.dark} disabled:cursor-wait disabled:opacity-60`}
      >
        {busy ? "Descargando…" : "Descargar video"}
      </button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
