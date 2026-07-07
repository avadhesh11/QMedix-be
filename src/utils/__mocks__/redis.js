import { jest } from '@jest/globals';

export const redisClient = {
  connect: jest.fn(() => Promise.resolve(true)),
  on: jest.fn(),
  get: jest.fn(() => Promise.resolve(null)),
  set: jest.fn(() => Promise.resolve('OK')),
  del: jest.fn(() => Promise.resolve(1)),
  quit: jest.fn(() => Promise.resolve(true)),
};

export const connectRedis = jest.fn(() => Promise.resolve(true));
