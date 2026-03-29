import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, OrderStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const PASS = '12345678';

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // 1. CATEGORIES
  // ============================================
  console.log('📦 Creating categories...');

  const [electronics, clothing, books, homeGarden, sports, beauty, toys, food, automotive, petSupplies] =
    await Promise.all([
      prisma.category.upsert({ where: { name: 'Electronics' }, update: {}, create: { name: 'Electronics', description: 'Electronic devices and gadgets' } }),
      prisma.category.upsert({ where: { name: 'Clothing' }, update: {}, create: { name: 'Clothing', description: 'Fashion and apparel for all ages' } }),
      prisma.category.upsert({ where: { name: 'Books' }, update: {}, create: { name: 'Books', description: 'Books, e-books and educational materials' } }),
      prisma.category.upsert({ where: { name: 'Home & Garden' }, update: {}, create: { name: 'Home & Garden', description: 'Home decor and gardening supplies' } }),
      prisma.category.upsert({ where: { name: 'Sports & Outdoors' }, update: {}, create: { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' } }),
      prisma.category.upsert({ where: { name: 'Beauty & Health' }, update: {}, create: { name: 'Beauty & Health', description: 'Beauty products and health supplements' } }),
      prisma.category.upsert({ where: { name: 'Toys & Games' }, update: {}, create: { name: 'Toys & Games', description: 'Toys, games, and hobby items' } }),
      prisma.category.upsert({ where: { name: 'Food & Beverages' }, update: {}, create: { name: 'Food & Beverages', description: 'Gourmet foods and beverages' } }),
      prisma.category.upsert({ where: { name: 'Automotive' }, update: {}, create: { name: 'Automotive', description: 'Car accessories and parts' } }),
      prisma.category.upsert({ where: { name: 'Pet Supplies' }, update: {}, create: { name: 'Pet Supplies', description: 'Everything for your pets' } }),
    ]);

  console.log('✅ Created 10 categories');

  // ============================================
  // 2. USERS — ADMINS, VENDORS, CUSTOMERS
  // ============================================
  console.log('👥 Creating users...');
  const hashedPass = await bcrypt.hash(PASS, 10);

  // --- Admins ---
  const [admin1, admin2, admin3] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin1@markethub.com' },
      update: {},
      create: { name: 'Admin One', email: 'admin1@markethub.com', password: hashedPass, role: Role.ADMIN, isActive: true },
    }),
    prisma.user.upsert({
      where: { email: 'admin2@markethub.com' },
      update: {},
      create: { name: 'Admin Two', email: 'admin2@markethub.com', password: hashedPass, role: Role.ADMIN, isActive: true },
    }),
    prisma.user.upsert({
      where: { email: 'admin3@markethub.com' },
      update: {},
      create: { name: 'Admin Three', email: 'admin3@markethub.com', password: hashedPass, role: Role.ADMIN, isActive: true },
    }),
  ]);

  // --- Vendors ---
  const [vendor1, vendor2, vendor3] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'vendor1@markethub.com' },
      update: {},
      create: { name: 'Vendor One', email: 'vendor1@markethub.com', password: hashedPass, role: Role.VENDOR, isActive: true },
    }),
    prisma.user.upsert({
      where: { email: 'vendor2@markethub.com' },
      update: {},
      create: { name: 'Vendor Two', email: 'vendor2@markethub.com', password: hashedPass, role: Role.VENDOR, isActive: true },
    }),
    prisma.user.upsert({
      where: { email: 'vendor3@markethub.com' },
      update: {},
      create: { name: 'Vendor Three', email: 'vendor3@markethub.com', password: hashedPass, role: Role.VENDOR, isActive: true },
    }),
  ]);

  // --- Customers ---
  const [customer1, customer2, customer3] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'customer1@markethub.com' },
      update: {},
      create: { name: 'Customer One', email: 'customer1@markethub.com', password: hashedPass, role: Role.CUSTOMER, isActive: true },
    }),
    prisma.user.upsert({
      where: { email: 'customer2@markethub.com' },
      update: {},
      create: { name: 'Customer Two', email: 'customer2@markethub.com', password: hashedPass, role: Role.CUSTOMER, isActive: true },
    }),
    prisma.user.upsert({
      where: { email: 'customer3@markethub.com' },
      update: {},
      create: { name: 'Customer Three', email: 'customer3@markethub.com', password: hashedPass, role: Role.CUSTOMER, isActive: true },
    }),
  ]);

  console.log('✅ Created 9 users (3 admins, 3 vendors, 3 customers)');

  // ============================================
  // 3. STORES (2 per vendor = 6 total)
  // ============================================
  console.log('🏪 Creating stores...');

  const [techHaven, gadgetWorld, styleHub, urbanThreads, bookNest, knowledgeCorner,
         homeBliss, gardenPro, fitZone, outdoorKing] = await Promise.all([
    // Vendor 1 stores
    prisma.store.upsert({ where: { id: 'store-tech-haven' }, update: {}, create: { id: 'store-tech-haven', name: 'Tech Haven', description: 'Premium gadgets and the latest in consumer electronics', vendorId: vendor1.id, isActive: true } }),
    prisma.store.upsert({ where: { id: 'store-gadget-world' }, update: {}, create: { id: 'store-gadget-world', name: 'Gadget World', description: 'Affordable electronics and smart home devices', vendorId: vendor1.id, isActive: true } }),

    // Vendor 2 stores
    prisma.store.upsert({ where: { id: 'store-style-hub' }, update: {}, create: { id: 'store-style-hub', name: 'Style Hub', description: 'Trendy and affordable fashion for everyone', vendorId: vendor2.id, isActive: true } }),
    prisma.store.upsert({ where: { id: 'store-urban-threads' }, update: {}, create: { id: 'store-urban-threads', name: 'Urban Threads', description: 'Modern streetwear and urban fashion', vendorId: vendor2.id, isActive: true } }),

    // Vendor 3 stores
    prisma.store.upsert({ where: { id: 'store-book-nest' }, update: {}, create: { id: 'store-book-nest', name: 'Book Nest', description: 'A cozy collection of books across all genres', vendorId: vendor3.id, isActive: true } }),
    prisma.store.upsert({ where: { id: 'store-knowledge-corner' }, update: {}, create: { id: 'store-knowledge-corner', name: 'Knowledge Corner', description: 'Educational books, tools, and stationery', vendorId: vendor3.id, isActive: true } }),
    prisma.store.upsert({ where: { id: 'store-home-bliss' }, update: {}, create: { id: 'store-home-bliss', name: 'Home Bliss', description: 'Beautiful home decor and furniture', vendorId: vendor1.id, isActive: true } }),
    prisma.store.upsert({ where: { id: 'store-garden-pro' }, update: {}, create: { id: 'store-garden-pro', name: 'Garden Pro', description: 'Everything for your indoor and outdoor garden', vendorId: vendor2.id, isActive: true } }),
    prisma.store.upsert({ where: { id: 'store-fit-zone' }, update: {}, create: { id: 'store-fit-zone', name: 'Fit Zone', description: 'Sports gear, supplements, and activewear', vendorId: vendor3.id, isActive: true } }),
    prisma.store.upsert({ where: { id: 'store-outdoor-king' }, update: {}, create: { id: 'store-outdoor-king', name: 'Outdoor King', description: 'Camping, hiking, and outdoor adventure gear', vendorId: vendor1.id, isActive: true } }),
  ]);

  console.log('✅ Created 10 stores');

  // ============================================
  // 4. PRODUCTS
  // ============================================
  console.log('📦 Creating products...');

  // Delete existing products to avoid duplicates on re-seed
  await prisma.review.deleteMany({});
  await prisma.product.deleteMany({ where: { storeId: { in: [techHaven.id, gadgetWorld.id, styleHub.id, urbanThreads.id, bookNest.id, knowledgeCorner.id, homeBliss.id, gardenPro.id, fitZone.id, outdoorKing.id] } } });

  const products = await Promise.all([
    // === Tech Haven (Electronics) ===
    prisma.product.create({ data: { name: 'Sony WH-1000XM5 Headphones', description: 'Industry-leading noise cancelling wireless headphones with 30hr battery life.', price: 349.99, stock: 40, storeId: techHaven.id, categoryId: electronics.id, averageRating: 4.8, reviewCount: 120, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'] } }),
    prisma.product.create({ data: { name: 'Apple MacBook Air M2', description: '13.6-inch Liquid Retina display, 8GB RAM, 256GB SSD. Incredibly thin.', price: 1099.00, stock: 20, storeId: techHaven.id, categoryId: electronics.id, averageRating: 4.9, reviewCount: 87, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'] } }),
    prisma.product.create({ data: { name: 'Samsung 4K OLED TV 55"', description: '55-inch OLED 4K Smart TV with HDR10+ and built-in Alexa.', price: 1499.99, stock: 15, storeId: techHaven.id, categoryId: electronics.id, averageRating: 4.7, reviewCount: 54, images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f4e68a?w=600'] } }),
    prisma.product.create({ data: { name: 'iPad Pro 12.9" M2', description: 'Most advanced iPad with M2 chip, Liquid Retina XDR display, and 5G.', price: 1099.00, stock: 25, storeId: techHaven.id, categoryId: electronics.id, averageRating: 4.8, reviewCount: 63, images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'] } }),

    // === Gadget World (Electronics) ===
    prisma.product.create({ data: { name: 'Anker 65W USB-C Charger', description: 'Compact 65W fast charger compatible with MacBook, iPhone, and Android.', price: 34.99, stock: 200, storeId: gadgetWorld.id, categoryId: electronics.id, averageRating: 4.5, reviewCount: 310, images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600'] } }),
    prisma.product.create({ data: { name: 'Ring Video Doorbell Pro', description: 'Advanced motion detection, 1080p HD video, and two-way audio.', price: 169.99, stock: 60, storeId: gadgetWorld.id, categoryId: electronics.id, averageRating: 4.3, reviewCount: 200, images: ['https://images.unsplash.com/photo-1558002038-1055907df827?w=600'] } }),
    prisma.product.create({ data: { name: 'Logitech MX Master 3 Mouse', description: 'Advanced wireless mouse with ultra-fast scrolling and ergonomic design.', price: 99.99, stock: 80, storeId: gadgetWorld.id, categoryId: electronics.id, averageRating: 4.7, reviewCount: 155, images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600'] } }),

    // === Style Hub (Clothing) ===
    prisma.product.create({ data: { name: "Men's Classic Chino Pants", description: 'Slim-fit chinos in a range of colors, perfect for casual and office wear.', price: 49.99, stock: 150, storeId: styleHub.id, categoryId: clothing.id, averageRating: 4.2, reviewCount: 88, images: ['https://images.unsplash.com/photo-1626497764746-6dc36546b388?w=600'] } }),
    prisma.product.create({ data: { name: "Women's Floral Midi Dress", description: 'Lightweight floral dress with V-neckline, perfect for summer.', price: 39.99, stock: 120, storeId: styleHub.id, categoryId: clothing.id, averageRating: 4.6, reviewCount: 142, images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'] } }),
    prisma.product.create({ data: { name: 'Unisex Zip-Up Hoodie', description: 'Fleece-lined zip hoodie, available in 8 colors. Great for layering.', price: 44.99, stock: 200, storeId: styleHub.id, categoryId: clothing.id, averageRating: 4.4, reviewCount: 97, images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600'] } }),

    // === Urban Threads (Clothing) ===
    prisma.product.create({ data: { name: 'Cargo Jogger Pants', description: 'Comfortable cargo joggers with multiple pockets, perfect for streetwear.', price: 54.99, stock: 90, storeId: urbanThreads.id, categoryId: clothing.id, averageRating: 4.3, reviewCount: 73, images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600'] } }),
    prisma.product.create({ data: { name: 'Oversized Graphic Tee', description: 'Premium cotton oversized tee with unique graphic prints. Unisex sizing.', price: 24.99, stock: 300, storeId: urbanThreads.id, categoryId: clothing.id, averageRating: 4.5, reviewCount: 210, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'] } }),

    // === Book Nest (Books) ===
    prisma.product.create({ data: { name: 'Atomic Habits - James Clear', description: 'An easy & proven way to build good habits & break bad ones. Bestseller.', price: 14.99, stock: 500, storeId: bookNest.id, categoryId: books.id, averageRating: 4.9, reviewCount: 892, images: ['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600'] } }),
    prisma.product.create({ data: { name: 'The Psychology of Money', description: 'Timeless lessons on wealth, greed, and happiness by Morgan Housel.', price: 12.99, stock: 400, storeId: bookNest.id, categoryId: books.id, averageRating: 4.8, reviewCount: 650, images: ['https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600'] } }),
    prisma.product.create({ data: { name: 'Deep Work - Cal Newport', description: 'Rules for focused success in a distracted world.', price: 13.99, stock: 350, storeId: bookNest.id, categoryId: books.id, averageRating: 4.7, reviewCount: 430, images: ['https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600'] } }),

    // === Knowledge Corner (Books + misc) ===
    prisma.product.create({ data: { name: 'Clean Code - Robert C. Martin', description: 'A handbook of agile software craftsmanship. Essential for developers.', price: 34.99, stock: 100, storeId: knowledgeCorner.id, categoryId: books.id, averageRating: 4.8, reviewCount: 320, images: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600'] } }),
    prisma.product.create({ data: { name: 'Premium Sketchbook A4', description: '200-page thick paper sketchbook ideal for pencil, ink, and watercolour.', price: 18.99, stock: 250, storeId: knowledgeCorner.id, categoryId: books.id, averageRating: 4.4, reviewCount: 190, images: ['https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=600'] } }),

    // === Home Bliss (Home & Garden) ===
    prisma.product.create({ data: { name: 'Scented Soy Wax Candle Set', description: 'Set of 4 hand-poured soy wax candles in lavender, vanilla, cedar, and citrus.', price: 29.99, stock: 180, storeId: homeBliss.id, categoryId: homeGarden.id, averageRating: 4.7, reviewCount: 240, images: ['https://images.unsplash.com/photo-1592492152545-9695d3f473f4?w=600'] } }),
    prisma.product.create({ data: { name: 'Minimalist Wall Clock', description: 'Silent sweep movement wall clock in matte black — 30cm diameter.', price: 22.99, stock: 90, storeId: homeBliss.id, categoryId: homeGarden.id, averageRating: 4.5, reviewCount: 175, images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'] } }),
    prisma.product.create({ data: { name: 'Ceramic Plant Pot Set (3pc)', description: 'Set of 3 matte ceramic plant pots with drainage holes and bamboo trays.', price: 32.99, stock: 130, storeId: homeBliss.id, categoryId: homeGarden.id, averageRating: 4.6, reviewCount: 220, images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600'] } }),

    // === Garden Pro (Home & Garden) ===
    prisma.product.create({ data: { name: 'Stainless Steel Garden Tool Set', description: '5-piece ergonomic stainless steel garden tool set with storage bag.', price: 39.99, stock: 75, storeId: gardenPro.id, categoryId: homeGarden.id, averageRating: 4.4, reviewCount: 118, images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600'] } }),
    prisma.product.create({ data: { name: 'Self-Watering Herb Planter', description: 'Indoor herb planter with built-in water reservoir. Grow basil, mint, and more.', price: 27.99, stock: 110, storeId: gardenPro.id, categoryId: homeGarden.id, averageRating: 4.5, reviewCount: 93, images: ['https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600'] } }),

    // === Fit Zone (Sports) ===
    prisma.product.create({ data: { name: 'Adjustable Dumbbell Set 5-50lbs', description: 'Space-saving adjustable dumbbells with quick-change dial system.', price: 299.99, stock: 35, storeId: fitZone.id, categoryId: sports.id, averageRating: 4.8, reviewCount: 402, images: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600'] } }),
    prisma.product.create({ data: { name: 'Yoga Mat Premium 6mm', description: 'Non-slip, extra thick yoga mat with alignment lines. Includes carry strap.', price: 39.99, stock: 200, storeId: fitZone.id, categoryId: sports.id, averageRating: 4.6, reviewCount: 335, images: ['https://images.unsplash.com/photo-1601925228086-f5f77c37e3c4?w=600'] } }),
    prisma.product.create({ data: { name: 'Resistance Bands Set (5 levels)', description: 'Set of 5 heavy-duty resistance bands for strength training and rehab.', price: 24.99, stock: 250, storeId: fitZone.id, categoryId: sports.id, averageRating: 4.5, reviewCount: 510, images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600'] } }),

    // === Outdoor King (Sports & Outdoors) ===
    prisma.product.create({ data: { name: '4-Person Camping Tent', description: 'Waterproof 4-season tent with easy setup and UV-resistant rainfly.', price: 189.99, stock: 45, storeId: outdoorKing.id, categoryId: sports.id, averageRating: 4.7, reviewCount: 168, images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600'] } }),
    prisma.product.create({ data: { name: 'Hiking Backpack 50L', description: 'Lightweight 50L hiking pack with rain cover, hydration sleeve, and sternum strap.', price: 129.99, stock: 60, storeId: outdoorKing.id, categoryId: sports.id, averageRating: 4.6, reviewCount: 207, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'] } }),
    prisma.product.create({ data: { name: 'Portable Camping Stove', description: 'Compact propane camping stove with windscreen and carrying case.', price: 54.99, stock: 80, storeId: outdoorKing.id, categoryId: sports.id, averageRating: 4.4, reviewCount: 144, images: ['https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=600'] } }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // ============================================
  // 5. REVIEWS
  // ============================================
  console.log('⭐ Creating reviews...');

  const reviewData = [
    { userId: customer1.id, productId: products[0].id, rating: 5, comment: 'Incredible noise cancellation, best headphones I have ever owned!' },
    { userId: customer2.id, productId: products[0].id, rating: 5, comment: 'Worth every penny. Sound quality is phenomenal.' },
    { userId: customer3.id, productId: products[0].id, rating: 4, comment: 'Great headphones but a little tight on my head.' },
    { userId: customer1.id, productId: products[1].id, rating: 5, comment: 'Battery life is insane and the screen is gorgeous.' },
    { userId: customer2.id, productId: products[1].id, rating: 5, comment: 'Best laptop I have ever used. Silent and fast.' },
    { userId: customer3.id, productId: products[4].id, rating: 4, comment: 'Charges my MacBook fast! Great compact form factor.' },
    { userId: customer1.id, productId: products[8].id, rating: 5, comment: 'Such a pretty dress and the fabric is so soft.' },
    { userId: customer2.id, productId: products[11].id, rating: 5, comment: 'Atomic Habits changed my life. Must read!' },
    { userId: customer3.id, productId: products[11].id, rating: 5, comment: 'Practical, well-written, life-changing advice.' },
    { userId: customer1.id, productId: products[12].id, rating: 5, comment: 'Best personal finance book ever written.' },
    { userId: customer2.id, productId: products[19].id, rating: 5, comment: 'These dumbbells replaced an entire rack. Love them!' },
    { userId: customer3.id, productId: products[20].id, rating: 4, comment: 'Good thickness and grip, great for hot yoga.' },
    { userId: customer1.id, productId: products[22].id, rating: 5, comment: 'Easy to pitch and survived heavy rain. Very impressed.' },
    { userId: customer2.id, productId: products[16].id, rating: 5, comment: 'Candles smell amazing, great gift idea.' },
    { userId: customer3.id, productId: products[15].id, rating: 5, comment: 'Really clean code book, every dev should read this.' },
  ];

  await Promise.all(
    reviewData.map((r) =>
      prisma.review.upsert({
        where: { userId_productId: { userId: r.userId, productId: r.productId } },
        update: {},
        create: r,
      }),
    ),
  );

  console.log(`✅ Created ${reviewData.length} reviews`);

  // ============================================
  // 6. ORDERS (with items and payments)
  // ============================================
  console.log('🛒 Creating orders...');

  const shippingAddr1 = { street: '123 Main St', city: 'New York', state: 'NY', zip: '10001', country: 'USA' };
  const shippingAddr2 = { street: '456 Park Ave', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'USA' };
  const shippingAddr3 = { street: '789 Lake Rd', city: 'Chicago', state: 'IL', zip: '60601', country: 'USA' };

  const order1 = await prisma.order.create({
    data: {
      totalAmount: 349.99 + 1099.00,
      status: OrderStatus.DELIVERED,
      customerId: customer1.id,
      shippingAddress: shippingAddr1,
      items: {
        create: [
          { quantity: 1, price: 349.99, subtotal: 349.99, productId: products[0].id, storeId: techHaven.id, storeName: techHaven.name },
          { quantity: 1, price: 1099.00, subtotal: 1099.00, productId: products[1].id, storeId: techHaven.id, storeName: techHaven.name },
        ],
      },
      payment: {
        create: { amount: 349.99 + 1099.00, currency: 'usd', status: PaymentStatus.SUCCEEDED, stripePaymentIntentId: 'pi_seed_001' },
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      totalAmount: 49.99 + 39.99,
      status: OrderStatus.SHIPPED,
      customerId: customer2.id,
      shippingAddress: shippingAddr2,
      items: {
        create: [
          { quantity: 1, price: 49.99, subtotal: 49.99, productId: products[7].id, storeId: styleHub.id, storeName: styleHub.name },
          { quantity: 1, price: 39.99, subtotal: 39.99, productId: products[8].id, storeId: styleHub.id, storeName: styleHub.name },
        ],
      },
      payment: {
        create: { amount: 89.98, currency: 'usd', status: PaymentStatus.SUCCEEDED, stripePaymentIntentId: 'pi_seed_002' },
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      totalAmount: 14.99 + 12.99 + 13.99,
      status: OrderStatus.PROCESSING,
      customerId: customer3.id,
      shippingAddress: shippingAddr3,
      items: {
        create: [
          { quantity: 1, price: 14.99, subtotal: 14.99, productId: products[11].id, storeId: bookNest.id, storeName: bookNest.name },
          { quantity: 1, price: 12.99, subtotal: 12.99, productId: products[12].id, storeId: bookNest.id, storeName: bookNest.name },
          { quantity: 1, price: 13.99, subtotal: 13.99, productId: products[13].id, storeId: bookNest.id, storeName: bookNest.name },
        ],
      },
      payment: {
        create: { amount: 41.97, currency: 'usd', status: PaymentStatus.SUCCEEDED, stripePaymentIntentId: 'pi_seed_003' },
      },
    },
  });

  const order4 = await prisma.order.create({
    data: {
      totalAmount: 299.99 + 39.99,
      status: OrderStatus.PAID,
      customerId: customer1.id,
      shippingAddress: shippingAddr1,
      items: {
        create: [
          { quantity: 1, price: 299.99, subtotal: 299.99, productId: products[19].id, storeId: fitZone.id, storeName: fitZone.name },
          { quantity: 2, price: 39.99, subtotal: 79.98, productId: products[20].id, storeId: fitZone.id, storeName: fitZone.name },
        ],
      },
      payment: {
        create: { amount: 379.97, currency: 'usd', status: PaymentStatus.SUCCEEDED, stripePaymentIntentId: 'pi_seed_004' },
      },
    },
  });

  const order5 = await prisma.order.create({
    data: {
      totalAmount: 189.99 + 129.99,
      status: OrderStatus.PENDING,
      customerId: customer2.id,
      shippingAddress: shippingAddr2,
      items: {
        create: [
          { quantity: 1, price: 189.99, subtotal: 189.99, productId: products[22].id, storeId: outdoorKing.id, storeName: outdoorKing.name },
          { quantity: 1, price: 129.99, subtotal: 129.99, productId: products[23].id, storeId: outdoorKing.id, storeName: outdoorKing.name },
        ],
      },
      payment: {
        create: { amount: 319.98, currency: 'usd', status: PaymentStatus.PENDING },
      },
    },
  });

  console.log('✅ Created 5 orders with payments');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log('   Categories : 10');
  console.log('   Users      : 9  (3 admins, 3 vendors, 3 customers)');
  console.log('   Stores     : 10');
  console.log(`   Products   : ${products.length}`);
  console.log(`   Reviews    : ${reviewData.length}`);
  console.log('   Orders     : 5');
  console.log('\n🔐 All passwords: 12345678\n');
  console.log('   ADMINS');
  console.log('   ├─ admin1@markethub.com');
  console.log('   ├─ admin2@markethub.com');
  console.log('   └─ admin3@markethub.com');
  console.log('\n   VENDORS');
  console.log('   ├─ vendor1@markethub.com  → Tech Haven, Gadget World, Home Bliss, Outdoor King');
  console.log('   ├─ vendor2@markethub.com  → Style Hub, Urban Threads, Garden Pro');
  console.log('   └─ vendor3@markethub.com  → Book Nest, Knowledge Corner, Fit Zone');
  console.log('\n   CUSTOMERS');
  console.log('   ├─ customer1@markethub.com');
  console.log('   ├─ customer2@markethub.com');
  console.log('   └─ customer3@markethub.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
