// Mock for d3 modules that use ES modules
module.exports = {
  interpolate: jest.fn(),
  color: jest.fn(),
  format: jest.fn(),
  timeFormat: jest.fn(),
  timeParse: jest.fn(),
  scaleLinear: jest.fn(),
  scaleTime: jest.fn(),
  extent: jest.fn(),
  max: jest.fn(),
  min: jest.fn(),
};
