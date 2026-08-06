export const IMAGE_UPLOAD_PRESETS = {
  avatar: {
    aspectRatio: 1,
    width: 256,
    height: 256,
    maxFileSize: 2 * 1024 * 1024,
    outputType: "image/webp",
    outputQuality: 0.9,
    cropShape: "round",
    label: "Profile picture",
  },

  companyLogo: {
    aspectRatio: 1,
    width: 512,
    height: 512,
    maxFileSize: 2 * 1024 * 1024,
    outputType: "image/webp",
    outputQuality: 0.92,
    cropShape: "rect",
    label: "Company logo",
  },

  customerLogo: {
    aspectRatio: 1,
    width: 512,
    height: 512,
    maxFileSize: 2 * 1024 * 1024,
    outputType: "image/webp",
    outputQuality: 0.9,
    cropShape: "rect",
    label: "Customer logo",
  },

  product: {
    aspectRatio: 1,
    width: 1200,
    height: 1200,
    maxFileSize: 5 * 1024 * 1024,
    outputType: "image/webp",
    outputQuality: 0.88,
    cropShape: "rect",
    label: "Product image",
  },

  banner: {
    aspectRatio: 16 / 9,
    width: 1600,
    height: 900,
    maxFileSize: 5 * 1024 * 1024,
    outputType: "image/webp",
    outputQuality: 0.88,
    cropShape: "rect",
    label: "Banner image",
  },
} as const;

export type ImageUploadPreset = keyof typeof IMAGE_UPLOAD_PRESETS;

export type ImageCropShape =
  (typeof IMAGE_UPLOAD_PRESETS)[ImageUploadPreset]["cropShape"];
