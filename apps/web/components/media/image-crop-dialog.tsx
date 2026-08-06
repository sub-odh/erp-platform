"use client";

import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";

import { Button, Modal } from "@/components/ui";
import { IMAGE_UPLOAD_PRESETS, type ImageUploadPreset } from "./image-presets";
import { createCroppedImage } from "./image-utils";

interface ImageCropDialogProps {
  open: boolean;
  imageUrl: string | null;
  originalFileName: string;
  preset: ImageUploadPreset;
  onCancel: () => void;
  onComplete: (file: File) => void;
}

export function ImageCropDialog({
  open,
  imageUrl,
  originalFileName,
  preset,
  onCancel,
  onComplete,
}: ImageCropDialogProps) {
  const settings = IMAGE_UPLOAD_PRESETS[preset];

  const [crop, setCrop] = useState<Point>({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [rotation, setRotation] = useState(0);

  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleCropComplete = useCallback(
    (_croppedAreaPercent: Area, croppedAreaPixels: Area) => {
      setCroppedArea(croppedAreaPixels);
    },
    [],
  );

  function resetCrop(): void {
    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setRotation(0);
  }

  async function handleComplete(): Promise<void> {
    if (!imageUrl || !croppedArea) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const croppedFile = await createCroppedImage({
        sourceUrl: imageUrl,
        crop: croppedArea,
        outputWidth: settings.width,
        outputHeight: settings.height,
        outputType: settings.outputType,
        outputQuality: settings.outputQuality,
        fileName: originalFileName,
        rotation,
      });

      onComplete(croppedFile);
    } catch (cropError) {
      setError(
        cropError instanceof Error
          ? cropError.message
          : "Unable to crop image.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Modal
      open={open}
      title={`Crop ${settings.label.toLowerCase()}`}
      description={`The uploaded image will be saved at ${settings.width} × ${settings.height}px.`}
      onClose={onCancel}
      className="max-w-3xl"
      footer={
        <>
          <Button variant="outline" disabled={processing} onClick={onCancel}>
            Cancel
          </Button>

          <Button loading={processing} onClick={() => void handleComplete()}>
            Crop image
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="relative h-[420px] overflow-hidden rounded-xl bg-slate-950">
          {imageUrl ? (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={settings.aspectRatio}
              cropShape={settings.cropShape}
              showGrid={settings.cropShape !== "round"}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={handleCropComplete}
            />
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
              <span>Zoom</span>
              <span>{zoom.toFixed(1)}×</span>
            </div>

            <div className="flex items-center gap-3">
              <ZoomOut size={18} className="text-slate-400" />

              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full"
              />

              <ZoomIn size={18} className="text-slate-400" />
            </div>
          </div>

          <Button variant="outline" onClick={resetCrop}>
            <RotateCcw size={16} />
            Reset
          </Button>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
            <span>Rotation</span>
            <span>{rotation}°</span>
          </div>

          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={(event) => setRotation(Number(event.target.value))}
            className="w-full"
          />
        </div>

        {error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
