import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

let client;
let db;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localDbPath = path.resolve(__dirname, '../../.local-data/mock-db.json');

function matches(doc, query = {}) {
  return Object.entries(query).every(([key, value]) => {
    const current = doc[key];
    if (value instanceof ObjectId || current instanceof ObjectId) {
      return String(current) === String(value);
    }
    return current === value;
  });
}

function toSerializable(value) {
  if (value instanceof ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toSerializable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, toSerializable(val)]));
  }
  return value;
}

function reviveDocument(value) {
  if (Array.isArray(value)) return value.map(reviveDocument);
  if (value && typeof value === 'object') {
    const revived = {};
    for (const [key, val] of Object.entries(value)) {
      if (key === '_id' || key.endsWith('Id') || key === 'userId' || key === 'resumeId' || key === 'jobId') {
        revived[key] = new ObjectId(String(val));
      } else if (key.endsWith('At') && typeof val === 'string') {
        revived[key] = new Date(val);
      } else {
        revived[key] = reviveDocument(val);
      }
    }
    return revived;
  }
  return value;
}

function createFindCursor(items) {
  return {
    sort(sortSpec) {
      const [field, direction] = Object.entries(sortSpec)[0] || [];
      if (!field) return createFindCursor(items);
      const sorted = [...items].sort((a, b) => {
        const aValue = new Date(a[field]).getTime();
        const bValue = new Date(b[field]).getTime();
        return direction < 0 ? bValue - aValue : aValue - bValue;
      });
      return createFindCursor(sorted);
    },
    toArray() {
      return Promise.resolve([...items]);
    }
  };
}

async function persistStores(stores) {
  await fs.mkdir(path.dirname(localDbPath), { recursive: true });
  const payload = toSerializable(stores);
  await fs.writeFile(localDbPath, JSON.stringify(payload, null, 2), 'utf8');
}

async function loadStores() {
  try {
    const raw = await fs.readFile(localDbPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: (parsed.users || []).map(reviveDocument),
      resumes: (parsed.resumes || []).map(reviveDocument),
      jobdescriptions: (parsed.jobdescriptions || []).map(reviveDocument),
      resumeanalysis: (parsed.resumeanalysis || []).map(reviveDocument),
      interviewquestions: (parsed.interviewquestions || []).map(reviveDocument)
    };
  } catch {
    return {
      users: [],
      resumes: [],
      jobdescriptions: [],
      resumeanalysis: [],
      interviewquestions: []
    };
  }
}

function createCollection(state, persist) {
  return {
    async insertOne(document) {
      const doc = { ...document, _id: document._id || new ObjectId() };
      state.push(doc);
      await persist();
      return { insertedId: doc._id };
    },
    async findOne(query = {}) {
      return state.find((doc) => matches(doc, query)) || null;
    },
    async updateOne(filter, update) {
      const doc = state.find((item) => matches(item, filter));
      if (!doc) return { matchedCount: 0, modifiedCount: 0 };
      if (update.$set) Object.assign(doc, update.$set);
      await persist();
      return { matchedCount: 1, modifiedCount: 1 };
    },
    async deleteOne(filter) {
      const index = state.findIndex((item) => matches(item, filter));
      if (index === -1) return { deletedCount: 0 };
      state.splice(index, 1);
      await persist();
      return { deletedCount: 1 };
    },
    find(query = {}) {
      return createFindCursor(state.filter((doc) => matches(doc, query)));
    }
  };
}

function createMemoryDb(stores) {
  return {
    stores,
    collection(name) {
      if (!stores[name]) stores[name] = [];
      return createCollection(stores[name], async () => persistStores(stores));
    }
  };
}

export async function connectDatabase() {
  if (db) return db;
  try {
    client = new MongoClient(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db();
  } catch (error) {
    console.warn('MongoDB unavailable, using in-memory database for local development.');
    const stores = await loadStores();
    db = createMemoryDb(stores);
  }
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
}

export async function closeDatabase() {
  if (client) {
    await client.close();
  }
  client = undefined;
  db = undefined;
}

export function setDatabase(mockDb) {
  db = mockDb;
}
