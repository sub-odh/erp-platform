"use client";

import { ImagePlus, Trash2, Upload } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { IMAGE_UPLOAD_PRESETS, type ImageUploadPreset } from "./image-presets";
import {
  createObjectUrl,
  formatFileSize,
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
  onUpload: (file: File) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
}

export function ImageUploader({
  preset,
  value,
  disabled = false,
  uploading = false,
  removing = false,
  onUpload,
  onRemove,
}: ImageUploaderProps) {
  const settings = IMAGE_UPLOAD_PRESETS[preset];

  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      revokeObjectUrl(sourceUrl);
    };
  }, [sourceUrl]);

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
    try {
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

  return (
    <>
      <div className="space-y-4">
        <div
          className={[
            "flex min-h-40 items-center justify-center overflow-hidden border border-dashed bg-slate-50",
            settings.cropShape === "round"
              ? "mx-auto h-40 w-40 rounded-full"
              : "w-full max-w-xs rounded-2xl",
          ].join(" ")}
        >
          {value ? (
            <img
              src={value}
              alt={settings.label}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="p-6 text-center">
              <ImagePlus size={36} className="mx-auto text-slate-300" />

              <p className="mt-3 text-sm font-medium text-slate-700">
                No image uploaded
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-900">{settings.label}</p>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            PNG, JPEG, or WebP. Maximum {formatFileSize(settings.maxFileSize)}.
            The image will be cropped and resized to {settings.width} ×{" "}
            {settings.height}px.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleSelection}
        />

        <div className="flex flex-wrap gap-3">
          <Button
            disabled={disabled || uploading || removing}
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={17} />

            {value ? "Replace image" : "Choose image"}
          </Button>

          {value && onRemove ? (
            <Button
              variant="outline"
              disabled={disabled || uploading || removing}
              loading={removing}
              className="text-red-700"
              onClick={() => void onRemove()}
            >
              <Trash2 size={17} />
              Remove
            </Button>
          ) : null}
        </div>

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
