import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // 1. CREATE CATEGORIES
  // ============================================
  console.log('📦 Creating categories...');

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Clothing' },
      update: {},
      create: {
        name: 'Clothing',
        description: 'Fashion and apparel',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Books' },
      update: {},
      create: {
        name: 'Books',
        description: 'Books and educational materials',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Home & Garden' },
      update: {},
      create: {
        name: 'Home & Garden',
        description: 'Home decor and gardening supplies',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Sports & Outdoors' },
      update: {},
      create: {
        name: 'Sports & Outdoors',
        description: 'Sports equipment and outdoor gear',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Beauty & Health' },
      update: {},
      create: {
        name: 'Beauty & Health',
        description: 'Beauty products and health supplements',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Toys & Games' },
      update: {},
      create: {
        name: 'Toys & Games',
        description: 'Toys, games, and hobby items',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Food & Beverages' },
      update: {},
      create: {
        name: 'Food & Beverages',
        description: 'Gourmet foods and beverages',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // ============================================
  // 2. CREATE TEST USERS (OPTIONAL)
  // ============================================
  console.log('👥 Creating test users...');

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@marketplace.com',
      password: await bcrypt.hash('admin123', 10),
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // Vendor user
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@marketplace.com' },
    update: {},
    create: {
      name: 'Test Vendor',
      email: 'vendor@marketplace.com',
      password: await bcrypt.hash('vendor123', 10),
      role: Role.VENDOR,
      isActive: true,
    },
  });

  // Customer user
  const customer = await prisma.user.upsert({
    where: { email: 'customer@marketplace.com' },
    update: {},
    create: {
      name: 'Test Customer',
      email: 'customer@marketplace.com',
      password: await bcrypt.hash('customer123', 10),
      role: Role.CUSTOMER,
      isActive: true,
    },
  });

  console.log('✅ Created test users:');
  console.log(`   - Admin: admin@marketplace.com / admin123`);
  console.log(`   - Vendor: vendor@marketplace.com / vendor123`);
  console.log(`   - Customer: customer@marketplace.com / customer123`);

  // ============================================
  // 3. CREATE TEST STORE (OPTIONAL)
  // ============================================
  console.log('🏪 Creating test store...');

  const store = await prisma.store.upsert({
    where: { id: 'test-store-id' },
    update: {},
    create: {
      id: 'test-store-id',
      name: 'Tech Haven',
      description: 'Your one-stop shop for all things tech',
      vendorId: vendor.id,
      isActive: true,
    },
  });

  console.log(`✅ Created store: ${store.name}`);

  // ============================================
  // 4. CREATE SAMPLE PRODUCTS (OPTIONAL)
  // ============================================
  console.log('📦 Creating sample products...');

  const sampleProducts = [
    {
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling wireless headphones',
      price: 199.99,
      stock: 50,
      categoryId: categories.find((c) => c.name === 'Electronics')?.id,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      ],
    },
    {
      name: 'Smart Watch',
      description: 'Fitness tracking smartwatch with heart rate monitor',
      price: 299.99,
      stock: 30,
      categoryId: categories.find((c) => c.name === 'Electronics')?.id,
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      ],
    },
    {
      name: 'Laptop Backpack',
      description: 'Durable laptop backpack with USB charging port',
      price: 49.99,
      stock: 100,
      categoryId: categories.find((c) => c.name === 'Home & Garden')?.id,
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
      ],
    },
  ];

  for (const productData of sampleProducts) {
    await prisma.product.create({
      data: {
        ...productData,
        storeId: store.id,
      },
    });
  }

  console.log(`✅ Created ${sampleProducts.length} sample products`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Users: 3 (admin, vendor, customer)`);
  console.log(`   - Stores: 1`);
  console.log(`   - Products: ${sampleProducts.length}`);
  console.log('\n🔐 Test Credentials:');
  console.log('   Admin:    admin@marketplace.com / admin123');
  console.log('   Vendor:   vendor@marketplace.com / vendor123');
  console.log('   Customer: customer@marketplace.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
