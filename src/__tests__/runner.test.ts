import { RunnerConfig } from '../types.js';
import { runParallelTests } from '../runner.js';
import path from 'path';
import fs from 'fs';
import { jest } from '@jest/globals';

// Mock fs and child_process
jest.mock('fs/promises');
jest.mock('child_process');

describe('runParallelTests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Setup common mocks
    jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
    
    // Mock process.env
    process.env = { ...process.env };
  });

  it('should set NODE_OPTIONS with memory size', async () => {
    // Setup
    const config: RunnerConfig = {
      numShards: 4,
      memorySize: 8192
    };
    
    // Mock functions to make the test pass without executing commands
    require('child_process').spawn.mockReturnValue({
      on: jest.fn((event, callback) => event === 'close' && callback(0)),
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() }
    });
    
    require('fs/promises').readFile.mockResolvedValue('test1.js\ntest2.js');
    require('fs/promises').writeFile.mockResolvedValue(undefined);
    
    // Execute
    await runParallelTests(config);
    
    // Verify
    expect(process.env.NODE_OPTIONS).toBe('--max-old-space-size=8192');
  });

  // Add more tests for other functionality
});