/**
 * Database Connection & Dual-Engine Manager
 * 
 * Supports:
 * 1. Native MongoDB via Mongoose (when local or cloud MongoDB is running)
 * 2. Automatic persistent JSON store fallback (ensures 100% out-of-the-box operation
 *    without requiring a running MongoDB service on the machine).
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isMongoConnected = false;
const DATA_DIR = path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'db_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce_dfa';

  try {
    // Attempt Mongoose connection with 1.5-second fast timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500
    });
    isMongoConnected = true;
    console.log('[Database] Connected to live MongoDB instance (' + mongoUri + ')');
    return { mode: 'mongodb', uri: mongoUri };
  } catch (err) {
    isMongoConnected = false;
    console.log('[Database] Using Persistent Storage Engine (' + STORE_FILE + ')');
    return { mode: 'fallback_json', storePath: STORE_FILE };
  }
}

function getDatabaseStatus() {
  return {
    isMongoConnected,
    mode: isMongoConnected ? 'MongoDB' : 'Persistent Storage Engine',
    connectionString: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce_dfa',
    storePath: STORE_FILE
  };
}

module.exports = {
  connectDB,
  getDatabaseStatus,
  DATA_DIR,
  STORE_FILE,
  isMongoConnected: () => isMongoConnected
};
