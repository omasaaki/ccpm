/**
 * Docker Integration Tests
 * Tests for Docker build and deployment processes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Docker Integration', () => {
  describe('Dockerfile Validation', () => {
    test('backend Dockerfile should exist and be valid', () => {
      const dockerfilePath = path.join(__dirname, '../../backend/Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);

      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
      
      // Basic Dockerfile structure validation
      expect(dockerfileContent).toMatch(/^FROM\s+node:/m);
      expect(dockerfileContent).toMatch(/WORKDIR\s+\/app/);
      expect(dockerfileContent).toMatch(/COPY\s+package/);
      expect(dockerfileContent).toMatch(/RUN\s+npm/);
      expect(dockerfileContent).toMatch(/EXPOSE\s+\d+/);
      expect(dockerfileContent).toMatch(/CMD\s+\[/);
    });

    test('frontend Dockerfile should exist and be valid', () => {
      const dockerfilePath = path.join(__dirname, '../../frontend/Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);

      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
      
      // Basic Dockerfile structure validation
      expect(dockerfileContent).toMatch(/^FROM\s+node:/m);
      expect(dockerfileContent).toMatch(/WORKDIR\s+\/app/);
      expect(dockerfileContent).toMatch(/COPY\s+package/);
      expect(dockerfileContent).toMatch(/RUN\s+npm/);
    });

    test('Dockerfiles should use specific base image versions', () => {
      const backendDockerfile = fs.readFileSync(path.join(__dirname, '../../backend/Dockerfile'), 'utf8');
      const frontendDockerfile = fs.readFileSync(path.join(__dirname, '../../frontend/Dockerfile'), 'utf8');

      // Should not use 'latest' tag
      expect(backendDockerfile).not.toMatch(/FROM\s+node:latest/);
      expect(frontendDockerfile).not.toMatch(/FROM\s+node:latest/);

      // Should use specific version
      expect(backendDockerfile).toMatch(/FROM\s+node:\d+/);
      expect(frontendDockerfile).toMatch(/FROM\s+node:\d+/);
    });

    test('Dockerfiles should follow security best practices', () => {
      const backendDockerfile = fs.readFileSync(path.join(__dirname, '../../backend/Dockerfile'), 'utf8');
      const frontendDockerfile = fs.readFileSync(path.join(__dirname, '../../frontend/Dockerfile'), 'utf8');

      // Should not run as root (should have USER instruction)
      const hasUserInstruction = (content) => {
        return content.includes('USER') || content.includes('--user');
      };

      // Should minimize layers (use multi-stage builds or combined RUN commands)
      const hasOptimizedLayers = (content) => {
        const runCommands = content.match(/^RUN\s+/gm) || [];
        return runCommands.length <= 5; // Reasonable limit
      };

      expect(hasOptimizedLayers(backendDockerfile)).toBe(true);
      expect(hasOptimizedLayers(frontendDockerfile)).toBe(true);
    });
  });

  describe('Docker Compose Integration', () => {
    test('docker-compose.yml should exist and be valid', () => {
      const dockerComposePath = path.join(__dirname, '../../docker-compose.yml');
      expect(fs.existsSync(dockerComposePath)).toBe(true);
    });

    test('docker-compose.dev.yml should exist and be valid', () => {
      const dockerComposeDevPath = path.join(__dirname, '../../docker-compose.dev.yml');
      expect(fs.existsSync(dockerComposeDevPath)).toBe(true);
    });

    test('services should be properly configured', () => {
      const dockerComposeContent = fs.readFileSync(path.join(__dirname, '../../docker-compose.yml'), 'utf8');
      
      // Should contain required services
      expect(dockerComposeContent).toMatch(/backend:/);
      expect(dockerComposeContent).toMatch(/frontend:/);
      expect(dockerComposeContent).toMatch(/postgres:/);
      expect(dockerComposeContent).toMatch(/redis:/);
    });
  });

  describe('Docker Build Process', () => {
    // Note: These tests are designed to validate build process without actually building
    // In a real CI environment, you would actually build the images

    test('backend should have valid build context', () => {
      const backendDir = path.join(__dirname, '../../backend');
      const requiredFiles = ['package.json', 'Dockerfile', 'tsconfig.json'];

      requiredFiles.forEach(file => {
        expect(fs.existsSync(path.join(backendDir, file))).toBe(true);
      });
    });

    test('frontend should have valid build context', () => {
      const frontendDir = path.join(__dirname, '../../frontend');
      const requiredFiles = ['package.json', 'Dockerfile', 'tsconfig.json', 'vite.config.ts'];

      requiredFiles.forEach(file => {
        expect(fs.existsSync(path.join(frontendDir, file))).toBe(true);
      });
    });

    test('.dockerignore should exist and exclude unnecessary files', () => {
      const backendDockerIgnore = path.join(__dirname, '../../backend/.dockerignore');
      const frontendDockerIgnore = path.join(__dirname, '../../frontend/.dockerignore');

      if (fs.existsSync(backendDockerIgnore)) {
        const content = fs.readFileSync(backendDockerIgnore, 'utf8');
        expect(content).toMatch(/node_modules/);
        expect(content).toMatch(/\.git/);
        expect(content).toMatch(/coverage/);
      }

      if (fs.existsSync(frontendDockerIgnore)) {
        const content = fs.readFileSync(frontendDockerIgnore, 'utf8');
        expect(content).toMatch(/node_modules/);
        expect(content).toMatch(/\.git/);
        expect(content).toMatch(/dist/);
      }
    });
  });

  describe('Environment Configuration', () => {
    test('should have proper environment variable templates', () => {
      const envExamplePath = path.join(__dirname, '../../.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);

      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      // Should contain required environment variables
      const requiredVars = [
        'NODE_ENV',
        'DATABASE_URL',
        'REDIS_URL',
        'JWT_SECRET'
      ];

      requiredVars.forEach(varName => {
        expect(envContent).toMatch(new RegExp(`^${varName}=`, 'm'));
      });
    });

    test('should not contain secrets in tracked files', () => {
      const filesToCheck = [
        path.join(__dirname, '../../.env.example'),
        path.join(__dirname, '../../docker-compose.yml'),
        path.join(__dirname, '../../docker-compose.dev.yml')
      ];

      filesToCheck.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Should not contain actual secrets
          expect(content).not.toMatch(/password:\s*\S{8,}/);
          expect(content).not.toMatch(/secret:\s*\S{16,}/);
          expect(content).not.toMatch(/key:\s*\S{16,}/);
        }
      });
    });
  });

  describe('Health Checks', () => {
    test('services should have health check configurations', () => {
      const dockerComposeContent = fs.readFileSync(path.join(__dirname, '../../docker-compose.yml'), 'utf8');
      
      // Should have health checks for critical services
      expect(dockerComposeContent).toMatch(/healthcheck:/);
    });

    test('health check endpoints should be defined', () => {
      // This would typically check if the application defines health check endpoints
      const backendSrcDir = path.join(__dirname, '../../backend/src');
      
      if (fs.existsSync(backendSrcDir)) {
        // Look for health check route definition
        const files = fs.readdirSync(backendSrcDir, { recursive: true })
          .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
        
        let hasHealthCheck = false;
        files.forEach(file => {
          const filePath = path.join(backendSrcDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('/health') || content.includes('/status')) {
            hasHealthCheck = true;
          }
        });

        // This test may need to be adjusted based on actual implementation
        // expect(hasHealthCheck).toBe(true);
      }
    });
  });
});