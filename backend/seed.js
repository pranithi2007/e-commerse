/**
 * Database Seeder Script
 * Run with: npm run seed
 * Populates products, demo users (admin & customer),
 * and sample orders in different DFA states.
 */

require('dotenv').config();

const { connectDB, isMongoConnected } = require('./src/config/db');

const {
    saveStore,
    getLocalStore
} = require('./src/models');

const {
    initialProducts,
    getSeedUsers,
    getSampleOrders
} = require('./src/config/seedData');

const MongoUser = require('./src/models/mongoose/User');
const MongoProduct = require('./src/models/mongoose/Product');
const MongoOrder = require('./src/models/mongoose/Order');


/**
 * Remove custom IDs before inserting into MongoDB.
 * MongoDB will automatically generate valid ObjectIds.
 */
function removeCustomId(document) {
    if (Array.isArray(document)) {
        return document.map(removeCustomId);
    }

    if (document && typeof document === 'object') {
        const sanitized = {};

        Object.entries(document).forEach(([key, value]) => {
            if (key === '_id') return;
            sanitized[key] = value && typeof value === 'object' ? removeCustomId(value) : value;
        });

        return sanitized;
    }

    return document;
}


async function seedDatabase() {

    console.log('--- Initializing Database Seeding ---');

    await connectDB();

    try {

        const seedUsers = await getSeedUsers();

        if (isMongoConnected()) {

            console.log('[Seed] Seeding live MongoDB...');

            // Clear existing collections
            await MongoUser.deleteMany({});
            await MongoProduct.deleteMany({});
            await MongoOrder.deleteMany({});

            // Remove invalid custom IDs
            const mongoUsers = seedUsers.map(removeCustomId);
            const mongoProducts = initialProducts.map(removeCustomId);

            // Insert users with automatic MongoDB ObjectIds
            const createdUsers = await MongoUser.insertMany(mongoUsers);

            console.log(
                `[Seed] Seeded ${createdUsers.length} users in MongoDB.`
            );

            // Insert products with automatic MongoDB ObjectIds
            const createdProducts = await MongoProduct.insertMany(mongoProducts);

            console.log(
                `[Seed] Seeded ${createdProducts.length} products in MongoDB.`
            );

            // Find customer using newly generated MongoDB ID
            const customerUser = createdUsers.find(
                user => user.role === 'customer'
            );

            if (!customerUser) {
                throw new Error('Customer user not found.');
            }

            // Generate sample orders
            const sampleOrders = getSampleOrders(
                customerUser,
                createdProducts
            );

            // Remove invalid custom IDs before inserting into MongoDB
            const mongoOrders = removeCustomId(sampleOrders);

            // Insert sample orders
            const createdOrders = await MongoOrder.insertMany(mongoOrders);

            console.log(
                `[Seed] Seeded ${createdOrders.length} orders in MongoDB.`
            );

        } else {

            console.log('[Seed] Seeding Local Persistent JSON Store...');

            const store = getLocalStore();

            store.users = [...seedUsers];

            store.products = initialProducts.map((p, idx) => ({
                _id: 'prod_' + (idx + 1).toString().padStart(3, '0'),
                ...p,
                createdAt: new Date().toISOString()
            }));

            const customerUser = store.users.find(
                user => user.role === 'customer'
            );

            if (!customerUser) {
                throw new Error('Customer user not found.');
            }

            const sampleOrders = getSampleOrders(
                customerUser,
                store.products
            );

            store.orders = [...sampleOrders];

            saveStore();

            console.log(
                `[Seed] Successfully seeded ${store.users.length} users, ` +
                `${store.products.length} products, and ` +
                `${store.orders.length} orders to local JSON store.`
            );
        }

        console.log('\n=============================================================');
        console.log('       SEEDING COMPLETED SUCCESSFULLY!');
        console.log('=============================================================');

        console.log('Demo Credentials:');

        console.log('Admin:    admin@dfamall.com / admin123');
        console.log('Customer: customer@dfamall.com / customer123');

        console.log('=============================================================\n');

    } catch (err) {

        console.error('[Seed] Error during seeding:', err);

        throw err;
    }
}


// Run Seeder
if (require.main === module) {

    seedDatabase()
        .then(() => {
            process.exit(0);
        })
        .catch(() => {
            process.exit(1);
        });

}

module.exports = seedDatabase;