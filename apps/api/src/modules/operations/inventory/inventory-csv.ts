import { BadRequestException } from '@nestjs/common';

import type { CreateInventoryAssetDto } from './dto/create-inventory-asset.dto';
import { INVENTORY_ASSET_STATUSES } from './dto/create-inventory-asset.dto';

const REQUIRED_HEADERS = ['item_name', 'category'] as const;
const MAX_IMPORT_ROWS = 1000;

const STATUS_ALIASES: Record<string, CreateInventoryAssetDto['status']> = {
  AVAILABLE: 'IN_STOCK',
  IN_STOCK: 'IN_STOCK',
  SOLD: 'SOLD',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DELIVERED: 'DELIVERED',
  DAMAGED: 'DAMAGED',
  RETURNED: 'RETURNED',
  RMA: 'RMA',
};

export const INVENTORY_SAMPLE_CSV = [
  'item_name,category,vendor,model_no,serial_no,purchase_source,quantity,cost,mrp,status,notes',
  'Dell PowerEdge R740,Server,Dell,R740,SN-0001,Local Supplier,1,250000,285000,IN_STOCK,Primary rack server',
].join('\r\n');

export function parseInventoryCsv(buffer: Buffer): CreateInventoryAssetDto[] {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rows = parseRows(text).filter((row) => row.some((cell) => cell.trim()));

  if (rows.length < 2) {
    throw new BadRequestException('The CSV file does not contain any assets');
  }

  const headers = rows[0]!.map(normalizeHeader);

  for (const header of REQUIRED_HEADERS) {
    if (!headers.includes(header)) {
      throw new BadRequestException(`CSV column ${header} is required`);
    }
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new BadRequestException(
      `A CSV import can contain at most ${MAX_IMPORT_ROWS} assets`,
    );
  }

  return dataRows.map((cells, index) => {
    const row = Object.fromEntries(
      headers.map((header, columnIndex) => [
        header,
        cells[columnIndex]?.trim() ?? '',
      ]),
    );
    const rowNumber = index + 2;
    const itemName = row.item_name;
    const category = row.category;

    if (!itemName || !category) {
      throw new BadRequestException(
        `CSV row ${rowNumber}: item_name and category are required`,
      );
    }

    const quantity = parseNonNegativeInteger(
      row.quantity || '1',
      rowNumber,
      'quantity',
      true,
    );
    const purchasePrice = parseMoney(row.cost || '0', rowNumber, 'cost');
    const mrpPrice = parseMoney(row.mrp || '0', rowNumber, 'mrp');
    const statusKey = (row.status || 'IN_STOCK')
      .trim()
      .toUpperCase()
      .replace(/[ -]+/g, '_');
    const status = STATUS_ALIASES[statusKey];

    if (!status || !INVENTORY_ASSET_STATUSES.includes(status)) {
      throw new BadRequestException(
        `CSV row ${rowNumber}: status ${row.status} is not supported`,
      );
    }

    return {
      itemName,
      category,
      vendor: optional(row.vendor),
      modelNumber: optional(row.model_no),
      serialNumber: optional(row.serial_no),
      purchaseSource: optional(row.purchase_source),
      quantity,
      purchasePrice,
      mrpPrice,
      status,
      notes: optional(row.notes),
    };
  });
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;

    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += character;
  }

  if (quoted) {
    throw new BadRequestException('The CSV file contains an unclosed quote');
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[ -]+/g, '_');
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function parseNonNegativeInteger(
  value: string,
  rowNumber: number,
  field: string,
  positive: boolean,
): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < (positive ? 1 : 0)) {
    throw new BadRequestException(
      `CSV row ${rowNumber}: ${field} must be ${positive ? 'a positive' : 'a non-negative'} whole number`,
    );
  }
  return parsed;
}

function parseMoney(value: string, rowNumber: number, field: string): number {
  const parsed = Number(value);
  if (
    !Number.isFinite(parsed) ||
    parsed < 0 ||
    !/^\d+(\.\d{1,2})?$/.test(value)
  ) {
    throw new BadRequestException(
      `CSV row ${rowNumber}: ${field} must be a non-negative amount with up to two decimals`,
    );
  }
  return parsed;
}
