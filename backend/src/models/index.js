/**
 * Unified Model Interface
 * Transparently delegates to Mongoose when MongoDB is connected,
 * or to the local persistent JSON store when running in standalone mode.
 */

const fs = require('fs');
const path = require('path');
const { isMongoConnected, STORE_FILE } = require('../config/db');

// Mongoose Models
const MongoUser = require('./mongoose/User');
const MongoProduct = require('./mongoose/Product');
const MongoOrder = require('./mongoose/Order');

// In-Memory / File-Persistent Storage Engine
let localStore = {
  users: [],
  products: [],
  orders: []
};

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      localStore = JSON.parse(raw);
      if (!localStore.users) localStore.users = [];
      if (!localStore.products) localStore.products = [];
      if (!localStore.orders) localStore.orders = [];
    } else {
      saveStore();
    }
  } catch (err) {
    console.error('[Store] Error loading store file:', err.message);
  }
}

function saveStore() {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Error saving store file:', err.message);
  }
}

// Initial load
loadStore();

function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// JSON Store Query Helpers
function matchFilter(doc, filter = {}) {
  for (const [key, val] of Object.entries(filter)) {
    if (val === undefined) continue;
    if (key === '_id' || key === 'id') {
      const docId = doc._id || doc.id;
      if (String(docId) !== String(val)) return false;
      continue;
    }
    if (val && typeof val === 'object' && val.$regex) {
      const regex = new RegExp(val.$regex, val.$options || 'i');
      if (!regex.test(doc[key] || '')) return false;
      continue;
    }
    if (val && typeof val === 'object' && (val.$gte !== undefined || val.$lte !== undefined)) {
      if (val.$gte !== undefined && doc[key] < val.$gte) return false;
      if (val.$lte !== undefined && doc[key] > val.$lte) return false;
      continue;
    }
    if (doc[key] !== val) return false;
  }
  return true;
}

// Unified Product Model
const Product = {
  async find(filter = {}) {
    if (isMongoConnected()) return await MongoProduct.find(filter).lean();
    loadStore();
    return localStore.products.filter(p => matchFilter(p, filter));
  },
  async findById(id) {
    if (isMongoConnected()) return await MongoProduct.findById(id).lean();
    loadStore();
    return localStore.products.find(p => (p._id || p.id) === String(id)) || null;
  },
  async findOne(filter = {}) {
    if (isMongoConnected()) return await MongoProduct.findOne(filter).lean();
    loadStore();
    return localStore.products.find(p => matchFilter(p, filter)) || null;
  },
  async create(data) {
    if (isMongoConnected()) return await MongoProduct.create(data);
    loadStore();
    const doc = {
      _id: generateId(),
      rating: 4.5,
      stock: 20,
      featured: false,
      createdAt: new Date().toISOString(),
      ...data
    };
    localStore.products.push(doc);
    saveStore();
    return doc;
  },
  async findByIdAndUpdate(id, update, options = {}) {
    if (isMongoConnected()) return await MongoProduct.findByIdAndUpdate(id, update, { new: true, ...options }).lean();
    loadStore();
    const idx = localStore.products.findIndex(p => (p._id || p.id) === String(id));
    if (idx === -1) return null;
    localStore.products[idx] = { ...localStore.products[idx], ...update, updatedAt: new Date().toISOString() };
    saveStore();
    return localStore.products[idx];
  },
  async findByIdAndDelete(id) {
    if (isMongoConnected()) return await MongoProduct.findByIdAndDelete(id);
    loadStore();
    const idx = localStore.products.findIndex(p => (p._id || p.id) === String(id));
    if (idx === -1) return null;
    const removed = localStore.products.splice(idx, 1)[0];
    saveStore();
    return removed;
  },
  async countDocuments(filter = {}) {
    if (isMongoConnected()) return await MongoProduct.countDocuments(filter);
    loadStore();
    return localStore.products.filter(p => matchFilter(p, filter)).length;
  }
};

// Unified User Model
const User = {
  async find(filter = {}) {
    if (isMongoConnected()) return await MongoUser.find(filter).lean();
    loadStore();
    return localStore.users.filter(u => matchFilter(u, filter));
  },
  async findById(id) {
    if (isMongoConnected()) return await MongoUser.findById(id).lean();
    loadStore();
    return localStore.users.find(u => (u._id || u.id) === String(id)) || null;
  },
  async findOne(filter = {}) {
    if (isMongoConnected()) return await MongoUser.findOne(filter);
    loadStore();
    return localStore.users.find(u => matchFilter(u, filter)) || null;
  },
  async create(data) {
    if (isMongoConnected()) return await MongoUser.create(data);
    loadStore();
    const doc = {
      _id: generateId(),
      role: 'customer',
      createdAt: new Date().toISOString(),
      ...data
    };
    localStore.users.push(doc);
    saveStore();
    return doc;
  },
  async findByIdAndUpdate(id, update, options = {}) {
    if (isMongoConnected()) return await MongoUser.findByIdAndUpdate(id, update, { new: true, ...options });
    loadStore();
    const idx = localStore.users.findIndex(u => (u._id || u.id) === String(id));
    if (idx === -1) return null;
    localStore.users[idx] = { ...localStore.users[idx], ...update };
    saveStore();
    return localStore.users[idx];
  },
  async countDocuments(filter = {}) {
    if (isMongoConnected()) return await MongoUser.countDocuments(filter);
    loadStore();
    return localStore.users.filter(u => matchFilter(u, filter)).length;
  }
};

// Unified Order Model
const Order = {
  async find(filter = {}) {
    if (isMongoConnected()) return await MongoOrder.find(filter).sort({ createdAt: -1 }).lean();
    loadStore();
    return localStore.orders
      .filter(o => matchFilter(o, filter))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async findById(id) {
    if (isMongoConnected()) return await MongoOrder.findById(id).lean();
    loadStore();
    return localStore.orders.find(o => (o._id || o.id) === String(id) || o.orderNumber === String(id)) || null;
  },
  async findOne(filter = {}) {
    if (isMongoConnected()) return await MongoOrder.findOne(filter).lean();
    loadStore();
    return localStore.orders.find(o => matchFilter(o, filter)) || null;
  },
  async create(data) {
    if (isMongoConnected()) return await MongoOrder.create(data);
    loadStore();
    const doc = {
      _id: generateId(),
      currentState: 'S0',
      currentStateLabel: 'Order Placed',
      isTerminal: false,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    localStore.orders.push(doc);
    saveStore();
    return doc;
  },
  async findByIdAndUpdate(id, update, options = {}) {
    if (isMongoConnected()) return await MongoOrder.findByIdAndUpdate(id, update, { new: true, ...options }).lean();
    loadStore();
    const idx = localStore.orders.findIndex(o => (o._id || o.id) === String(id) || o.orderNumber === String(id));
    if (idx === -1) return null;

    // Handle $push for history
    const existing = localStore.orders[idx];
    const updated = { ...existing };

    for (const [key, val] of Object.entries(update)) {
      if (key === '$push') {
        for (const [pushKey, pushVal] of Object.entries(val)) {
          if (!updated[pushKey]) updated[pushKey] = [];
          updated[pushKey].push({ _id: generateId(), ...pushVal });
        }
      } else {
        updated[key] = val;
      }
    }
    updated.updatedAt = new Date().toISOString();
    localStore.orders[idx] = updated;
    saveStore();
    return updated;
  },
  async countDocuments(filter = {}) {
    if (isMongoConnected()) return await MongoOrder.countDocuments(filter);
    loadStore();
    return localStore.orders.filter(o => matchFilter(o, filter)).length;
  }
};

module.exports = {
  User,
  Product,
  Order,
  loadStore,
  saveStore,
  getLocalStore: () => localStore
};
