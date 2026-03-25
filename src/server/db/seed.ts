/**
 * Seed script — run with: bun run db:seed
 * Requires: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const client = createClient({
  url: process.env["TURSO_DATABASE_URL"] ?? "",
  ...(process.env["TURSO_AUTH_TOKEN"] !== undefined && { authToken: process.env["TURSO_AUTH_TOKEN"] }),
});
const db = drizzle(client, { schema });

const SEED_OWNER_ID = "seed-user-001";
const SEED_USERS: Array<{ id: string; name: string; email: string }> = [
  {
    id: SEED_OWNER_ID,
    name: "Farmers Market Admin",
    email: "admin@farmersmarket.local",
  },
  {
    id: "seed-user-002",
    name: "Maya Carter",
    email: "maya@farmersmarket.local",
  },
  {
    id: "seed-user-003",
    name: "Luis Ortega",
    email: "luis@farmersmarket.local",
  },
  {
    id: "seed-user-004",
    name: "Ivy Nguyen",
    email: "ivy@farmersmarket.local",
  },
  {
    id: "seed-user-005",
    name: "Noah Patel",
    email: "noah@farmersmarket.local",
  },
];
const FARM_FALLBACK_IMAGE = "/placeholders/farm-skeleton.svg";
const PRODUCT_FALLBACK_IMAGE = "/placeholders/product-skeleton.svg";

const FARMS = [
  {
    name: "Green Valley Farm",
    city: "Burlington",
    state: "Vermont",
    description:
      "A family-owned farm nestled in the Green Mountains, specializing in heirloom vegetables and artisan cheeses since 1987.",
    email: "hello@greenvalleyfarm.com",
    imageQuery: "vegetable farm green valley",
  },
  {
    name: "Sunrise Orchards",
    city: "Hood River",
    state: "Oregon",
    description:
      "Pacific Northwest orchards producing over 20 varieties of apples, pears, and stone fruit. U-pick available May through October.",
    email: "pick@sunriseorchards.com",
    imageQuery: "apple orchard sunrise pacific northwest",
  },
  {
    name: "Prairie Wind Ranch",
    city: "Salina",
    state: "Kansas",
    description:
      "Pasture-raised beef and heritage pork on 800 acres of native tallgrass prairie. No hormones, no antibiotics.",
    email: "ranch@prairiewind.com",
    imageQuery: "prairie cattle ranch kansas",
  },
  {
    name: "Blue Ridge Honey Co.",
    city: "Asheville",
    state: "North Carolina",
    description:
      "Award-winning raw honey, beeswax candles, and wildflower pollen from hives across the Blue Ridge Mountains.",
    email: "buzz@blueridgehoney.com",
    imageQuery: "honey bees hive blue ridge",
  },
  {
    name: "Coastal Greens",
    city: "Half Moon Bay",
    state: "California",
    description:
      "Year-round microgreens, edible flowers, and specialty lettuces grown in climate-controlled greenhouses steps from the Pacific.",
    email: "greens@coastalgreens.com",
    imageQuery: "microgreens coastal greenhouse california",
  },
];

type ProductSeed = {
  name: string;
  price: number;
  description: string;
  category: schema.Category;
  imageQuery: string;
};

const BASE_PRODUCTS_PER_FARM: ProductSeed[][] = [
  // Green Valley Farm — Vermont
  [
    {
      name: "Rainbow Chard",
      price: 3.5,
      description:
        "Vibrant mixed chard with sweet stems and tender leaves. Perfect for sauteing or adding raw to salads.",
      category: "vegetables",
      imageQuery: "rainbow chard fresh farm",
    },
    {
      name: "Aged Cheddar",
      price: 12.0,
      description:
        "18-month cave-aged cheddar with a sharp, complex flavor and firm texture. Made from grass-fed cow milk.",
      category: "dairy-eggs",
      imageQuery: "aged cheddar cheese wheel",
    },
    {
      name: "Fresh Herb Bundle",
      price: 4.0,
      description:
        "Seasonal bundle of basil, thyme, rosemary, and oregano harvested that morning.",
      category: "herbs-spices",
      imageQuery: "fresh herb bundle basil thyme",
    },
    {
      name: "Heirloom Tomatoes",
      price: 5.0,
      description:
        "Assorted heirloom tomatoes in red, yellow, and purple. Grown from seed varieties dating back over 100 years.",
      category: "vegetables",
      imageQuery: "heirloom tomatoes colorful market",
    },
    {
      name: "Farm Fresh Eggs",
      price: 6.5,
      description:
        "One dozen pasture-raised eggs from our free-range hens. Rich golden yolks and exceptional flavor.",
      category: "dairy-eggs",
      imageQuery: "farm fresh eggs basket pasture raised",
    },
  ],
  // Sunrise Orchards — Oregon
  [
    {
      name: "Honeycrisp Apples",
      price: 5.5,
      description:
        "Exceptionally crisp and sweet Honeycrisp apples hand-picked at peak ripeness. 3 lb bag.",
      category: "fruits",
      imageQuery: "honeycrisp apples basket orchard",
    },
    {
      name: "Fresh-Pressed Cider",
      price: 8.0,
      description:
        "Unfiltered apple cider pressed same-day from our heritage apple blend. Best within 2 weeks.",
      category: "beverages",
      imageQuery: "fresh pressed apple cider jug",
    },
    {
      name: "Pear Jam",
      price: 7.5,
      description:
        "Small-batch pear jam with vanilla bean and cardamom. Low-sugar, high-fruit recipe.",
      category: "honey-preserves",
      imageQuery: "pear jam jar artisan preserve",
    },
    {
      name: "Bartlett Pears",
      price: 4.5,
      description:
        "Classic Bartlett pears at the peak of ripeness — buttery, juicy, and floral. 2 lb bag.",
      category: "fruits",
      imageQuery: "bartlett pears fresh orchard",
    },
    {
      name: "Dried Apple Rings",
      price: 9.0,
      description:
        "Slowly dried apple rings with no added sugar or preservatives. Chewy, concentrated apple flavor.",
      category: "honey-preserves",
      imageQuery: "dried apple rings natural snack",
    },
  ],
  // Prairie Wind Ranch — Kansas
  [
    {
      name: "Grass-Fed Ground Beef",
      price: 9.0,
      description:
        "80/20 lean ground beef from 100% grass-fed and finished cattle. No hormones or antibiotics. 1 lb pack.",
      category: "meat-poultry",
      imageQuery: "grass fed ground beef package farm",
    },
    {
      name: "Heritage Pork Chops",
      price: 14.0,
      description:
        "Bone-in Berkshire pork chops from pigs raised on pasture with natural forage. Rich, marbled flavor.",
      category: "meat-poultry",
      imageQuery: "heritage pork chops butcher farm",
    },
    {
      name: "Heirloom Cornmeal",
      price: 6.0,
      description:
        "Stone-ground from open-pollinated Bloody Butcher corn. Full-flavored for polenta, grits, or cornbread.",
      category: "grains-legumes",
      imageQuery: "heirloom cornmeal stone ground bag",
    },
    {
      name: "Beef Bone Broth",
      price: 11.0,
      description:
        "Slow-simmered for 24 hours from grass-fed beef bones. Rich in collagen and minerals. 32 oz jar.",
      category: "beverages",
      imageQuery: "beef bone broth jar golden",
    },
    {
      name: "Whole Wheat Flour",
      price: 7.0,
      description:
        "Stone-milled from hard red winter wheat grown on the ranch. Full bran and germ intact for maximum nutrition.",
      category: "grains-legumes",
      imageQuery: "whole wheat flour stone milled bag",
    },
  ],
  // Blue Ridge Honey Co. — North Carolina
  [
    {
      name: "Wildflower Raw Honey",
      price: 14.0,
      description:
        "Unprocessed raw honey from Blue Ridge wildflowers. Rich, complex flavor with natural pollen and enzymes intact.",
      category: "honey-preserves",
      imageQuery: "raw wildflower honey jar wooden",
    },
    {
      name: "Lavender Honey",
      price: 16.0,
      description:
        "Delicate honey infused with dried Blue Ridge lavender. Perfect for tea, cheese boards, and baking.",
      category: "honey-preserves",
      imageQuery: "lavender honey jar purple",
    },
    {
      name: "Bee Balm Plant",
      price: 8.0,
      description:
        "Living bee balm (Monarda) starts in 4-inch pots. Attracts pollinators and can be used in teas and cooking.",
      category: "flowers-plants",
      imageQuery: "bee balm monarda plant pot",
    },
    {
      name: "Beeswax Candle",
      price: 12.0,
      description:
        "Hand-poured pure beeswax pillar candle. Burns clean with a naturally sweet honey scent. 4-inch pillar.",
      category: "flowers-plants",
      imageQuery: "beeswax candle natural honey",
    },
    {
      name: "Wildflower Pollen",
      price: 18.0,
      description:
        "Raw bee pollen harvested from Blue Ridge wildflowers. Nutrient-dense superfood with a floral, slightly sweet taste. 8 oz jar.",
      category: "honey-preserves",
      imageQuery: "bee pollen granules jar superfood",
    },
  ],
  // Coastal Greens — California
  [
    {
      name: "Sunflower Microgreens",
      price: 6.0,
      description:
        "Nutty, crunchy sunflower microgreens with a satisfying texture. High in protein and healthy fats. 4 oz clamshell.",
      category: "vegetables",
      imageQuery: "sunflower microgreens tray fresh",
    },
    {
      name: "Edible Flower Mix",
      price: 9.0,
      description:
        "Seasonal mix of nasturtiums, violas, borage, and calendula. Adds color and subtle flavor to salads and desserts.",
      category: "flowers-plants",
      imageQuery: "edible flowers mix nasturtium viola",
    },
    {
      name: "Shiso Bundle",
      price: 4.5,
      description:
        "Fresh red and green shiso leaves for Japanese and Korean cooking. Bright, anise-forward flavor.",
      category: "herbs-spices",
      imageQuery: "shiso leaves fresh bundle japanese",
    },
    {
      name: "Pea Shoot Microgreens",
      price: 5.5,
      description:
        "Tender pea shoots with a sweet, fresh flavor reminiscent of snap peas. Great raw or lightly sauteed. 4 oz clamshell.",
      category: "vegetables",
      imageQuery: "pea shoot microgreens fresh green",
    },
    {
      name: "Specialty Lettuce Mix",
      price: 7.0,
      description:
        "Chef-grade mix of oak leaf, lolla rossa, and butterhead lettuces. Harvested to order for maximum freshness. 5 oz bag.",
      category: "vegetables",
      imageQuery: "specialty lettuce mix salad greens",
    },
  ],
];

const PRODUCT_COMMENT_TEMPLATES: Array<{ rating: number; body: string }> = [
  {
    rating: 5,
    body: "Incredible quality and super fresh on arrival. This is now on my weekly order list.",
  },
  {
    rating: 4,
    body: "Great flavor and texture. Packaging was clean and the product looked exactly like the listing.",
  },
  {
    rating: 5,
    body: "Perfect for meal prep and held up well in the fridge for several days.",
  },
  {
    rating: 4,
    body: "Good value for the quality. I would love to see this available year-round.",
  },
  {
    rating: 5,
    body: "Restaurant-level quality. We used this for a family dinner and everyone asked where it came from.",
  },
  {
    rating: 4,
    body: "Fresh, well-priced, and exactly what we needed for the week.",
  },
];

const FARM_COMMENT_TEMPLATES: Array<{ rating: number; body: string }> = [
  {
    rating: 5,
    body: "Reliable farm with consistently fresh products and excellent communication.",
  },
  {
    rating: 4,
    body: "Great selection and very friendly team. Pickup was smooth and on time.",
  },
  {
    rating: 5,
    body: "One of the best local producers in our area. Quality has been great every week.",
  },
  {
    rating: 4,
    body: "Solid variety and fair prices. Looking forward to trying more seasonal items.",
  },
];

const TARGET_PRODUCTS_PER_FARM = 24;

const PRODUCT_VARIANTS = [
  {
    label: "Harvest Select",
    priceMultiplier: 1,
    descriptionSuffix:
      "Harvested this week and packed for peak freshness.",
    imageSuffix: "harvest fresh",
  },
  {
    label: "Market Favorite",
    priceMultiplier: 1.08,
    descriptionSuffix:
      "A customer-favorite batch selected for flavor and consistency.",
    imageSuffix: "market display",
  },
  {
    label: "Chef's Pick",
    priceMultiplier: 1.12,
    descriptionSuffix:
      "Hand-selected for restaurant-quality prep and plating.",
    imageSuffix: "chef prep",
  },
  {
    label: "Family Pack",
    priceMultiplier: 1.18,
    descriptionSuffix:
      "A larger, value-oriented pack for weekly meal prep.",
    imageSuffix: "bulk pack",
  },
  {
    label: "Weekend Special",
    priceMultiplier: 0.95,
    descriptionSuffix:
      "Limited-run weekend batch priced for quick pickup.",
    imageSuffix: "weekend market",
  },
] as const;

function buildExpandedFarmProducts(baseProducts: ProductSeed[]): ProductSeed[] {
  const expanded: ProductSeed[] = [];
  let index = 0;

  while (expanded.length < TARGET_PRODUCTS_PER_FARM) {
    const base = baseProducts[index % baseProducts.length];
    const variant = PRODUCT_VARIANTS[index % PRODUCT_VARIANTS.length];

    if (!base || !variant) {
      break;
    }

    const cycle = Math.floor(index / baseProducts.length) + 1;
    expanded.push({
      ...base,
      name: `${base.name} ${variant.label} ${cycle}`,
      price: Number((base.price * variant.priceMultiplier).toFixed(2)),
      description: `${base.description} ${variant.descriptionSuffix}`,
      imageQuery: `${base.imageQuery} ${variant.imageSuffix}`,
    });

    index += 1;
  }

  return expanded;
}

const PRODUCTS_PER_FARM = BASE_PRODUCTS_PER_FARM.map((farmProducts) =>
  buildExpandedFarmProducts(farmProducts),
);

const TOTAL_PRODUCTS_TO_SEED = PRODUCTS_PER_FARM.reduce(
  (count, farmProducts) => count + farmProducts.length,
  0,
);

const PRODUCT_COMMENTS_PER_PRODUCT = 3;
const FARM_COMMENTS_PER_FARM = 2;

const TOTAL_PRODUCT_COMMENTS_TO_SEED =
  TOTAL_PRODUCTS_TO_SEED * PRODUCT_COMMENTS_PER_PRODUCT;
const TOTAL_FARM_COMMENTS_TO_SEED = FARMS.length * FARM_COMMENTS_PER_FARM;

function buildSeedPhotoUrl(imageQuery: string, size: string): string {
  const slug = imageQuery
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  const seed = encodeURIComponent(slug.length > 0 ? slug : "farmers-market");
  return `https://picsum.photos/seed/${seed}/${size}`;
}

async function resolveImageUrl(
  imageQuery: string,
  imageSize: string,
  fallbackUrl: string,
): Promise<string> {
  if (imageQuery.trim().length === 0) {
    return fallbackUrl;
  }

  return buildSeedPhotoUrl(imageQuery, imageSize);
}

async function main() {
  console.log("Starting seed...");

  await db.delete(schema.reviews);
  await db.delete(schema.products);
  await db.delete(schema.farms);
  for (const seedUser of SEED_USERS) {
    await db.delete(schema.users).where(eq(schema.users.id, seedUser.id));
  }

  console.log(
    `Seeding ${FARMS.length} farms, ${TOTAL_PRODUCTS_TO_SEED} products, and ${TOTAL_PRODUCT_COMMENTS_TO_SEED + TOTAL_FARM_COMMENTS_TO_SEED} comments...`,
  );

  await db.insert(schema.users).values(SEED_USERS).onConflictDoNothing();

  for (let i = 0; i < FARMS.length; i++) {
    const farmData = FARMS[i];
    if (!farmData) continue;

    console.log(`Creating farm: ${farmData.name}`);
    const farmImage = await resolveImageUrl(
      farmData.imageQuery,
      "1200/700",
      FARM_FALLBACK_IMAGE,
    );

    const farmId = randomUUID();
    await db.insert(schema.farms).values({
      id: farmId,
      name: farmData.name,
      city: farmData.city,
      state: farmData.state,
      description: farmData.description,
      email: farmData.email,
      image: farmImage,
      ownerId: SEED_OWNER_ID,
    });

    const farmCommentOffset = i * FARM_COMMENTS_PER_FARM;
    for (let commentIndex = 0; commentIndex < FARM_COMMENTS_PER_FARM; commentIndex += 1) {
      const comment = FARM_COMMENT_TEMPLATES[
        (farmCommentOffset + commentIndex) % FARM_COMMENT_TEMPLATES.length
      ];
      const author = SEED_USERS[(farmCommentOffset + commentIndex) % SEED_USERS.length];

      if (!comment || !author) {
        continue;
      }

      await db.insert(schema.reviews).values({
        id: randomUUID(),
        body: comment.body,
        rating: comment.rating,
        authorId: author.id,
        farmId,
      });
    }

    const farmProducts = PRODUCTS_PER_FARM[i] ?? [];
    for (const productData of farmProducts) {
      console.log(`  Creating product: ${productData.name}`);
      const productImage = await resolveImageUrl(
        productData.imageQuery,
        "1200/800",
        PRODUCT_FALLBACK_IMAGE,
      );

      const productId = randomUUID();
      await db.insert(schema.products).values({
        id: productId,
        name: productData.name,
        price: productData.price,
        description: productData.description,
        category: productData.category,
        image: productImage,
        farmId,
      });

      const commentBaseOffset = i * TARGET_PRODUCTS_PER_FARM + farmProducts.indexOf(productData);
      for (let commentIndex = 0; commentIndex < PRODUCT_COMMENTS_PER_PRODUCT; commentIndex += 1) {
        const comment = PRODUCT_COMMENT_TEMPLATES[
          (commentBaseOffset + commentIndex) % PRODUCT_COMMENT_TEMPLATES.length
        ];
        const author = SEED_USERS[
          (commentBaseOffset + commentIndex + 1) % SEED_USERS.length
        ];

        if (!comment || !author) {
          continue;
        }

        await db.insert(schema.reviews).values({
          id: randomUUID(),
          body: comment.body,
          rating: comment.rating,
          authorId: author.id,
          productId,
        });
      }
    }
  }

  console.log(
    `Seed complete! Added ${FARMS.length} farms, ${TOTAL_PRODUCTS_TO_SEED} products, and ${TOTAL_PRODUCT_COMMENTS_TO_SEED + TOTAL_FARM_COMMENTS_TO_SEED} comments.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
