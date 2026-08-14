"use client";

import { Camera, ImagePlus, Pencil, Trash2 } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { IMAGE_UPLOAD_PRESETS, type ImageUploadPreset } from "./image-presets";
import {
  createObjectUrl,
  revokeObjectUrl,
  validateImageFile,
} from "./image-utils";
import { ImageCropDialog } from "./image-crop-dialog";

interface ImageUploaderProps {
  preset: ImageUploadPreset;
  value?: string | null;
  disabled?: boolean;
  uploading?: boolean;
  removing?: boolean;
  onUpload?: (file: File) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
  deferUpload?: boolean;
  onCroppedFileChange?: (file: File | null) => void;
  accept?: string;
  emptyLabel?: string;
  previewAspectRatio?: boolean;
  inputId?: string;
}

export function ImageUploader({
  preset,
  value,
  disabled = false,
  uploading = false,
  removing = false,
  onUpload,
  onRemove,
  deferUpload = false,
  onCroppedFileChange,
  accept = "image/png,image/jpeg,image/webp",
  emptyLabel,
  previewAspectRatio = false,
  inputId,
}: ImageUploaderProps) {
  const settings = IMAGE_UPLOAD_PRESETS[preset];

  const inputRef = useRef<HTMLInputElement>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const busy = disabled || uploading || removing;

  const displayedValue = localPreviewUrl ?? value ?? null;

  const round = settings.cropShape === "round";

  const usePresetPreviewRatio = !round && previewAspectRatio;

  const canRemove = Boolean(
    displayedValue && (onRemove || (deferUpload && localPreviewUrl)),
  );

  useEffect(() => {
    return () => {
      revokeObjectUrl(sourceUrl);
      revokeObjectUrl(localPreviewUrl);
    };
  }, [sourceUrl, localPreviewUrl]);

  useEffect(() => {
    if (deferUpload || !value || !localPreviewUrl) {
      return;
    }

    revokeObjectUrl(localPreviewUrl);

    setLocalPreviewUrl(null);
  }, [deferUpload, value, localPreviewUrl]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  function openFilePicker(): void {
    if (busy) {
      return;
    }

    setMenuOpen(false);

    inputRef.current?.click();
  }

  function handleSelection(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validateImageFile(file, settings.maxFileSize);

    if (validationError) {
      setError(validationError);

      return;
    }

    revokeObjectUrl(sourceUrl);

    setSelectedFile(file);

    setSourceUrl(createObjectUrl(file));

    setError(null);
  }

  function closeCropDialog(): void {
    revokeObjectUrl(sourceUrl);

    setSourceUrl(null);

    setSelectedFile(null);
  }

  async function handleCropped(file: File): Promise<void> {
    setError(null);

    const previewUrl = createObjectUrl(file);

    revokeObjectUrl(localPreviewUrl);

    setLocalPreviewUrl(previewUrl);

    try {
      if (deferUpload) {
        onCroppedFileChange?.(file);

        closeCropDialog();

        return;
      }

      if (!onUpload) {
        throw new Error("No image upload handler is configured.");
      }

      await onUpload(file);

      closeCropDialog();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload image.",
      );
    }
  }

  async function handleRemove(): Promise<void> {
    if (busy) {
      return;
    }

    setMenuOpen(false);

    setError(null);

    if (deferUpload && localPreviewUrl) {
      revokeObjectUrl(localPreviewUrl);

      setLocalPreviewUrl(null);

      onCroppedFileChange?.(null);

      return;
    }

    if (!onRemove) {
      return;
    }

    try {
      await onRemove();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove image.",
      );
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div
          className={[
            "relative",
            round ? "mx-auto h-40 w-40" : "w-full max-w-xs",
          ].join(" ")}
        >
          <div
            className={[
              "overflow-hidden bg-slate-100 shadow-sm ring-1 ring-slate-200",
              round
                ? "h-40 w-40 rounded-full"
                : usePresetPreviewRatio
                  ? "w-full rounded-2xl"
                  : "h-40 w-full rounded-2xl",
              busy ? "opacity-70" : "",
            ].join(" ")}
            style={
              usePresetPreviewRatio
                ? { aspectRatio: settings.aspectRatio }
                : undefined
            }
          >
            {displayedValue ? (
              <img
                src={displayedValue}
                alt={settings.label}
                className={[
                  "h-full w-full",
                  round ? "object-cover" : "object-contain",
                ].join(" ")}
              />
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={openFilePicker}
                className="flex h-full w-full flex-col items-center justify-center text-slate-400 transition hover:bg-slate-200/50"
              >
                {round ? <Camera size={34} /> : <ImagePlus size={36} />}

                <span className="mt-2 text-sm font-medium">
                  {emptyLabel ?? (round ? "Add photo" : "Add image")}
                </span>
              </button>
            )}
          </div>

          {displayedValue ? (
            <div ref={menuRef} className="absolute bottom-1 right-1 z-30">
              <button
                type="button"
                disabled={busy}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={`Edit ${settings.label.toLowerCase()}`}
                onClick={() => setMenuOpen((current) => !current)}
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-md transition",
                  menuOpen
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                ].join(" ")}
              >
                <Pencil size={16} />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="
                  absolute
                  right-0
                  top-12
                  z-50
                  w-44
                  overflow-hidden
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  py-1
                  shadow-xl
                "
                >
                  <button
                    type="button"
                    role="menuitem"
                    disabled={busy}
                    onClick={openFilePicker}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <Camera size={17} className="shrink-0 text-slate-500" />
                    Change image
                  </button>

                  {canRemove ? (
                    <>
                      <div className="mx-3 border-t border-slate-100" />

                      <button
                        type="button"
                        role="menuitem"
                        disabled={busy}
                        onClick={() => void handleRemove()}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {removing ? (
                          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-red-600 border-r-transparent" />
                        ) : (
                          <Trash2 size={17} className="shrink-0" />
                        )}

                        {removing ? "Removing..." : "Remove image"}
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {uploading ? (
            <div
              className={[
                "absolute inset-0 z-40 flex items-center justify-center bg-slate-950/55",
                round ? "rounded-full" : "rounded-2xl",
              ].join(" ")}
            >
              <div className="text-center text-white">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white border-r-transparent" />

                <p className="mt-2 text-sm font-medium">Uploading...</p>
              </div>
            </div>
          ) : null}
        </div>

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={busy}
          onChange={handleSelection}
        />

        {error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <ImageCropDialog
        open={Boolean(sourceUrl && selectedFile)}
        imageUrl={sourceUrl}
        originalFileName={selectedFile?.name ?? "image"}
        preset={preset}
        onCancel={closeCropDialog}
        onComplete={(file) => void handleCropped(file)}
      />
    </>
  );
}
