// Seed script for the Campus Lending Hub Supabase database.
//
// Usage:
//   npm run seed
//
// Reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from
// .env.local (via Node's built-in --env-file flag, see package.json) and
// inserts sample users, items, and borrow requests using the same public
// anon client the app uses. Safe to re-run: every insert first checks
// whether the row already exists and skips it if so.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "Make sure .env.local is populated and run this script with:\n" +
      "  npm run seed"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORIES = ["Book", "Lab Equipment", "Electronics", "Stationery"];

const USERS = [
  {
    full_name: "Ava Thompson",
    campus_email: "ava.thompson@campus.edu",
    department: "Computer Science",
  },
  {
    full_name: "Liam Patel",
    campus_email: "liam.patel@campus.edu",
    department: "Mechanical Engineering",
  },
  {
    full_name: "Noah Kim",
    campus_email: "noah.kim@campus.edu",
    department: "Biology",
  },
  {
    full_name: "Maya Rodriguez",
    campus_email: "maya.rodriguez@campus.edu",
    department: "Electrical Engineering",
  },
  {
    full_name: "Sofia Nguyen",
    campus_email: "sofia.nguyen@campus.edu",
    department: "Business Administration",
  },
];

const ITEMS = [
  {
    owner_email: "ava.thompson@campus.edu",
    title: "Introduction to Algorithms (CLRS)",
    category_name: "Book",
    description: "Hardcover 3rd edition, lightly highlighted.",
    status: "Available",
  },
  {
    owner_email: "ava.thompson@campus.edu",
    title: "TI-84 Plus Graphing Calculator",
    category_name: "Electronics",
    description: "Great battery life, comes with charging cable.",
    status: "Available",
  },
  {
    owner_email: "liam.patel@campus.edu",
    title: "Digital Oscilloscope",
    category_name: "Lab Equipment",
    description: "2-channel, 70MHz, ideal for EE lab coursework.",
    status: "Available",
  },
  {
    owner_email: "liam.patel@campus.edu",
    title: "Mechanical Drafting Kit",
    category_name: "Stationery",
    description: "Full set of drafting tools and compasses.",
    status: "Available",
  },
  {
    owner_email: "noah.kim@campus.edu",
    title: "Campbell Biology (12th Edition)",
    category_name: "Book",
    description: "Used one semester, no writing inside.",
    status: "Available",
  },
  {
    owner_email: "noah.kim@campus.edu",
    title: "Digital Microscope Camera",
    category_name: "Lab Equipment",
    description: "USB microscope camera, 1000x zoom.",
    status: "Available",
  },
  {
    owner_email: "maya.rodriguez@campus.edu",
    title: "Soldering Iron Kit",
    category_name: "Electronics",
    description: "Includes stand, solder wire, and tips.",
    status: "Available",
  },
  {
    owner_email: "maya.rodriguez@campus.edu",
    title: "Arduino Starter Kit",
    category_name: "Electronics",
    description: "Uno R3 board with sensors and breadboard.",
    status: "Borrowed",
  },
  {
    owner_email: "sofia.nguyen@campus.edu",
    title: "Scientific Calculator (Casio FX-991)",
    category_name: "Electronics",
    description: "Non-graphing, approved for most exams.",
    status: "Available",
  },
  {
    owner_email: "sofia.nguyen@campus.edu",
    title: "Principles of Marketing Textbook",
    category_name: "Book",
    description: "8th edition, minor wear on cover.",
    status: "Available",
  },
  {
    owner_email: "ava.thompson@campus.edu",
    title: "Mechanical Pencil Set",
    category_name: "Stationery",
    description: "Pack of 5, assorted lead sizes.",
    status: "Available",
  },
  {
    owner_email: "liam.patel@campus.edu",
    title: "Digital Calipers",
    category_name: "Lab Equipment",
    description: "Stainless steel, 0-150mm range.",
    status: "Pending",
  },
];

const BORROW_REQUESTS = [
  {
    item_title: "Digital Calipers",
    borrower_email: "noah.kim@campus.edu",
    status: "Pending",
  },
  {
    item_title: "Arduino Starter Kit",
    borrower_email: "sofia.nguyen@campus.edu",
    status: "Approved",
  },
];

async function seedCategories() {
  const { error } = await supabase
    .from("categories")
    .upsert(
      CATEGORIES.map((category_name) => ({ category_name })),
      { onConflict: "category_name", ignoreDuplicates: true }
    );

  if (error) throw new Error(`Seeding categories failed: ${error.message}`);
  console.log(`Categories ready (${CATEGORIES.length}).`);
}

async function seedUsers() {
  const { error } = await supabase
    .from("users")
    .upsert(USERS, { onConflict: "campus_email", ignoreDuplicates: true });

  if (error) throw new Error(`Seeding users failed: ${error.message}`);
  console.log(`Users ready (${USERS.length}).`);
}

async function getLookupMaps() {
  const [
    { data: users, error: usersError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase.from("users").select("user_id, campus_email"),
    supabase.from("categories").select("category_id, category_name"),
  ]);

  if (usersError) throw new Error(`Fetching users failed: ${usersError.message}`);
  if (categoriesError)
    throw new Error(`Fetching categories failed: ${categoriesError.message}`);

  const userIdByEmail = new Map(users.map((u) => [u.campus_email, u.user_id]));
  const categoryIdByName = new Map(
    categories.map((c) => [c.category_name, c.category_id])
  );

  return { userIdByEmail, categoryIdByName };
}

async function seedItems(userIdByEmail, categoryIdByName) {
  const { data: existingItems, error: existingError } = await supabase
    .from("items")
    .select("item_id, title, owner_id");

  if (existingError)
    throw new Error(`Fetching existing items failed: ${existingError.message}`);

  const existingKey = new Set(
    existingItems.map((i) => `${i.title}::${i.owner_id}`)
  );

  const rowsToInsert = ITEMS.filter((item) => {
    const ownerId = userIdByEmail.get(item.owner_email);
    return ownerId && !existingKey.has(`${item.title}::${ownerId}`);
  }).map((item) => ({
    owner_id: userIdByEmail.get(item.owner_email),
    title: item.title,
    category_id: categoryIdByName.get(item.category_name),
    description: item.description,
    status: item.status,
  }));

  if (rowsToInsert.length === 0) {
    console.log("Items already seeded, nothing to insert.");
    return;
  }

  const { error } = await supabase.from("items").insert(rowsToInsert);
  if (error) throw new Error(`Seeding items failed: ${error.message}`);
  console.log(`Inserted ${rowsToInsert.length} new item(s).`);
}

async function seedBorrowRequests(userIdByEmail) {
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("item_id, title");

  if (itemsError) throw new Error(`Fetching items failed: ${itemsError.message}`);

  const itemIdByTitle = new Map(items.map((i) => [i.title, i.item_id]));

  const { data: existingRequests, error: existingError } = await supabase
    .from("borrow_requests")
    .select("item_id, borrower_id");

  if (existingError)
    throw new Error(
      `Fetching existing borrow requests failed: ${existingError.message}`
    );

  const existingKey = new Set(
    existingRequests.map((r) => `${r.item_id}::${r.borrower_id}`)
  );

  const rowsToInsert = BORROW_REQUESTS.filter((req) => {
    const itemId = itemIdByTitle.get(req.item_title);
    const borrowerId = userIdByEmail.get(req.borrower_email);
    return (
      itemId && borrowerId && !existingKey.has(`${itemId}::${borrowerId}`)
    );
  }).map((req) => ({
    item_id: itemIdByTitle.get(req.item_title),
    borrower_id: userIdByEmail.get(req.borrower_email),
    status: req.status,
  }));

  if (rowsToInsert.length === 0) {
    console.log("Borrow requests already seeded, nothing to insert.");
    return;
  }

  const { error } = await supabase
    .from("borrow_requests")
    .insert(rowsToInsert);
  if (error)
    throw new Error(`Seeding borrow requests failed: ${error.message}`);
  console.log(`Inserted ${rowsToInsert.length} new borrow request(s).`);
}

async function main() {
  console.log(`Seeding Supabase project at ${supabaseUrl} ...`);

  await seedCategories();
  await seedUsers();

  const { userIdByEmail, categoryIdByName } = await getLookupMaps();

  await seedItems(userIdByEmail, categoryIdByName);
  await seedBorrowRequests(userIdByEmail);

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
