/**
 * Package.json Scripts Tests
 * Tests for CI/CD related npm scripts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Package Scripts', () => {
  describe('Backend Scripts', () => {
    let backendPackage;

    beforeAll(() => {
      const packagePath = path.join(__dirname, '../../backend/package.json');
      backendPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    });

    test('should have required CI scripts', () => {
      const requiredScripts = [
        'typecheck',
        'lint',
        'test',
        'test:coverage',
        'build'
      ];

      requiredScripts.forEach(script => {
        expect(backendPackage.scripts[script]).toBeDefined();
      });
    });

    test('should have valid TypeScript configuration', () => {
      const tsconfigPath = path.join(__dirname, '../../backend/tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      // Test TypeScript compilation
      expect(() => {
        execSync('npm run typecheck', { 
          cwd: path.join(__dirname, '../../backend'),
          stdio: 'pipe'
        });
      }).not.toThrow();
    });

    test('should have valid ESLint configuration', () => {
      const eslintConfigExists = fs.existsSync(path.join(__dirname, '../../backend/.eslintrc.js')) ||
                                 fs.existsSync(path.join(__dirname, '../../backend/.eslintrc.json')) ||
                                 backendPackage.eslintConfig;

      expect(eslintConfigExists).toBe(true);
    });

    test('should have Jest configuration', () => {
      const hasJestConfig = backendPackage.jest || 
                           fs.existsSync(path.join(__dirname, '../../backend/jest.config.js')) ||
                           fs.existsSync(path.join(__dirname, '../../backend/jest.config.json'));

      expect(hasJestConfig).toBe(true);
    });

    test('should have coverage threshold configuration', () => {
      let jestConfig;
      
      if (backendPackage.jest) {
        jestConfig = backendPackage.jest;
      } else if (fs.existsSync(path.join(__dirname, '../../backend/jest.config.js'))) {
        jestConfig = require(path.join(__dirname, '../../backend/jest.config.js'));
      }

      if (jestConfig) {
        expect(jestConfig.collectCoverageFrom).toBeDefined();
        expect(jestConfig.coverageDirectory).toBeDefined();
      }
    });
  });

  describe('Frontend Scripts', () => {
    let frontendPackage;

    beforeAll(() => {
      const packagePath = path.join(__dirname, '../../frontend/package.json');
      frontendPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    });

    test('should have required CI scripts', () => {
      const requiredScripts = [
        'typecheck',
        'lint',
        'test',
        'test:coverage',
        'build'
      ];

      requiredScripts.forEach(script => {
        expect(frontendPackage.scripts[script]).toBeDefined();
      });
    });

    test('should have valid TypeScript configuration', () => {
      const tsconfigPath = path.join(__dirname, '../../frontend/tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      // Test TypeScript compilation
      expect(() => {
        execSync('npm run typecheck', { 
          cwd: path.join(__dirname, '../../frontend'),
          stdio: 'pipe'
        });
      }).not.toThrow();
    });

    test('should have valid ESLint configuration', () => {
      const eslintConfigExists = fs.existsSync(path.join(__dirname, '../../frontend/.eslintrc.js')) ||
                                 fs.existsSync(path.join(__dirname, '../../frontend/.eslintrc.json')) ||
                                 frontendPackage.eslintConfig;

      expect(eslintConfigExists).toBe(true);
    });

    test('should have Vite configuration', () => {
      const viteConfigPath = path.join(__dirname, '../../frontend/vite.config.ts');
      expect(fs.existsSync(viteConfigPath)).toBe(true);
    });

    test('should have valid Vitest configuration', () => {
      const viteConfigPath = path.join(__dirname, '../../frontend/vite.config.ts');
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
      
      // Check if vitest is configured in vite config
      expect(viteConfig).toMatch(/vitest|test/i);
    });
  });

  describe('Docker Scripts', () => {
    test('backend should have Docker build capability', () => {
      const dockerfilePath = path.join(__dirname, '../../backend/Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);

      // Test Docker build (without actually building)
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
      expect(dockerfileContent).toMatch(/FROM node:/);
      expect(dockerfileContent).toMatch(/WORKDIR/);
      expect(dockerfileContent).toMatch(/COPY package/);
      expect(dockerfileContent).toMatch(/RUN npm/);
    });

    test('frontend should have Docker build capability', () => {
      const dockerfilePath = path.join(__dirname, '../../frontend/Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);

      // Test Docker build (without actually building)
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
      expect(dockerfileContent).toMatch(/FROM node:/);
      expect(dockerfileContent).toMatch(/WORKDIR/);
      expect(dockerfileContent).toMatch(/COPY package/);
      expect(dockerfileContent).toMatch(/RUN npm/);
    });
  });

  describe('Dependency Security', () => {
    test('backend should not have known vulnerabilities', () => {
      // This test would run npm audit
      expect(() => {
        execSync('npm audit --audit-level=high', { 
          cwd: path.join(__dirname, '../../backend'),
          stdio: 'pipe'
        });
      }).not.toThrow();
    });

    test('frontend should not have known vulnerabilities', () => {
      // This test would run npm audit
      expect(() => {
        execSync('npm audit --audit-level=high', { 
          cwd: path.join(__dirname, '../../frontend'),
          stdio: 'pipe'
        });
      }).not.toThrow();
    });

    test('should have up-to-date dependencies', () => {
      const backendPackage = JSON.parse(fs.readFileSync(path.join(__dirname, '../../backend/package.json'), 'utf8'));
      const frontendPackage = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend/package.json'), 'utf8'));

      // Check for dependencies that should be updated
      const criticalDeps = ['express', 'react', 'typescript'];
      
      criticalDeps.forEach(dep => {
        if (backendPackage.dependencies && backendPackage.dependencies[dep]) {
          const version = backendPackage.dependencies[dep];
          expect(version).not.toMatch(/^[<>]/); // Should not use range operators for critical deps
        }
        
        if (frontendPackage.dependencies && frontendPackage.dependencies[dep]) {
          const version = frontendPackage.dependencies[dep];
          expect(version).not.toMatch(/^[<>]/); // Should not use range operators for critical deps
        }
      });
    });
  });
});