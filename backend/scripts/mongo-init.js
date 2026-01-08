// MongoDB Initialization Script
// Creates databases and initial collections for EcoHarvest microservices

print('🌿 Initializing EcoHarvest databases...');

// Switch to admin to create users if needed
db = db.getSiblingDB('admin');

// Create databases for each service
const databases = [
    'ecoharvest_auth',
    'ecoharvest_users',
    'ecoharvest_products',
    'ecoharvest_orders',
    'ecoharvest_carts',
    'ecoharvest_payments',
    'ecoharvest_vendors',
    'ecoharvest_notifications',
    'ecoharvest_admin',
    'ecoharvest_reviews'
];

databases.forEach(dbName => {
    db = db.getSiblingDB(dbName);

    // Create a dummy collection to ensure the database is created
    db.createCollection('_init');

    print(`✅ Created database: ${dbName}`);
});

// Create sample admin user
db = db.getSiblingDB('ecoharvest_auth');
db.users.insertOne({
    username: 'admin',
    email: 'admin@ecoharvest.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4cLMKhXQ.5x5Qs6e', // "admin123"
    role: 'Admin',
    isVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
});

print('✅ Created default admin user (admin@ecoharvest.com / admin123)');

// Create sample categories
db = db.getSiblingDB('ecoharvest_products');
db.categories.insertMany([
    { name: 'Fruits', slug: 'fruits', isActive: true, sortOrder: 1 },
    { name: 'Vegetables', slug: 'vegetables', isActive: true, sortOrder: 2 },
    { name: 'Dairy', slug: 'dairy', isActive: true, sortOrder: 3 },
    { name: 'Grains', slug: 'grains', isActive: true, sortOrder: 4 },
    { name: 'Pantry', slug: 'pantry', isActive: true, sortOrder: 5 },
    { name: 'Organic', slug: 'organic', isActive: true, sortOrder: 6 }
]);

print('✅ Created sample categories');

print('🎉 EcoHarvest database initialization complete!');
