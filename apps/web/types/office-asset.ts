export type OfficeAssetStatus = "Available" | "In Use" | "PoC";

export interface OfficeAsset {
  id: string;
  assetName: string;
  category: string | null;
  purchaseSource: string | null;
  purchasePrice: number;
  purchaseDate: string | null;
  itemDetails: string | null;
  currentLocation: string | null;
  utilizationStatus: OfficeAssetStatus | string;
  techPersonName: string | null;
  techPersonContact: string | null;
  techPersonEmail: string | null;
  techUsageDetails: string | null;
  techUsedDate: string | null;
  pocPersonContact: string | null;
  pocPersonEmail: string | null;
  pocCompanyName: string | null;
  pocClientName: string | null;
  pocStartDate: string | null;
  pocTakenTime: string | null;
  returnDeadline: string | null;
  returnTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfficeAssetInput {
  assetName: string;
  category: string | null;
  purchasePrice: number;
  purchaseDate: string | null;
  itemDetails: string | null;
  currentLocation: string | null;
  utilizationStatus: OfficeAssetStatus;
  techPersonName: string | null;
  techPersonContact: string | null;
  techUsageDetails: string | null;
  techUsedDate: string | null;
  pocPersonContact: string | null;
  pocCompanyName: string | null;
  pocClientName: string | null;
  pocStartDate: string | null;
  pocTakenTime: string | null;
  returnDeadline: string | null;
  returnTime: string | null;
}
