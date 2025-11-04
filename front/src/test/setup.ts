import '@testing-library/jest-dom'

// Mock socket.io-client
jest.mock('../socket', () => ({
  default: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
  },
}));

// Mock axios
jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location
delete (global as any).window.location;
(global as any).window.location = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
};
