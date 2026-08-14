/**
 * Jest setup file
 * Runs before each test file
 */

// Increase timeout for image processing operations
jest.setTimeout(30000);

// Mock console methods in tests to keep output clean
// but allow overriding per test
global.mockConsole = () => {
  global.consoleSpy = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation(),
  };
};

global.restoreConsole = () => {
  if (global.consoleSpy) {
    Object.values(global.consoleSpy).forEach(spy => spy.mockRestore());
  }
};
