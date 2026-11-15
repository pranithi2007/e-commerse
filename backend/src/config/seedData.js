const bcrypt = require('bcryptjs');

const initialProducts = [
  {
    name: 'AcousticPro Wireless Noise-Canceling Headphones',
    description: 'Studio-grade over-ear Bluetooth headphones with active hybrid noise cancellation, 40-hour battery life, and high-fidelity sound stage.',
    price: 199.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    stock: 35,
    rating: 4.8,
    featured: true
  },
  {
    name: 'PulseTrack Ultra Smart Fitness Watch',
    description: 'Next-generation smartwatch featuring AMOLED retina display, 24/7 ECG heart rate monitor, SPO2, GPS tracking, and 50m water resistance.',
    price: 149.50,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    stock: 42,
    rating: 4.7,
    featured: true
  },
  {
    name: 'Apex RGB Mechanical Gaming Keyboard',
    description: 'Hot-swappable tactile mechanical switches, aircraft-grade aluminum frame, per-key RGB backlighting, and detachable magnetic wrist rest.',
    price: 89.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    stock: 28,
    rating: 4.6,
    featured: false
  },
  {
    name: 'VisionX 4K Ultra HD Action Camera',
    description: 'Rugged waterproof 4K/60fps action camera with dual color touch screens, 6-axis gyro stabilization, and wide-angle 170° lens.',
    price: 129.00,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
    stock: 19,
    rating: 4.5,
    featured: false
  },
  {
    name: 'Vintage Distressed Denim Jacket',
    description: 'Handcrafted premium 100% organic cotton denim jacket with vintage wash, brass buttons, and reinforced double-needle stitching.',
    price: 79.95,
    category: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80',
    stock: 50,
    rating: 4.6,
    featured: true
  },
  {
    name: 'AeroVelocity Cloud Running Sneakers',
    description: 'Ultra-lightweight breathable engineered mesh athletic shoes featuring nitrogen-infused bounce cushioning and anti-slip rubber outsole.',
    price: 119.99,
    category: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    stock: 30,
    rating: 4.9,
    featured: true
  },
  {
    name: 'Royal Heritage Chronograph Leather Watch',
    description: 'Sophisticated timepiece with scratch-resistant sapphire crystal glass, Japanese quartz movement, genuine Italian leather strap.',
    price: 175.00,
    category: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
    stock: 15,
    rating: 4.7,
    featured: false
  },
  {
    name: 'BaristaTouch French Press Coffee Maker',
    description: 'Double-wall insulated 34oz stainless steel French press with 4-level filtration system, ensuring bold, sediment-free coffee.',
    price: 39.99,
    category: 'Home & Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
    stock: 45,
    rating: 4.8,
    featured: false
  },
  {
    name: 'Lumina Smart Ambient LED Desk Lamp',
    description: 'Touch-controlled dimmable minimalist desk lamp with wireless charging pad, adjustable color temperature (2700K-6500K), and memory function.',
    price: 49.50,
    category: 'Home & Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
    stock: 60,
    rating: 4.5,
    featured: false
  },
  {
    name: 'EcoGrip Pro Alignment Yoga Mat',
    description: 'High-density non-slip natural tree rubber yoga mat with laser-engraved alignment lines, moisture-wicking surface, and carry strap.',
    price: 54.00,
    category: 'Sports & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80',
    stock: 35,
    rating: 4.7,
    featured: false
  },
  {
    name: 'HydroShield Vacuum-Insulated Thermal Bottle',
    description: '32oz double-walled stainless steel water bottle keeps drinks ice cold for 24 hours or piping hot for 12 hours. BPA-free leak-proof lid.',
    price: 29.99,
    category: 'Sports & Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
    stock: 80,
    rating: 4.9,
    featured: false
  },
  {
    name: 'Theory of Computation & Automata Guide',
    description: 'Comprehensive handbook covering Deterministic Finite Automata (DFA), Non-deterministic Finite Automata (NFA), Turing Machines, and practical state machines in software.',
    price: 44.99,
    category: 'Books & Media',
    imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80',
    stock: 25,
    rating: 4.9,
    featured: true
  }
];

async function getSeedUsers() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  return [
    {
      _id: 'user_admin_001',
      name: 'System Administrator',
      email: 'admin@dfamall.com',
      password: adminPassword,
      role: 'admin',
      phone: '+1 (555) 902-1100',
      address: {
        street: '100 Automaton Boulevard, Suite 500',
        city: 'Silicon Valley',
        state: 'CA',
        postalCode: '94025',
        country: 'USA'
      },
      createdAt: new Date().toISOString()
    },
    {
      _id: 'user_customer_001',
      name: 'Sarah Connor',
      email: 'customer@dfamall.com',
      password: customerPassword,
      role: 'customer',
      phone: '+1 (555) 314-1592',
      address: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'USA'
      },
      createdAt: new Date().toISOString()
    }
  ];
}

function getSampleOrders(customer, products) {
  const getIdString = (value) => (value && typeof value.toString === 'function' ? value.toString() : value);

  const p1 = products[0] || { _id: 'p1', name: 'AcousticPro Headphones', price: 199.99, imageUrl: '' };
  const p2 = products[1] || { _id: 'p2', name: 'PulseTrack Watch', price: 149.50, imageUrl: '' };
  const p5 = products[5] || { _id: 'p5', name: 'AeroVelocity Sneakers', price: 119.99, imageUrl: '' };

  const now = Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;

  const orders = [
    // Order 1: State S0 (Order Placed)
    {
      _id: 'order_dfa_s0',
      orderNumber: 'ORD-DFA-1001',
      customer: {
        id: customer._id || customer.id,
        name: customer.name,
        email: customer.email
      },
      items: [
        {
          productId: p1._id || p1.id,
          name: p1.name,
          price: p1.price,
          quantity: 1,
          imageUrl: p1.imageUrl,
          subtotal: p1.price
        }
      ],
      subtotal: p1.price,
      shippingFee: 0,
      tax: 10.00,
      totalAmount: p1.price + 10.00,
      shippingAddress: {
        fullName: customer.name,
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        postalCode: customer.address.postalCode,
        phone: customer.phone
      },
      payment: {
        method: 'Simulated Card',
        status: 'PAID',
        transactionId: 'TXN-SIM-9901',
        last4: '4242'
      },
      currentState: 'S0',
      currentStateLabel: 'Order Placed',
      isTerminal: false,
      history: [
        {
          _id: 'hist_1001_1',
          fromState: 'START',
          toState: 'S0',
          action: 'PLACE_ORDER',
          actionLabel: 'Order Placed',
          changedBy: 'Customer (Sarah Connor)',
          note: 'Customer placed order through web checkout.',
          timestamp: new Date(now - 15 * minute).toISOString()
        }
      ],
      createdAt: new Date(now - 15 * minute).toISOString(),
      updatedAt: new Date(now - 15 * minute).toISOString()
    },

    // Order 2: State S1 (Order Confirmed)
    {
      _id: 'order_dfa_s1',
      orderNumber: 'ORD-DFA-1002',
      customer: {
        id: customer._id || customer.id,
        name: customer.name,
        email: customer.email
      },
      items: [
        {
          productId: p2._id || p2.id,
          name: p2.name,
          price: p2.price,
          quantity: 1,
          imageUrl: p2.imageUrl,
          subtotal: p2.price
        }
      ],
      subtotal: p2.price,
      shippingFee: 0,
      tax: 7.48,
      totalAmount: p2.price + 7.48,
      shippingAddress: {
        fullName: customer.name,
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        postalCode: customer.address.postalCode,
        phone: customer.phone
      },
      payment: {
        method: 'Simulated Card',
        status: 'PAID',
        transactionId: 'TXN-SIM-9902',
        last4: '1122'
      },
      currentState: 'S1',
      currentStateLabel: 'Order Confirmed',
      isTerminal: false,
      history: [
        {
          _id: 'hist_1002_1',
          fromState: 'START',
          toState: 'S0',
          action: 'PLACE_ORDER',
          actionLabel: 'Order Placed',
          changedBy: 'Customer (Sarah Connor)',
          note: 'Customer checkout completed.',
          timestamp: new Date(now - 2 * hour).toISOString()
        },
        {
          _id: 'hist_1002_2',
          fromState: 'S0',
          toState: 'S1',
          action: 'CONFIRM_ORDER',
          actionLabel: 'Confirm Order',
          changedBy: 'Admin (admin@dfamall.com)',
          note: 'DFA Transition δ(S0, CONFIRM_ORDER) -> S1 verified. Payment confirmed.',
          timestamp: new Date(now - 1 * hour).toISOString()
        }
      ],
      createdAt: new Date(now - 2 * hour).toISOString(),
      updatedAt: new Date(now - 1 * hour).toISOString()
    },

    // Order 3: State S2 (Processing)
    {
      _id: 'order_dfa_s2',
      orderNumber: 'ORD-DFA-1003',
      customer: {
        id: customer._id || customer.id,
        name: customer.name,
        email: customer.email
      },
      items: [
        {
          productId: p5._id || p5.id,
          name: p5.name,
          price: p5.price,
          quantity: 1,
          imageUrl: p5.imageUrl,
          subtotal: p5.price
        }
      ],
      subtotal: p5.price,
      shippingFee: 0,
      tax: 6.00,
      totalAmount: p5.price + 6.00,
      shippingAddress: {
        fullName: customer.name,
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        postalCode: customer.address.postalCode,
        phone: customer.phone
      },
      payment: {
        method: 'Simulated Card',
        status: 'PAID',
        transactionId: 'TXN-SIM-9903',
        last4: '5566'
      },
      currentState: 'S2',
      currentStateLabel: 'Processing',
      isTerminal: false,
      history: [
        {
          _id: 'hist_1003_1',
          fromState: 'START',
          toState: 'S0',
          action: 'PLACE_ORDER',
          actionLabel: 'Order Placed',
          changedBy: 'Customer',
          note: 'Order submitted.',
          timestamp: new Date(now - 5 * hour).toISOString()
        },
        {
          _id: 'hist_1003_2',
          fromState: 'S0',
          toState: 'S1',
          action: 'CONFIRM_ORDER',
          actionLabel: 'Confirm Order',
          changedBy: 'Admin',
          note: 'DFA Transition δ(S0, CONFIRM_ORDER) -> S1 verified.',
          timestamp: new Date(now - 4 * hour).toISOString()
        },
        {
          _id: 'hist_1003_3',
          fromState: 'S1',
          toState: 'S2',
          action: 'START_PROCESSING',
          actionLabel: 'Start Processing',
          changedBy: 'Admin',
          note: 'DFA Transition δ(S1, START_PROCESSING) -> S2 verified. Packed in warehouse.',
          timestamp: new Date(now - 3 * hour).toISOString()
        }
      ],
      createdAt: new Date(now - 5 * hour).toISOString(),
      updatedAt: new Date(now - 3 * hour).toISOString()
    },

    // Order 4: State S3 (Shipped)
    {
      _id: 'order_dfa_s3',
      orderNumber: 'ORD-DFA-1004',
      customer: {
        id: customer._id || customer.id,
        name: customer.name,
        email: customer.email
      },
      items: [
        {
          productId: p1._id || p1.id,
          name: p1.name,
          price: p1.price,
          quantity: 1,
          imageUrl: p1.imageUrl,
          subtotal: p1.price
        }
      ],
      subtotal: p1.price,
      shippingFee: 0,
      tax: 10.00,
      totalAmount: p1.price + 10.00,
      shippingAddress: {
        fullName: customer.name,
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        postalCode: customer.address.postalCode,
        phone: customer.phone
      },
      payment: {
        method: 'Simulated Card',
        status: 'PAID',
        transactionId: 'TXN-SIM-9904',
        last4: '7788'
      },
      currentState: 'S3',
      currentStateLabel: 'Shipped',
      isTerminal: false,
      history: [
        {
          _id: 'hist_1004_1',
          fromState: 'START',
          toState: 'S0',
          action: 'PLACE_ORDER',
          actionLabel: 'Order Placed',
          changedBy: 'Customer',
          note: 'Placed order.',
          timestamp: new Date(now - 24 * hour).toISOString()
        },
        {
          _id: 'hist_1004_2',
          fromState: 'S0',
          toState: 'S1',
          action: 'CONFIRM_ORDER',
          actionLabel: 'Confirm Order',
          changedBy: 'Admin',
          note: 'DFA Transition S0 -> S1 approved.',
          timestamp: new Date(now - 20 * hour).toISOString()
        },
        {
          _id: 'hist_1004_3',
          fromState: 'S1',
          toState: 'S2',
          action: 'START_PROCESSING',
          actionLabel: 'Start Processing',
          changedBy: 'Admin',
          note: 'DFA Transition S1 -> S2 approved.',
          timestamp: new Date(now - 16 * hour).toISOString()
        },
        {
          _id: 'hist_1004_4',
          fromState: 'S2',
          toState: 'S3',
          action: 'SHIP_ORDER',
          actionLabel: 'Ship Order',
          changedBy: 'Admin',
          note: 'DFA Transition δ(S2, SHIP_ORDER) -> S3 verified. Handed over to FedEx (Tracking #FX-8829103).',
          timestamp: new Date(now - 8 * hour).toISOString()
        }
      ],
      createdAt: new Date(now - 24 * hour).toISOString(),
      updatedAt: new Date(now - 8 * hour).toISOString()
    },

    // Order 5: State S4 (Out for Delivery)
    {
      _id: 'order_dfa_s4',
      orderNumber: 'ORD-DFA-1005',
      customer: {
        id: customer._id || customer.id,
        name: customer.name,
        email: customer.email
      },
      items: [
        {
          productId: p2._id || p2.id,
          name: p2.name,
          price: p2.price,
          quantity: 1,
          imageUrl: p2.imageUrl,
          subtotal: p2.price
        }
      ],
      subtotal: p2.price,
      shippingFee: 0,
      tax: 7.48,
      totalAmount: p2.price + 7.48,
      shippingAddress: {
        fullName: customer.name,
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        postalCode: customer.address.postalCode,
        phone: customer.phone
      },
      payment: {
        method: 'Simulated Card',
        status: 'PAID',
        transactionId: 'TXN-SIM-9905',
        last4: '9900'
      },
      currentState: 'S4',
      currentStateLabel: 'Out for Delivery',
      isTerminal: false,
      history: [
        {
          _id: 'hist_1005_1',
          fromState: 'START',
          toState: 'S0',
          action: 'PLACE_ORDER',
          actionLabel: 'Order Placed',
          changedBy: 'Customer',
          note: 'Order initiated.',
          timestamp: new Date(now - 36 * hour).toISOString()
        },
        {
          _id: 'hist_1005_2',
          fromState: 'S0',
          toState: 'S1',
          action: 'CONFIRM_ORDER',
          actionLabel: 'Confirm Order',
          changedBy: 'Admin',
          note: 'S0 -> S1 confirmed.',
          timestamp: new Date(now - 30 * hour).toISOString()
        },
        {
          _id: 'hist_1005_3',
          fromState: 'S1',
          toState: 'S2',
          action: 'START_PROCESSING',
          actionLabel: 'Start Processing',
          changedBy: 'Admin',
          note: 'S1 -> S2 processing.',
          timestamp: new Date(now - 20 * hour).toISOString()
        },
        {
          _id: 'hist_1005_4',
          fromState: 'S2',
          toState: 'S3',
          action: 'SHIP_ORDER',
          actionLabel: 'Ship Order',
          changedBy: 'Admin',
          note: 'S2 -> S3 dispatched.',
          timestamp: new Date(now - 12 * hour).toISOString()
        },
        {
          _id: 'hist_1005_5',
          fromState: 'S3',
          toState: 'S4',
          action: 'OUT_FOR_DELIVERY',
          actionLabel: 'Out for Delivery',
          changedBy: 'Admin (Logistics)',
          note: 'DFA Transition δ(S3, OUT_FOR_DELIVERY) -> S4 verified. Courier out for delivery.',
          timestamp: new Date(now - 1 * hour).toISOString()
        }
      ],
      createdAt: new Date(now - 36 * hour).toISOString(),
      updatedAt: new Date(now - 1 * hour).toISOString()
    },

    // Order 6: State S5 (Delivered - Terminal State)
    {
      _id: 'order_dfa_s5',
      orderNumber: 'ORD-DFA-1006',
      customer: {
        id: customer._id || customer.id,
        name: customer.name,
        email: customer.email
      },
      items: [
        {
          productId: p1._id || p1.id,
          name: p1.name,
          price: p1.price,
          quantity: 1,
          imageUrl: p1.imageUrl,
          subtotal: p1.price
        }
      ],
      subtotal: p1.price,
      shippingFee: 0,
      tax: 10.00,
      totalAmount: p1.price + 10.00,
      shippingAddress: {
        fullName: customer.name,
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        postalCode: customer.address.postalCode,
        phone: customer.phone
      },
      payment: {
        method: 'Simulated Card',
        status: 'PAID',
        transactionId: 'TXN-SIM-9906',
        last4: '4242'
      },
      currentState: 'S5',
      currentStateLabel: 'Delivered',
      isTerminal: true,
      history: [
        {
          _id: 'hist_1006_1',
          fromState: 'START',
          toState: 'S0',
          action: 'PLACE_ORDER',
          actionLabel: 'Order Placed',
          changedBy: 'Customer',
          note: 'Placed order.',
          timestamp: new Date(now - 72 * hour).toISOString()
        },
        {
          _id: 'hist_1006_2',
          fromState: 'S0',
          toState: 'S1',
          action: 'CONFIRM_ORDER',
          actionLabel: 'Confirm Order',
          changedBy: 'Admin',
          note: 'Transition S0 -> S1.',
          timestamp: new Date(now - 60 * hour).toISOString()
        },
        {
          _id: 'hist_1006_3',
          fromState: 'S1',
          toState: 'S2',
          action: 'START_PROCESSING',
          actionLabel: 'Start Processing',
          changedBy: 'Admin',
          note: 'Transition S1 -> S2.',
          timestamp: new Date(now - 48 * hour).toISOString()
        },
        {
          _id: 'hist_1006_4',
          fromState: 'S2',
          toState: 'S3',
          action: 'SHIP_ORDER',
          actionLabel: 'Ship Order',
          changedBy: 'Admin',
          note: 'Transition S2 -> S3.',
          timestamp: new Date(now - 36 * hour).toISOString()
        },
        {
          _id: 'hist_1006_5',
          fromState: 'S3',
          toState: 'S4',
          action: 'OUT_FOR_DELIVERY',
          actionLabel: 'Out for Delivery',
          changedBy: 'Admin',
          note: 'Transition S3 -> S4.',
          timestamp: new Date(now - 24 * hour).toISOString()
        },
        {
          _id: 'hist_1006_6',
          fromState: 'S4',
          toState: 'S5',
          action: 'DELIVER_ORDER',
          actionLabel: 'Deliver Order',
          changedBy: 'Courier Driver',
          note: 'DFA Transition δ(S4, DELIVER_ORDER) -> S5 verified. Package signed and received by customer. State is now TERMINAL.',
          timestamp: new Date(now - 20 * hour).toISOString()
        }
      ],
      createdAt: new Date(now - 72 * hour).toISOString(),
      updatedAt: new Date(now - 20 * hour).toISOString()
    },

    // Order 7: State S6 (Cancelled - Terminal State)
    {
      _id: 'order_dfa_s6',
      orderNumber: 'ORD-DFA-1007',
      customer: {
        id: customer._id || customer.id,
        name: customer.name,
        email: customer.email
      },
      items: [
        {
          productId: p5._id || p5.id,
          name: p5.name,
          price: p5.price,
          quantity: 1,
          imageUrl: p5.imageUrl,
          subtotal: p5.price
        }
      ],
      subtotal: p5.price,
      shippingFee: 0,
      tax: 6.00,
      totalAmount: p5.price + 6.00,
      shippingAddress: {
        fullName: customer.name,
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        postalCode: customer.address.postalCode,
        phone: customer.phone
      },
      payment: {
        method: 'Simulated Card',
        status: 'CANCELLED',
        transactionId: 'TXN-SIM-9907',
        last4: '5566'
      },
      currentState: 'S6',
      currentStateLabel: 'Cancelled',
      isTerminal: true,
      history: [
        {
          _id: 'hist_1007_1',
          fromState: 'START',
          toState: 'S0',
          action: 'PLACE_ORDER',
          actionLabel: 'Order Placed',
          changedBy: 'Customer',
          note: 'Customer ordered item.',
          timestamp: new Date(now - 10 * hour).toISOString()
        },
        {
          _id: 'hist_1007_2',
          fromState: 'S0',
          toState: 'S6',
          action: 'CANCEL_ORDER',
          actionLabel: 'Cancel Order',
          changedBy: 'Customer (Sarah Connor)',
          note: 'DFA Transition δ(S0, CANCEL_ORDER) -> S6 verified. Customer requested cancellation before confirmation. State is now TERMINAL.',
          timestamp: new Date(now - 9 * hour).toISOString()
        }
      ],
      createdAt: new Date(now - 10 * hour).toISOString(),
      updatedAt: new Date(now - 9 * hour).toISOString()
    }
  ];

  return orders.map((order) => {
    const { _id: ignoredOrderId, ...cleanOrder } = order;

    return {
      ...cleanOrder,
      customer: {
        ...cleanOrder.customer,
        id: getIdString(cleanOrder.customer?.id)
      },
      items: (cleanOrder.items || []).map((item) => ({
        ...item,
        productId: getIdString(item.productId)
      })),
      history: (cleanOrder.history || []).map(({ _id: ignoredHistoryId, ...entry }) => entry)
    };
  });
}

module.exports = {
  initialProducts,
  getSeedUsers,
  getSampleOrders
};
