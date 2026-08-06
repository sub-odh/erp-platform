import {
  integer,
  pgTable,
  timestamp,
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

export type Organization = typeof organizations.$inferSelect;

export type NewOrganization = typeof organizations.$inferInsert;
