/**
 * Seed script — run with: bun run db:seed
 * Requires: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, UNSPLASH_ACCESS_KEY,
 *           CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";
import * as schema from "./schema";
import { fetchAndStoreImage } from "../services/image.service";

const client = createClient({
  url: process.env["TURSO_DATABASE_URL"] ?? "",
  authToken: process.env["TURSO_AUTH_TOKEN"],
});
const db = drizzle(client, { schema });

const SEED_USER_ID = "seed-user-001";

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

const PRODUCTS_PER_FARM: ProductSeed[][] = [
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
  ],
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
  ],
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
  ],
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
  ],
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
  ],
];

const SAMPLE_REVIEWS: [number, string][] = [
  [5, "Absolutely fresh and delicious! Will buy again."],
  [4, "Great quality and well packaged. Highly recommend."],
  [5, "Best I have found at any market. So good."],
];

async function main() {
  console.log("Starting seed...");

  await db
    .insert(schema.users)
    .values({
      id: SEED_USER_ID,
      name: "Farmers Market Admin",
      email: "admin@farmersmarket.local",
    })
    .onConflictDoNothing();

  for (let i = 0; i < FARMS.length; i++) {
    const farmData = FARMS[i];
    if (!farmData) continue;

    console.log(`Creating farm: ${farmData.name}`);
    let farmImage: string;
    try {
      farmImage = await fetchAndStoreImage(farmData.imageQuery);
    } catch (e) {
      console.warn(`Image fetch failed, using placeholder: ${String(e)}`);
      farmImage = `https://placehold.co/800x500/a3c97e/ffffff?text=${encodeURIComponent(farmData.name)}`;
    }

    const farmId = randomUUID();
    await db.insert(schema.farms).values({
      id: farmId,
      name: farmData.name,
      city: farmData.city,
      state: farmData.state,
      description: farmData.description,
      email: farmData.email,
      image: farmImage,
      ownerId: SEED_USER_ID,
    });

    const farmProducts = PRODUCTS_PER_FARM[i] ?? [];
    for (const productData of farmProducts) {
      console.log(`  Creating product: ${productData.name}`);
      let productImage: string;
      try {
        productImage = await fetchAndStoreImage(productData.imageQuery);
      } catch (e) {
        console.warn(`Image fetch failed, using placeholder: ${String(e)}`);
        productImage = `https://placehold.co/600x400/a3c97e/ffffff?text=${encodeURIComponent(productData.name)}`;
      }

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

      const reviewsToAdd = SAMPLE_REVIEWS.slice(0, 2);
      for (const [rating, body] of reviewsToAdd) {
        await db.insert(schema.reviews).values({
          id: randomUUID(),
          body,
          rating,
          authorId: SEED_USER_ID,
          productId,
        });
      }
    }
  }

  console.log("Seed complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
