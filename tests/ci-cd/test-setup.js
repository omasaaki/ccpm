/**
 * Test Setup for CI/CD Tests
 * Common configuration and utilities for CI/CD testing
 */

const path = require('path');

// Global test configuration
global.TEST_TIMEOUT = 30000; // 30 seconds for integration tests

// Common paths
global.PROJECT_ROOT = path.join(__dirname, '../..');
global.BACKEND_DIR = path.join(global.PROJECT_ROOT, 'backend');
global.FRONTEND_DIR = path.join(global.PROJECT_ROOT, 'frontend');
global.WORKFLOWS_DIR = path.join(global.PROJECT_ROOT, '.github/workflows');

// Test utilities
global.testUtils = {
  // Check if running in CI environment
  isCI: () => {
    return process.env.CI === 'true' || 
           process.env.GITHUB_ACTIONS === 'true' ||
           process.env.NODE_ENV === 'test';
  },

  // Mock GitHub Actions environment
  mockGitHubEnvironment: () => {
    process.env.GITHUB_ACTIONS = 'true';
    process.env.GITHUB_WORKFLOW = 'CI';
    process.env.GITHUB_EVENT_NAME = 'pull_request';
    process.env.GITHUB_REPOSITORY = 'omasaaki/ccpm';
    process.env.GITHUB_REF = 'refs/heads/feature/ci-cd';
    process.env.GITHUB_SHA = 'abc123def456';
  },

  // Clean up environment
  cleanupEnvironment: () => {
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITHUB_WORKFLOW;
    delete process.env.GITHUB_EVENT_NAME;
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.GITHUB_REF;
    delete process.env.GITHUB_SHA;
  },

  // Validate YAML syntax
  validateYAML: (yamlString) => {
    try {
      const yaml = require('js-yaml');
      yaml.load(yamlString);
      return true;
    } catch (error) {
      console.error('YAML validation error:', error.message);
      return false;
    }
  },

  // Execute command safely
  safeExec: (command, options = {}) => {
    const { execSync } = require('child_process');
    try {
      return execSync(command, {
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 10000,
        ...options
      });
    } catch (error) {
      console.error(`Command failed: ${command}`);
      console.error(error.message);
      throw error;
    }
  },

  // Check if Docker is available
  isDockerAvailable: () => {
    try {
      global.testUtils.safeExec('docker --version');
      return true;
    } catch (error) {
      return false;
    }
  },

  // Check if npm/node is properly configured
  checkNodeEnvironment: (directory) => {
    const fs = require('fs');
    const packageJsonPath = path.join(directory, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return { valid: false, error: 'package.json not found' };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check required fields
      const requiredFields = ['name', 'version', 'scripts'];
      for (const field of requiredFields) {
        if (!packageJson[field]) {
          return { valid: false, error: `Missing required field: ${field}` };
        }
      }

      return { valid: true, packageJson };
    } catch (error) {
      return { valid: false, error: `Invalid package.json: ${error.message}` };
    }
  },

  // Generate test data
  generateTestData: () => {
    return {
      mockSecrets: {
        DOCKER_REGISTRY_USER: 'testuser',
        DOCKER_REGISTRY_TOKEN: 'testtoken123',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'test-jwt-secret-key-12345'
      },
      mockEnvironment: {
        NODE_ENV: 'test',
        CI: 'true',
        GITHUB_ACTIONS: 'true'
      }
    };
  }
};

// Jest setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Mock GitHub environment if needed
  if (!process.env.GITHUB_ACTIONS) {
    global.testUtils.mockGitHubEnvironment();
  }
});

afterAll(() => {
  // Cleanup
  global.testUtils.cleanupEnvironment();
});

// Configure Jest timeout
jest.setTimeout(global.TEST_TIMEOUT);

module.exports = global.testUtils;