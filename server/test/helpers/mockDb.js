import { ObjectId } from 'mongodb';

function matches(doc, query = {}) {
  return Object.entries(query).every(([key, value]) => {
    const current = doc[key];
    if (value instanceof ObjectId) {
      return String(current) === String(value);
    }
    if (current instanceof ObjectId) {
      return String(current) === String(value);
    }
    return current === value;
  });
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

function createCollection(state) {
  return {
    async insertOne(document) {
      const doc = { ...document, _id: document._id || new ObjectId() };
      state.push(doc);
      return { insertedId: doc._id };
    },
    async findOne(query = {}) {
      return state.find((doc) => matches(doc, query)) || null;
    },
    async updateOne(filter, update) {
      const doc = state.find((item) => matches(item, filter));
      if (!doc) return { matchedCount: 0, modifiedCount: 0 };
      if (update.$set) {
        Object.assign(doc, update.$set);
      }
      return { matchedCount: 1, modifiedCount: 1 };
    },
    async deleteOne(filter) {
      const index = state.findIndex((item) => matches(item, filter));
      if (index === -1) return { deletedCount: 0 };
      state.splice(index, 1);
      return { deletedCount: 1 };
    },
    find(query = {}) {
      return createFindCursor(state.filter((doc) => matches(doc, query)));
    }
  };
}

export function createMockDb(initial = {}) {
  const stores = {
    users: initial.users || [],
    resumes: initial.resumes || [],
    jobdescriptions: initial.jobdescriptions || [],
    resumeanalysis: initial.resumeanalysis || [],
    interviewquestions: initial.interviewquestions || []
  };

  return {
    stores,
    collection(name) {
      if (!stores[name]) {
        stores[name] = [];
      }
      return createCollection(stores[name]);
    }
  };
}
