
import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type CategoryNode = {
  name: string
  children?: CategoryNode[]
}

const leaf = (names: string[]): CategoryNode[] =>
  names.map((name) => ({ name }))

const categories: CategoryNode[] = [
  {
    name: "Women",
    children: [
      {
        name: "Clothing",
        children: leaf([
          "Dresses", "Tops & Blouses", "T-Shirts", "Shirts",
          "Jeans", "Trousers", "Skirts", "Jackets & Coats",
          "Knitwear", "Activewear", "Loungewear",
        ]),
      },
      {
        name: "Shoes",
        children: leaf([
          "Sneakers", "Heels", "Flats", "Boots", "Sandals",
        ]),
      },
      {
        name: "Bags",
        children: leaf([
          "Handbags", "Shoulder Bags", "Crossbody Bags",
          "Tote Bags", "Backpacks",
        ]),
      },
      {
        name: "Accessories",
        children: leaf([
          "Scarves", "Belts", "Sunglasses", "Hats", "Wallets",
        ]),
      },
    ],
  },
  {
    name: "Men",
    children: [
      {
        name: "Clothing",
        children: leaf([
          "T-Shirts", "Polo Shirts", "Shirts", "Jeans",
          "Trousers", "Shorts", "Hoodies & Sweatshirts",
          "Jackets & Coats", "Suits & Blazers", "Activewear",
        ]),
      },
      {
        name: "Shoes",
        children: leaf([
          "Sneakers", "Formal Shoes", "Boots", "Sandals",
        ]),
      },
      {
        name: "Accessories",
        children: leaf([
          "Belts", "Wallets", "Watches", "Caps",
          "Sunglasses", "Bags",
        ]),
      },
    ],
  },
  {
    name: "Jewelry",
    children: leaf([
      "Necklaces", "Earrings", "Bracelets",
      "Rings", "Jewelry Sets",
    ]),
  },
  {
    name: "Kids",
    children: [
      {
        name: "Girls",
        children: leaf(["Clothing", "Shoes", "Accessories"]),
      },
      {
        name: "Boys",
        children: leaf(["Clothing", "Shoes", "Accessories"]),
      },
      {
        name: "Baby",
        children: leaf(["Clothing", "Shoes"]),
      },
    ],
  },
]

const productTypes = [
  "T-Shirt", "Shirt", "Blouse", "Dress", "Jeans",
  "Trousers", "Skirt", "Hoodie", "Sweater", "Jacket",
  "Coat", "Blazer", "Shorts", "Polo Shirt",
  "Sneakers", "Boots", "Heels", "Sandals",
  "Flats", "Formal Shoes",
  "Handbag", "Tote Bag", "Crossbody Bag",
  "Backpack", "Wallet", "Belt", "Scarf",
  "Hat", "Cap", "Sunglasses", "Watch",
  "Necklace", "Earrings", "Ring",
  "Bracelet", "Jewelry Set",
]

const tags = [
  "new-arrival", "featured", "best-seller",
  "limited-edition", "clearance", "online-exclusive",
  "spring", "summer", "autumn", "winter", "all-season",
  "casual", "formal", "minimalist", "streetwear",
  "classic", "sporty", "elegant", "modest-fashion",
  "cotton", "linen", "denim", "wool",
  "leather", "faux-leather", "polyester",
  "workwear", "daily-wear", "wedding-guest",
  "party", "travel", "eid", "gift-idea",
  "slim-fit", "regular-fit", "oversized", "relaxed-fit",
  "unisex", "premium", "everyday-essential",
]

const collections = [
  { title: "New Arrivals", handle: "new-arrivals" },
  { title: "Best Sellers", handle: "best-sellers" },
  { title: "Autumn/Winter 2026", handle: "autumn-winter-2026" },
  { title: "Summer Essentials", handle: "summer-essentials" },
  { title: "Everyday Essentials", handle: "everyday-essentials" },
  { title: "Special Offers", handle: "special-offers" },
]

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// Read every page so reruns also reuse records in larger existing catalogs.
async function listAll<T>(page: (skip: number) => Promise<T[]>): Promise<T[]> {
  const result: T[] = []
  for (let skip = 0; ; skip += 250) {
    const records = await page(skip)
    result.push(...records)
    if (records.length < 250) return result
  }
}

export default async function setupFashionCatalog({
  container,
}: ExecArgs) {
  const product = container.resolve(Modules.PRODUCT)

  const preview = process.env.AMOON_TAXONOMY_DRY_RUN === "true"
  console.log(preview ? "Preview only: no records will be changed." : "Starting fashion catalog setup...")

  // Use complete category paths as handles to avoid
  // collisions such as Women/Shoes and Men/Shoes.
  const existingCategories = await listAll(skip => product.listProductCategories(
    {}, { take: 250, skip, order: { id: "ASC" } }
  ))

  const categoryByHandle = new Map<string, { id: string; parent_category_id?: string | null }>(
    existingCategories.map((c) => [c.handle, c])
  )

  async function createCategoryTree(
    nodes: CategoryNode[],
    parentId?: string,
    parentPath = ""
  ) {
    for (const node of nodes) {
      const segment = slugify(node.name)
      const handle = parentPath
        ? `${parentPath}-${segment}`
        : segment

      let category = categoryByHandle.get(handle)

      if (!category) {
        category = preview ? { id: `preview:${handle}`, parent_category_id: parentId } : await product.createProductCategories({
          name: node.name,
          handle,
          parent_category_id: parentId,
          is_active: true,
          is_internal: false,
        })

        categoryByHandle.set(handle, category)
        console.log(`${preview ? "Would create" : "Created"} category: ${handle}`)
      } else {
        console.log(`Exists category: ${handle}`)
        if ((category.parent_category_id ?? undefined) !== parentId) {
          throw new Error(
            `Existing category ${handle} has a different parent`
          )
        }
      }

      if (node.children?.length) {
        await createCategoryTree(
          node.children,
          category.id,
          handle
        )
      }
    }
  }

  await createCategoryTree(categories)

  // Product Types
  const existingTypes = await listAll(skip => product.listProductTypes(
    {}, { take: 250, skip, order: { id: "ASC" } }
  ))
  const typeNames = new Set(
    existingTypes.map((t) => t.value.toLowerCase())
  )

  for (const value of productTypes) {
    if (typeNames.has(value.toLowerCase())) continue

    if (!preview) await product.createProductTypes({ value })
    typeNames.add(value.toLowerCase())
    console.log(`${preview ? "Would create" : "Created"} type: ${value}`)
  }

  // Product Tags
  const existingTags = await listAll(skip => product.listProductTags(
    {}, { take: 250, skip, order: { id: "ASC" } }
  ))
  const tagNames = new Set(
    existingTags.map((t) => t.value.toLowerCase())
  )

  for (const value of tags) {
    if (tagNames.has(value.toLowerCase())) continue

    if (!preview) await product.createProductTags({ value })
    tagNames.add(value.toLowerCase())
    console.log(`${preview ? "Would create" : "Created"} tag: ${value}`)
  }

  // Product Collections
  const existingCollections = await listAll(skip => product.listProductCollections(
    {}, { take: 250, skip, order: { id: "ASC" } }
  ))
  const collectionHandles = new Set(
    existingCollections.map((c) => c.handle)
  )

  for (const collection of collections) {
    if (collectionHandles.has(collection.handle)) continue

    if (!preview) await product.createProductCollections(collection)
    collectionHandles.add(collection.handle)
    console.log(`${preview ? "Would create" : "Created"} collection: ${collection.handle}`)
  }

  console.log(preview ? "Fashion catalog preview complete. No records changed." : "Fashion catalog setup completed. Existing records preserved; no products, variants, stock or prices created.")
}
