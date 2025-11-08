/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

import 'jest';

// Global test timeout
jest.setTimeout(10000);

// Mock Homey SDK globally
global.Homey = {
  ManagerSettings: {
    get: jest.fn(),
    set: jest.fn(),
    getKeys: jest.fn().mockReturnValue([]),
    unset: jest.fn()
  },
  ManagerImages: {
    createImage: jest.fn().mockResolvedValue({ id: 'mock-image-id' })
  },
  ManagerFlow: {
    getCard: jest.fn(),
    registerRunListener: jest.fn(),
    registerCondition: jest.fn(),
    registerAction: jest.fn()
  },
  __: jest.fn((key) => key), // Mock translation function
  manifest: {
    id: 'com.hikvision',
    version: '0.2.3',
    name: { en: 'Hikvision Camera' }
  }
};

// Mock XMLHttpRequest for HTTP requests
global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  readyState: 4,
  status: 200,
  responseText: '<ResponseStatus>OK</ResponseStatus>'
})) as any;

// Mock fetch if needed
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('<ResponseStatus>OK</ResponseStatus>')
  })
) as any;

// Mock setTimeout/setInterval for tests
jest.useFakeTimers();

// Console log suppression for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};