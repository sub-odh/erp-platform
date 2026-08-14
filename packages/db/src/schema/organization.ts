import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", {
    length: 200,
  }).notNull(),

  code: varchar("code", {
    length: 50,
  })
    .notNull()
    .unique(),

  legalName: varchar("legal_name", {
    length: 250,
  }),

  registrationNumber: varchar("registration_number", {
    length: 100,
  }),

  registrationDate: date("registration_date"),

  taxNumber: varchar("tax_number", {
    length: 100,
  }),

  email: varchar("email", {
    length: 320,
  }),

  phone: varchar("phone", {
    length: 50,
  }),

  website: varchar("website", {
    length: 500,
  }),

  addressLine1: varchar("address_line_1", {
    length: 250,
  }),

  addressLine2: varchar("address_line_2", {
    length: 250,
  }),

  city: varchar("city", {
    length: 100,
  }),

  state: varchar("state", {
    length: 100,
  }),

  postalCode: varchar("postal_code", {
    length: 30,
  }),

  country: varchar("country", {
    length: 100,
  }),

  currencyCode: varchar("currency_code", {
    length: 3,
  })
    .default("USD")
    .notNull(),

  timezone: varchar("timezone", {
    length: 100,
  })
    .default("UTC")
    .notNull(),

  officeStartTime: varchar("office_start_time", { length: 5 }),

  officeEndTime: varchar("office_end_time", { length: 5 }),

  logoUrl: varchar("logo_url", {
    length: 1000,
  }),

  logoFileName: varchar("logo_file_name", {
    length: 255,
  }),

  logoMimeType: varchar("logo_mime_type", {
    length: 100,
  }),

  logoSize: integer("logo_size"),

  invoiceLogoUrl: varchar("invoice_logo_url", { length: 1000 }),

  invoiceLogoFileName: varchar("invoice_logo_file_name", { length: 255 }),

  invoiceLogoMimeType: varchar("invoice_logo_mime_type", { length: 100 }),

  invoiceLogoSize: integer("invoice_logo_size"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const smtpConfigurations = pgTable(
  "platform_smtp_configurations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    host: varchar("host", { length: 255 }).notNull(),
    port: integer("port").notNull(),
    username: varchar("username", { length: 320 }).notNull(),
    encryptedPassword: varchar("encrypted_password", {
      length: 2000,
    }).notNull(),
    encryption: varchar("encryption", { length: 20 }).notNull(),
    fromEmail: varchar("from_email", { length: 320 }).notNull(),
    senderName: varchar("sender_name", { length: 200 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
    lastTestSucceeded: boolean("last_test_succeeded"),
    lastError: varchar("last_error", { length: 1000 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("platform_smtp_configurations_org_unique").on(
      table.organizationId,
    ),
    index("platform_smtp_configurations_active_index").on(
      table.organizationId,
      table.isActive,
    ),
  ],
);

export type Organization = typeof organizations.$inferSelect;

export type NewOrganization = typeof organizations.$inferInsert;
export type SmtpConfiguration = typeof smtpConfigurations.$inferSelect;
