import type { Area } from "react-easy-crop";

interface CreateCroppedImageOptions {
  sourceUrl: string;
  crop: Area;
  outputWidth: number;
  outputHeight: number;
  outputType: string;
  outputQuality: number;
  fileName: string;
  rotation?: number;
}

export async function createCroppedImage(
  options: CreateCroppedImageOptions,
): Promise<File> {
  const image = await loadImage(options.sourceUrl);

  const rotation = options.rotation ?? 0;

  const radians = degreesToRadians(rotation);

  const boundingBox = getRotatedBoundingBox(
    image.naturalWidth,
    image.naturalHeight,
    rotation,
  );

  const sourceCanvas = document.createElement("canvas");

  sourceCanvas.width = boundingBox.width;
  sourceCanvas.height = boundingBox.height;

  const sourceContext = sourceCanvas.getContext("2d");

  if (!sourceContext) {
    throw new Error("Your browser cannot process this image.");
  }

  sourceContext.translate(boundingBox.width / 2, boundingBox.height / 2);

  sourceContext.rotate(radians);

  sourceContext.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);

  sourceContext.drawImage(image, 0, 0);

  const outputCanvas = document.createElement("canvas");

  outputCanvas.width = options.outputWidth;

  outputCanvas.height = options.outputHeight;

  const outputContext = outputCanvas.getContext("2d");

  if (!outputContext) {
    throw new Error("Your browser cannot create the cropped image.");
  }

  outputContext.imageSmoothingEnabled = true;
  outputContext.imageSmoothingQuality = "high";

  outputContext.drawImage(
    sourceCanvas,
    options.crop.x,
    options.crop.y,
    options.crop.width,
    options.crop.height,
    0,
    0,
    options.outputWidth,
    options.outputHeight,
  );

  const blob = await canvasToBlob(
    outputCanvas,
    options.outputType,
    options.outputQuality,
  );

  return new File(
    [blob],
    createOutputFileName(options.fileName, options.outputType),
    {
      type: options.outputType,
      lastModified: Date.now(),
    },
  );
}

export function createObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeObjectUrl(value: string | null | undefined): void {
  if (!value) {
    return;
  }

  URL.revokeObjectURL(value);
}

export function validateImageFile(
  file: File,
  maxFileSize: number,
): string | null {
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return "Only PNG, JPEG, and WebP images are supported.";
  }

  if (file.size > maxFileSize) {
    return `The selected image must not exceed ${formatFileSize(maxFileSize)}.`;
  }

  return null;
}

export function formatFileSize(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImage(sourceUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));

    image.addEventListener("error", () =>
      reject(new Error("Unable to read the selected image.")),
    );

    image.crossOrigin = "anonymous";
    image.src = sourceUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  outputType: string,
  outputQuality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to create the cropped image."));

          return;
        }

        resolve(blob);
      },
      outputType,
      outputQuality,
    );
  });
}

function createOutputFileName(
  originalName: string,
  outputType: string,
): string {
  const baseName = originalName.replace(/\.[^.]+$/, "").trim() || "image";

  const extension =
    outputType === "image/png"
      ? "png"
      : outputType === "image/jpeg"
        ? "jpg"
        : "webp";

  return `${baseName}.${extension}`;
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getRotatedBoundingBox(
  width: number,
  height: number,
  rotation: number,
): {
  width: number;
  height: number;
} {
  const radians = degreesToRadians(rotation);

  return {
    width:
      Math.abs(Math.cos(radians) * width) +
      Math.abs(Math.sin(radians) * height),

    height:
      Math.abs(Math.sin(radians) * width) +
      Math.abs(Math.cos(radians) * height),
  };
}
