import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  text,
  integer,
  real,
  sqliteTable,
  check,
  index,
} from "drizzle-orm/sqlite-core";

// ── Users ──────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  githubId: text("github_id").unique(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

// ── Auth.js tables ────────────────────────────────────────────────────────
export const accounts = sqliteTable("accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: text("expires").notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: text("expires").notNull(),
});

// ── Category enum ─────────────────────────────────────────────────────────
export const CATEGORIES = [
  "vegetables",
  "fruits",
  "dairy-eggs",
  "meat-poultry",
  "herbs-spices",
  "honey-preserves",
  "baked-goods",
  "flowers-plants",
  "grains-legumes",
  "beverages",
] as const;

export type Category = (typeof CATEGORIES)[number];

// ── Farms ─────────────────────────────────────────────────────────────────
export const farms = sqliteTable(
  "farms",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    description: text("description").notNull(),
    email: text("email"),
    website: text("website"),
    image: text("image").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: real("rating").default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [index("farms_owner_idx").on(t.ownerId)],
);

// ── Products ──────────────────────────────────────────────────────────────
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    price: real("price").notNull(),
    description: text("description").notNull(),
    category: text("category", { enum: CATEGORIES }).notNull(),
    image: text("image").notNull(),
    farmId: text("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    rating: real("rating").default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("products_farm_idx").on(t.farmId),
    index("products_category_idx").on(t.category),
  ],
);

// ── Reviews ───────────────────────────────────────────────────────────────
export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    body: text("body").notNull(),
    rating: integer("rating").notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    farmId: text("farm_id").references(() => farms.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (t) => [
    check("rating_range", sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
    index("reviews_farm_idx").on(t.farmId),
    index("reviews_product_idx").on(t.productId),
    index("reviews_author_idx").on(t.authorId),
  ],
);

// ── Inferred types ────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Farm = typeof farms.$inferSelect;
export type NewFarm = typeof farms.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
