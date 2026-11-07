"use client";
import { useRouter } from "next/navigation";
import { CameraIcon } from "@/components/icons";
import { useHydrated } from "@/lib/use-hydrated";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordPhoto } from "@/app/actions/photos";
import { PHOTO_BUCKET } from "@/lib/constants";

/** Downscale large phone photos to keep uploads fast on mobile data. Falls back to the original file. */
async function shrink(file: File, maxSide = 2000): Promise<{ blob: Blob; ext: string; type: string }> {
  const fallback = () => {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    return { blob: file as Blob, ext, type: file.type || "image/jpeg" };
  };
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return fallback();
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ? { blob, ext: "jpg", type: "image/jpeg" } : fallback();
  } catch {
    return fallback();
  }
}

export function PhotoUpload({
  clientId,
  large = false,
  onSaved,
}: {
  clientId: string | null;
  large?: boolean;
  onSaved?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "saved">("idle");
  const [error, setError] = useState<string>();
  const ready = useHydrated();
  const router = useRouter();

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function save() {
    setError(undefined);
    if (!clientId) return setError("Please choose a client first.");
    if (!file) return setError("Please take or choose a photo.");
    setStatus("uploading");
    try {
      const { blob, ext, type } = await shrink(file);
      const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: type, upsert: false });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
      const res = await recordPhoto(clientId, path, caption);
      if (!res.ok) {
        await supabase.storage.from(PHOTO_BUCKET).remove([path]);
        throw new Error(res.error ?? "Could not save photo.");
      }
      setStatus("saved");
      setFile(null);
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
      onSaved?.();
      router.refresh();
    } catch (e) {
      setStatus("idle");
      setError(e instanceof Error ? e.message : "Upload failed. Check your connection and try again.");
    }
  }

  const text = large ? "text-xl" : "";
  return (
    <div className={`space-y-3 ${text}`}>
      <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-btn/50 bg-tint text-center text-navy hover:bg-tint-strong ${large ? "min-h-48 p-6" : "min-h-28 p-4"}`}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Selected photo" className="max-h-72 rounded-lg" />
        ) : (
          <>
            <CameraIcon size={large ? 56 : 36} />
            <span className="mt-2 font-semibold">Take photo or choose from gallery</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            setStatus("idle");
            setError(undefined);
            setFile(e.target.files?.[0] ?? null);
          }}
        />
      </label>
      {preview && (
        <button type="button" className="text-sm font-semibold text-link underline" onClick={() => inputRef.current?.click()}>
          Retake / choose another
        </button>
      )}
      <div>
        <label className={large ? "mb-1 block text-xl font-semibold" : "label"} htmlFor="caption">Caption (optional)</label>
        <input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} className={`input ${large ? "py-4 text-xl" : ""}`} />
      </div>
      {error && <p role="alert" className="rounded-lg bg-overdue-tint p-3 font-medium text-overdue">{error}</p>}
      {status === "saved" && !large && <p role="status" className="rounded-lg bg-done-tint p-3 font-medium text-done">Photo saved.</p>}
      <button
        type="button"
        onClick={save}
        disabled={status === "uploading" || !ready}
        className={`btn-primary w-full ${large ? "py-5 text-2xl" : ""}`}
      >
        {!ready ? "Loading…" : status === "uploading" ? "Uploading…" : "Save photo"}
      </button>
    </div>
  );
}
