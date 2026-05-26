// GENZURA - Database Seed Script
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GENZURA database...');

  // ── Admin User ──────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@genzura.com' },
    update: {},
    create: {
      fullName: 'GENZURA Admin',
      email: 'admin@genzura.com',
      password: hashedPassword,
      whatsappNumber: '+250700000000',
      preferredLang: 'en',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@genzura.com' },
    update: {},
    create: {
      fullName: 'Stock Manager',
      email: 'manager@genzura.com',
      password: await bcrypt.hash('Manager@123', 12),
      whatsappNumber: '+250700000001',
      preferredLang: 'en',
      role: 'STOCK_MANAGER',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@genzura.com' },
    update: {},
    create: {
      fullName: 'Staff Member',
      email: 'staff@genzura.com',
      password: await bcrypt.hash('Staff@123', 12),
      whatsappNumber: '+250700000002',
      preferredLang: 'rw',
      role: 'STAFF',
    },
  });

  console.log('✅ Users created');

  // ── Categories ──────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: { name: 'Beverages', description: 'Drinks and beverages', color: '#3b82f6' },
    }),
    prisma.category.upsert({
      where: { name: 'Food & Groceries' },
      update: {},
      create: { name: 'Food & Groceries', description: 'Food items', color: '#22c55e' },
    }),
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: { name: 'Electronics', description: 'Electronic devices', color: '#f59e0b' },
    }),
    prisma.category.upsert({
      where: { name: 'Stationery' },
      update: {},
      create: { name: 'Stationery', description: 'Office and school supplies', color: '#8b5cf6' },
    }),
    prisma.category.upsert({
      where: { name: 'Cleaning Supplies' },
      update: {},
      create: { name: 'Cleaning Supplies', description: 'Cleaning products', color: '#06b6d4' },
    }),
  ]);

  console.log('✅ Categories created');

  // ── Stores ──────────────────────────────────────────────────
  const store1 = await prisma.store.upsert({
    where: { id: 'store-kigali-main' },
    update: {},
    create: {
      id: 'store-kigali-main',
      name: 'Kigali Main Store',
      category: 'Retail',
      location: 'Kigali, Rwanda',
      description: 'Main flagship store in Kigali',
      managerId: manager.id,
    },
  });

  const store2 = await prisma.store.upsert({
    where: { id: 'store-musanze' },
    update: {},
    create: {
      id: 'store-musanze',
      name: 'Musanze Branch',
      category: 'Retail',
      location: 'Musanze, Rwanda',
      description: 'Northern province branch',
      managerId: manager.id,
    },
  });

  console.log('✅ Stores created');

  // ── Products ────────────────────────────────────────────────
  const products = [
    {
      name: 'Coca Cola 50cl',
      sku: 'BEV-001',
      barcode: '5000112637922',
      quantity: 3,
      minimumStock: 10,
      unitPrice: 500,
      sellingPrice: 700,
      supplier: 'Bralirwa',
      categoryId: categories[0].id,
      storeId: store1.id,
    },
    {
      name: 'Fanta Orange 50cl',
      sku: 'BEV-002',
      barcode: '5000112637923',
      quantity: 25,
      minimumStock: 15,
      unitPrice: 500,
      sellingPrice: 700,
      supplier: 'Bralirwa',
      categoryId: categories[0].id,
      storeId: store1.id,
    },
    {
      name: 'Mineral Water 1.5L',
      sku: 'BEV-003',
      barcode: '5000112637924',
      quantity: 8,
      minimumStock: 20,
      unitPrice: 300,
      sellingPrice: 500,
      supplier: 'Inyange',
      categoryId: categories[0].id,
      storeId: store1.id,
    },
    {
      name: 'Rice 5kg',
      sku: 'FOOD-001',
      barcode: '5000112637925',
      quantity: 50,
      minimumStock: 20,
      unitPrice: 4500,
      sellingPrice: 5500,
      supplier: 'Local Supplier',
      categoryId: categories[1].id,
      storeId: store1.id,
    },
    {
      name: 'Sugar 1kg',
      sku: 'FOOD-002',
      barcode: '5000112637926',
      quantity: 5,
      minimumStock: 15,
      unitPrice: 1200,
      sellingPrice: 1500,
      supplier: 'SONARWA',
      categoryId: categories[1].id,
      storeId: store1.id,
    },
    {
      name: 'A4 Paper Ream',
      sku: 'STAT-001',
      barcode: '5000112637927',
      quantity: 30,
      minimumStock: 10,
      unitPrice: 3500,
      sellingPrice: 4500,
      supplier: 'Office Depot',
      categoryId: categories[3].id,
      storeId: store2.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log('✅ Products created');

  // ── Sample Transactions ─────────────────────────────────────
  const cocaCola = await prisma.product.findUnique({ where: { sku: 'BEV-001' } });
  if (cocaCola) {
    await prisma.stockTransaction.create({
      data: {
        productId: cocaCola.id,
        type: 'IN',
        quantity: 50,
        previousQty: 0,
        newQty: 50,
        notes: 'Initial stock',
        performedById: admin.id,
        referenceNo: 'TXN-SEED-001',
      },
    });
    await prisma.stockTransaction.create({
      data: {
        productId: cocaCola.id,
        type: 'OUT',
        quantity: 47,
        previousQty: 50,
        newQty: 3,
        notes: 'Sales',
        performedById: staff.id,
        referenceNo: 'TXN-SEED-002',
      },
    });
  }

  console.log('✅ Sample transactions created');
  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:   admin@genzura.com   / Admin@123');
  console.log('   Manager: manager@genzura.com / Manager@123');
  console.log('   Staff:   staff@genzura.com   / Staff@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
