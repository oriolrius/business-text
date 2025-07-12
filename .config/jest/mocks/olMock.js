// Mock for OpenLayers (ol) library
module.exports = {
  Feature: jest.fn(),
  format: {
    WKT: jest.fn(),
    GeoJSON: jest.fn(),
  },
  proj: {
    transform: jest.fn(),
    fromLonLat: jest.fn(),
    toLonLat: jest.fn(),
  },
  geom: {
    Point: jest.fn(),
    LineString: jest.fn(),
    Polygon: jest.fn(),
  },
  style: {
    Style: jest.fn(),
    Fill: jest.fn(),
    Stroke: jest.fn(),
    Circle: jest.fn(),
  },
  layer: {
    Vector: jest.fn(),
    Tile: jest.fn(),
  },
  source: {
    Vector: jest.fn(),
    OSM: jest.fn(),
  },
  Map: jest.fn(),
  View: jest.fn(),
  control: {
    defaults: jest.fn(() => []),
  },
};
