export const IMAGE_UPLOAD_PRESETS = {
  avatar: {
    aspectRatio: 1,
    width: 256,
    height: 256,
    maxFileSize: 2 * 1024 * 1024,
    outputType: "image/webp",
    outputQuality: 0.9,
    preserveAspectRatio: false,
    cropShape: "round",
    label: "Profile picture",
  },

  profileAvatar: {
    aspectRatio: 1,
    width: 256,
    height: 256,
    maxFileSize: 2 * 1024 * 1024,
    outputType: "image/webp",
    outputQuality: 0.9,
    preserveAspectRatio: false,
    cropShape: "rect",
    label: "Profile picture",
  },

  signature: {
    aspectRatio: 300 / 197,
    width: 300,
    height: 197,
    maxFileSize: 2 * 1024 * 1024,
    outputType: "image/png",
    outputQuality: 1,
    preserveAspectRatio: false,
    cropShape: "rect",
    label: "Official signature",
  },

  companyLogo: {
    aspectRatio: 1,
    width: 1200,
    height: 1200,
    maxFileSize: 2 * 1024 * 1024,
    outputType: "image/webp",
    outputQuality: 0.92,
    preserveAspectRatio: true,
    cropShape: "rect",
    label: "Company logo",
  },

  invoiceLogo: {
    aspectRatio: 1,
    width: 1200,
    height: 1200,
    maxFileSize: 2 * 1024 * 1024,
    outputType: "image/webp",
    outputQuality: 0.92,
    preserveAspectRatio: true,
    cropShape: "rect",
    label: "Invoice logo",
  },

  favicon: {
    aspectRatio: 1,
    width: 512,
    height: 512,
    maxFileSize: 2 * 1024 * 1024,
    outputType: "image/png",
    outputQuality: 1,
    preserveAspectRatio: false,
    cropShape: "rect",
    label: "Favicon & app icon",
  },

  customerLogo: {
    aspectRatio: 1,
    width: 512,
    height: 512,
    maxFileSize: 2 * 1024 * 1024,
    outputType: "image/webp",
    outputQuality: 0.9,
    preserveAspectRatio: false,
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
    preserveAspectRatio: false,
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
    preserveAspectRatio: false,
    cropShape: "rect",
    label: "Banner image",
  },
} as const;

export type ImageUploadPreset = keyof typeof IMAGE_UPLOAD_PRESETS;

export type ImageCropShape =
  (typeof IMAGE_UPLOAD_PRESETS)[ImageUploadPreset]["cropShape"];
