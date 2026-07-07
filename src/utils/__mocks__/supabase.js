import { jest } from '@jest/globals';

const builders = {};

const createMockBuilder = (tableName) => {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    then: jest.fn((resolve) => resolve({ data: null, error: null })),
  };
};

export const supabase = {
  auth: {
    signUp: jest.fn(() => Promise.resolve({ data: { user: { id: 'mock-user-id' }, session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' } }, error: null })),
    signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: { id: 'mock-user-id' }, session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' } }, error: null })),
    getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'mock-user-id', user_metadata: { role: 'patient' } } }, error: null })),
    refreshSession: jest.fn(() => Promise.resolve({ data: { session: { access_token: 'mock-access-token-new', refresh_token: 'mock-refresh-token-new' } }, error: null })),
  },
  from: jest.fn((tableName) => {
    if (!builders[tableName]) {
      builders[tableName] = createMockBuilder(tableName);
    }
    return builders[tableName];
  }),
};
