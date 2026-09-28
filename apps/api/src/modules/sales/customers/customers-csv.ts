import { BadRequestException } from '@nestjs/common';

export interface CustomerCsvRow {
  name: string;
  address?: string;
  taxNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

const NAME_HEADERS = ['client_name', 'name'] as const;
const ADDRESS_HEADERS = ['address'] as const;
const TAX_HEADERS = ['vat_pan_number', 'tax_number', 'vat_pan'] as const;
const CONTACT_HEADERS = ['contact_person'] as const;
const PHONE_HEADERS = ['primary_number', 'contact_number', 'phone'] as const;
const EMAIL_HEADERS = ['primary_email', 'email'] as const;
const MAX_IMPORT_ROWS = 1000;

export const CLIENT_SAMPLE_CSV = [
  'Client Name,Address,VAT_PAN_Number,Contact Person,Alt Contact Person,Primary Number,Alt Number,Primary Email,Alt Email',
  'Sample Ltd,"123 Street, City",123456789,John Doe,Jane Doe,9800000000,014444444,john@sample.com,jane@sample.com',
].join('\r\n');

export function parseCustomerCsv(buffer: Buffer): CustomerCsvRow[] {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rows = parseRows(text).filter((row) => row.some((cell) => cell.trim()));

  if (rows.length < 2) {
    throw new BadRequestException('The CSV file does not contain any clients');
  }

  const headers = rows[0]!.map(normalizeHeader);
  const nameHeader = firstMatchingHeader(headers, NAME_HEADERS);

  if (!nameHeader) {
    throw new BadRequestException('CSV column Client Name is required');
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new BadRequestException(
      `A CSV import can contain at most ${MAX_IMPORT_ROWS} clients`,
    );
  }

  const parsed: CustomerCsvRow[] = [];

  dataRows.forEach((cells, index) => {
    const row = Object.fromEntries(
      headers.map((header, columnIndex) => [
        header,
        cells[columnIndex]?.trim() ?? '',
      ]),
    );
    const rowNumber = index + 2;
    const name = firstValue(row, NAME_HEADERS);

    if (!name) {
      throw new BadRequestException(
        `CSV row ${rowNumber}: Client Name is required`,
      );
    }

    const email = firstValue(row, EMAIL_HEADERS);

    parsed.push({
      name,
      address: firstValue(row, ADDRESS_HEADERS),
      taxNumber: firstValue(row, TAX_HEADERS),
      contactPerson: firstValue(row, CONTACT_HEADERS),
      phone: firstValue(row, PHONE_HEADERS),
      email: email ? email.toLowerCase() : undefined,
    });
  });

  return parsed;
}

function firstMatchingHeader(
  headers: string[],
  candidates: readonly string[],
): string | undefined {
  return candidates.find((candidate) => headers.includes(candidate));
}

function firstValue(
  row: Record<string, string>,
  candidates: readonly string[],
): string | undefined {
  for (const candidate of candidates) {
    const value = row[candidate]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
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
      if (character === '\r' && text[index + 1] === '\n') {
        index += 1;
      }
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
