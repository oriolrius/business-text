// Jest setup provided by Grafana scaffolding
import './.config/jest-setup.ts';

import { TextDecoder, TextEncoder } from 'util';
import ResizeObserver from 'resize-observer-polyfill';

/**
 * Fetch
 */
const fetchMock = () =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  });

global.fetch = jest.fn(fetchMock);

beforeEach(() => {
  global.fetch.mockImplementation(fetchMock);
});

/**
 * Mock ResizeObserver
 */
global.ResizeObserver = ResizeObserver;

/**
 * Mock Canvas API for Grafana UI components
 */
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  measureText: jest.fn(() => ({ width: 100 })),
  font: '',
}));

/**
 * Assign Text Decoder and Encoder which are required in @grafana/ui
 */
Object.assign(global, { TextDecoder, TextEncoder });

/**
 * Mock IntersectionObserver which is not available in jsdom
 */
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
