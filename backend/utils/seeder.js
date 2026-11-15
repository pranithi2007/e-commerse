require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const TransitionHistory = require('../models/TransitionHistory');
const NetworkLog = require('../models/NetworkLog');
const { sampleProducts } = require('./seedData');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce_dfa';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB at:', mongoUri);

    // Drop entire database to remove any legacy indexes
    await mongoose.connection.db.dropDatabase();
    console.log('[Seeder] Dropped existing ecommerce_dfa database and legacy indexes.');

    // Create Admin and Customer accounts
    // Passwords will be hashed automatically by User pre-save hook
    const adminUser = await User.create({
      name: 'Dr. Turing (Administrator)',
      email: 'admin@dfamall.com',
      password: 'Admin@123',
      role: 'admin'
    });

    const customerUser = await User.create({
      name: 'Ada Lovelace (Customer)',
      email: 'customer@dfamall.com',
      password: 'Customer@123',
      role: 'customer'
    });

    console.log(`[Seeder] Created Admin: ${adminUser.email} (Password: Admin@123)`);
    console.log(`[Seeder] Created Customer: ${customerUser.email} (Password: Customer@123)`);

    // Insert Products
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`[Seeder] Inserted ${createdProducts.length} sample products.`);

    // Create Initial Sample Orders in various DFA states
    // 1. Order in S0 (Order Placed)
    const orderS0 = await Order.create({
      userId: customerUser._id,
      products: [
        {
          product: createdProducts[0]._id,
          name: createdProducts[0].name,
          price: createdProducts[0].price,
          quantity: 1,
          image: createdProducts[0].image
        }
      ],
      totalAmount: 199.99,
      deliveryAddress: {
        fullName: 'Ada Lovelace',
        address: '12 Automata Lane, Computing Park',
        city: 'Bengaluru',
        postalCode: '560001',
        country: 'India',
        phone: '+91 9876543210'
      },
      paymentMethod: 'Simulated UPI Payment (Google Pay / PhonePe)',
      paymentStatus: 'Completed',
      currentStatus: { code: 'S0', name: 'Order Placed' },
      transitionHistory: [
        {
          previousState: 'START',
          previousStateName: 'Not Placed',
          inputSymbol: 'PLACE',
          nextState: 'S0',
          nextStateName: 'Order Placed',
          validationResult: 'ACCEPTED',
          reason: 'Order placed by customer. Initial DFA state initialized to S0.',
          updatedBy: customerUser._id,
          updatedByName: customerUser.name,
          timestamp: new Date(Date.now() - 3600000 * 5)
        }
      ]
    });

    // 2. Order in S1 (Order Confirmed)
    const orderS1 = await Order.create({
      userId: customerUser._id,
      products: [
        {
          product: createdProducts[2]._id,
          name: createdProducts[2].name,
          price: createdProducts[2].price,
          quantity: 1,
          image: createdProducts[2].image
        }
      ],
      totalAmount: 349.99,
      deliveryAddress: {
        fullName: 'Ada Lovelace',
        address: '12 Automata Lane, Computing Park',
        city: 'Bengaluru',
        postalCode: '560001',
        country: 'India',
        phone: '+91 9876543210'
      },
      paymentMethod: 'Simulated Credit Card',
      paymentStatus: 'Completed',
      currentStatus: { code: 'S1', name: 'Order Confirmed' },
      transitionHistory: [
        {
          previousState: 'START',
          previousStateName: 'Not Placed',
          inputSymbol: 'PLACE',
          nextState: 'S0',
          nextStateName: 'Order Placed',
          validationResult: 'ACCEPTED',
          reason: 'Initial order creation transition.',
          updatedBy: customerUser._id,
          updatedByName: customerUser.name,
          timestamp: new Date(Date.now() - 3600000 * 8)
        },
        {
          previousState: 'S0',
          previousStateName: 'Order Placed',
          inputSymbol: 'CONFIRM',
          nextState: 'S1',
          nextStateName: 'Order Confirmed',
          validationResult: 'ACCEPTED',
          reason: 'Admin verified inventory and payment. DFA transition δ(S0, CONFIRM) -> S1 accepted.',
          updatedBy: adminUser._id,
          updatedByName: adminUser.name,
          timestamp: new Date(Date.now() - 3600000 * 7)
        }
      ]
    });

    // 3. Order in S3 (Shipped) with an invalid transition attempt logged
    const orderS3 = await Order.create({
      userId: customerUser._id,
      products: [
        {
          product: createdProducts[3]._id,
          name: createdProducts[3].name,
          price: createdProducts[3].price,
          quantity: 2,
          image: createdProducts[3].image
        }
      ],
      totalAmount: 179.98,
      deliveryAddress: {
        fullName: 'Ada Lovelace',
        address: '12 Automata Lane, Computing Park',
        city: 'Bengaluru',
        postalCode: '560001',
        country: 'India',
        phone: '+91 9876543210'
      },
      paymentMethod: 'Simulated Net Banking',
      paymentStatus: 'Completed',
      currentStatus: { code: 'S3', name: 'Shipped' },
      transitionHistory: [
        {
          previousState: 'START',
          previousStateName: 'Not Placed',
          inputSymbol: 'PLACE',
          nextState: 'S0',
          nextStateName: 'Order Placed',
          validationResult: 'ACCEPTED',
          reason: 'Order placed by customer.',
          updatedBy: customerUser._id,
          updatedByName: customerUser.name,
          timestamp: new Date(Date.now() - 3600000 * 24)
        },
        {
          previousState: 'S0',
          previousStateName: 'Order Placed',
          inputSymbol: 'CONFIRM',
          nextState: 'S1',
          nextStateName: 'Order Confirmed',
          validationResult: 'ACCEPTED',
          reason: 'Admin confirmed payment and order. δ(S0, CONFIRM) -> S1.',
          updatedBy: adminUser._id,
          updatedByName: adminUser.name,
          timestamp: new Date(Date.now() - 3600000 * 20)
        },
        {
          previousState: 'S1',
          previousStateName: 'Order Confirmed',
          inputSymbol: 'PROCESS',
          nextState: 'S2',
          nextStateName: 'Processing',
          validationResult: 'ACCEPTED',
          reason: 'Warehouse packaging complete. δ(S1, PROCESS) -> S2.',
          updatedBy: adminUser._id,
          updatedByName: adminUser.name,
          timestamp: new Date(Date.now() - 3600000 * 16)
        },
        {
          previousState: 'S2',
          previousStateName: 'Processing',
          inputSymbol: 'DELIVER',
          nextState: null,
          nextStateName: null,
          validationResult: 'REJECTED',
          reason: 'Undefined transition: δ(S2, DELIVER) is not defined in transition function δ. Transition rejected by DFA.',
          updatedBy: adminUser._id,
          updatedByName: adminUser.name,
          timestamp: new Date(Date.now() - 3600000 * 12)
        },
        {
          previousState: 'S2',
          previousStateName: 'Processing',
          inputSymbol: 'SHIP',
          nextState: 'S3',
          nextStateName: 'Shipped',
          validationResult: 'ACCEPTED',
          reason: 'Handed over to logistics carrier. δ(S2, SHIP) -> S3.',
          updatedBy: adminUser._id,
          updatedByName: adminUser.name,
          timestamp: new Date(Date.now() - 3600000 * 10)
        }
      ]
    });

    // 4. Order in S5 (Delivered - Final State)
    const orderS5 = await Order.create({
      userId: customerUser._id,
      products: [
        {
          product: createdProducts[1]._id,
          name: createdProducts[1].name,
          price: createdProducts[1].price,
          quantity: 1,
          image: createdProducts[1].image
        }
      ],
      totalAmount: 1299.99,
      deliveryAddress: {
        fullName: 'Ada Lovelace',
        address: '12 Automata Lane, Computing Park',
        city: 'Bengaluru',
        postalCode: '560001',
        country: 'India',
        phone: '+91 9876543210'
      },
      paymentMethod: 'Simulated Card Payment',
      paymentStatus: 'Completed',
      currentStatus: { code: 'S5', name: 'Delivered' },
      transitionHistory: [
        {
          previousState: 'START',
          previousStateName: 'Not Placed',
          inputSymbol: 'PLACE',
          nextState: 'S0',
          nextStateName: 'Order Placed',
          validationResult: 'ACCEPTED',
          reason: 'Order placed by customer.',
          updatedBy: customerUser._id,
          updatedByName: customerUser.name,
          timestamp: new Date(Date.now() - 3600000 * 72)
        },
        {
          previousState: 'S0',
          previousStateName: 'Order Placed',
          inputSymbol: 'CONFIRM',
          nextState: 'S1',
          nextStateName: 'Order Confirmed',
          validationResult: 'ACCEPTED',
          reason: 'Order confirmed by Admin. δ(S0, CONFIRM) -> S1.',
          updatedBy: adminUser._id,
          updatedByName: adminUser.name,
          timestamp: new Date(Date.now() - 3600000 * 60)
        },
        {
          previousState: 'S1',
          previousStateName: 'Order Confirmed',
          inputSymbol: 'PROCESS',
          nextState: 'S2',
          nextStateName: 'Processing',
          validationResult: 'ACCEPTED',
          reason: 'Warehouse processing finished. δ(S1, PROCESS) -> S2.',
          updatedBy: adminUser._id,
          updatedByName: adminUser.name,
          timestamp: new Date(Date.now() - 3600000 * 48)
        },
        {
          previousState: 'S2',
          previousStateName: 'Processing',
          inputSymbol: 'SHIP',
          nextState: 'S3',
          nextStateName: 'Shipped',
          validationResult: 'ACCEPTED',
          reason: 'Carrier dispatch. δ(S2, SHIP) -> S3.',
          updatedBy: adminUser._id,
          updatedByName: adminUser.name,
          timestamp: new Date(Date.now() - 3600000 * 36)
        },
        {
          previousState: 'S3',
          previousStateName: 'Shipped',
          inputSymbol: 'OUT_FOR_DELIVERY',
          nextState: 'S4',
          nextStateName: 'Out for Delivery',
          validationResult: 'ACCEPTED',
          reason: 'Dispatched with delivery rider. δ(S3, OUT_FOR_DELIVERY) -> S4.',
          updatedBy: adminUser._id,
          updatedByName: adminUser.name,
          timestamp: new Date(Date.now() - 3600000 * 12)
        },
        {
          previousState: 'S4',
          previousStateName: 'Out for Delivery',
          inputSymbol: 'DELIVER',
          nextState: 'S5',
          nextStateName: 'Delivered',
          validationResult: 'ACCEPTED',
          reason: 'Package delivered to recipient. Terminal accepting state S5 reached.',
          updatedBy: adminUser._id,
          updatedByName: adminUser.name,
          timestamp: new Date(Date.now() - 3600000 * 4)
        }
      ]
    });

    // Populate TransitionHistory collection from seeded orders
    const allSeededOrders = [orderS0, orderS1, orderS3, orderS5];
    for (const ord of allSeededOrders) {
      for (const th of ord.transitionHistory) {
        await TransitionHistory.create({
          orderId: ord._id,
          previousState: th.previousState,
          previousStateName: th.previousStateName,
          inputSymbol: th.inputSymbol,
          nextState: th.nextState,
          nextStateName: th.nextStateName,
          validationResult: th.validationResult,
          reason: th.reason,
          updatedBy: th.updatedBy,
          updatedByName: th.updatedByName,
          timestamp: th.timestamp
        });
      }
    }
    console.log('[Seeder] Inserted sample orders and DFA transition audit records.');

    // Seed realistic sample network telemetry logs
    const endpointsSample = [
      { method: 'GET', endpoint: '/api/products', status: 'SUCCESS', statusCode: 200, responseTime: 24.5 },
      { method: 'POST', endpoint: '/api/auth/login', status: 'SUCCESS', statusCode: 200, responseTime: 88.2 },
      { method: 'GET', endpoint: '/api/orders/my-orders', status: 'SUCCESS', statusCode: 200, responseTime: 32.1 },
      { method: 'PUT', endpoint: '/api/orders/status', status: 'CLIENT_ERROR', statusCode: 400, responseTime: 18.7 },
      { method: 'GET', endpoint: '/api/dfa/transitions', status: 'SUCCESS', statusCode: 200, responseTime: 12.4 },
      { method: 'POST', endpoint: '/api/orders', status: 'SUCCESS', statusCode: 201, responseTime: 65.0 },
      { method: 'POST', endpoint: '/api/dfa/validate', status: 'SUCCESS', statusCode: 200, responseTime: 9.8 },
      { method: 'GET', endpoint: '/api/network/status', status: 'SUCCESS', statusCode: 200, responseTime: 15.2 }
    ];

    for (let i = 0; i < 40; i++) {
      const sample = endpointsSample[i % endpointsSample.length];
      const jitter = (Math.random() * 20 - 10);
      await NetworkLog.create({
        method: sample.method,
        endpoint: sample.endpoint,
        statusCode: sample.statusCode,
        responseTime: Math.max(5, Math.round((sample.responseTime + jitter) * 10) / 10),
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        protocol: 'HTTP/1.1',
        contentLength: Math.floor(Math.random() * 2048) + 256,
        status: sample.status,
        timestamp: new Date(Date.now() - (40 - i) * 60000)
      });
    }
    console.log('[Seeder] Inserted sample network telemetry logs.');

    console.log('----------------------------------------------------');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Demo Credentials:');
    console.log('  Admin:    admin@dfamall.com    | Password: Admin@123');
    console.log('  Customer: customer@dfamall.com | Password: Customer@123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
