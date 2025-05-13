import { parseTestStats } from '../utils.js';
import { jest } from '@jest/globals';

describe('parseTestStats', () => {
  it('should correctly parse test statistics', () => {
    const stats = {
      suites: 'Test Suites: 2 failed, 8 passed, 10 total',
      tests: 'Tests: 5 failed, 95 passed, 100 total',
      time: 'Time: 10.5s'
    };
    
    const result = parseTestStats(stats);
    
    expect(result).toEqual({
      suitesFailed: 2,
      suitesPassed: 8,
      testsFailed: 5,
      testsPassed: 95
    });
  });

  it('should handle empty statistics', () => {
    const stats = {
      suites: '',
      tests: '',
      time: ''
    };
    
    const result = parseTestStats(stats);
    
    expect(result).toEqual({
      suitesFailed: 0,
      suitesPassed: 0,
      testsFailed: 0,
      testsPassed: 0
    });
  });
});