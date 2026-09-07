import { apiRequest } from "@/lib/api";
import type {
  GoodsReceiptListItem,
  ReceiveGoodsInput,
} from "@/types/goods-receipts";

const PATH = "/operations/goods-receipts";

export function getGoodsReceipts(): Promise<GoodsReceiptListItem[]> {
  return apiRequest(PATH);
}

export function receiveGoods(
  input: ReceiveGoodsInput,
): Promise<{ id: string; receiptNumber: string }> {
  return apiRequest(PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
