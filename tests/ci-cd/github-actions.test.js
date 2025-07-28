/**
 * GitHub Actions Workflow Tests
 * Tests for CI/CD pipeline workflows
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('GitHub Actions Workflows', () => {
  const workflowsDir = path.join(__dirname, '../../.github/workflows');

  describe('CI Workflow', () => {
    let ciWorkflow;

    beforeAll(() => {
      const ciWorkflowPath = path.join(workflowsDir, 'ci.yml');
      if (fs.existsSync(ciWorkflowPath)) {
        const ciWorkflowContent = fs.readFileSync(ciWorkflowPath, 'utf8');
        ciWorkflow = yaml.load(ciWorkflowContent);
      }
    });

    test('should have valid YAML syntax', () => {
      expect(ciWorkflow).toBeDefined();
      expect(typeof ciWorkflow).toBe('object');
    });

    test('should have correct trigger events', () => {
      expect(ciWorkflow.on).toBeDefined();
      expect(ciWorkflow.on.pull_request).toBeDefined();
      expect(ciWorkflow.on.push).toBeDefined();
      expect(ciWorkflow.on.pull_request.branches).toContain('main');
      expect(ciWorkflow.on.push.branches).toContain('main');
    });

    test('should have backend quality check job', () => {
      expect(ciWorkflow.jobs['backend-quality']).toBeDefined();
      expect(ciWorkflow.jobs['backend-quality']['runs-on']).toBe('ubuntu-latest');
    });

    test('should have frontend quality check job', () => {
      expect(ciWorkflow.jobs['frontend-quality']).toBeDefined();
      expect(ciWorkflow.jobs['frontend-quality']['runs-on']).toBe('ubuntu-latest');
    });

    test('should have backend tests job with dependencies', () => {
      expect(ciWorkflow.jobs['backend-tests']).toBeDefined();
      expect(ciWorkflow.jobs['backend-tests'].needs).toBe('backend-quality');
      expect(ciWorkflow.jobs['backend-tests'].services).toBeDefined();
      expect(ciWorkflow.jobs['backend-tests'].services.postgres).toBeDefined();
      expect(ciWorkflow.jobs['backend-tests'].services.redis).toBeDefined();
    });

    test('should have frontend tests job with dependencies', () => {
      expect(ciWorkflow.jobs['frontend-tests']).toBeDefined();
      expect(ciWorkflow.jobs['frontend-tests'].needs).toBe('frontend-quality');
    });

    test('should have security scan job', () => {
      expect(ciWorkflow.jobs['security-scan']).toBeDefined();
    });

    test('should have docker build job', () => {
      expect(ciWorkflow.jobs['docker-build']).toBeDefined();
      expect(ciWorkflow.jobs['docker-build'].needs).toEqual(['backend-tests', 'frontend-tests']);
      expect(ciWorkflow.jobs['docker-build'].strategy.matrix.service).toEqual(['backend', 'frontend']);
    });
  });

  describe('Deploy Workflow', () => {
    let deployWorkflow;

    beforeAll(() => {
      const deployWorkflowPath = path.join(workflowsDir, 'deploy.yml');
      if (fs.existsSync(deployWorkflowPath)) {
        const deployWorkflowContent = fs.readFileSync(deployWorkflowPath, 'utf8');
        deployWorkflow = yaml.load(deployWorkflowContent);
      }
    });

    test('should have valid YAML syntax', () => {
      expect(deployWorkflow).toBeDefined();
      expect(typeof deployWorkflow).toBe('object');
    });

    test('should have correct trigger events', () => {
      expect(deployWorkflow.on).toBeDefined();
      expect(deployWorkflow.on.push).toBeDefined();
      expect(deployWorkflow.on.workflow_dispatch).toBeDefined();
      expect(deployWorkflow.on.push.branches).toContain('main');
    });

    test('should have build and push job', () => {
      expect(deployWorkflow.jobs['build-and-push']).toBeDefined();
      expect(deployWorkflow.jobs['build-and-push'].strategy.matrix.service).toEqual(['backend', 'frontend']);
    });

    test('should have staging deployment job', () => {
      expect(deployWorkflow.jobs['deploy-staging']).toBeDefined();
      expect(deployWorkflow.jobs['deploy-staging'].needs).toBe('build-and-push');
      expect(deployWorkflow.jobs['deploy-staging'].environment).toBe('staging');
    });

    test('should have production deployment job', () => {
      expect(deployWorkflow.jobs['deploy-production']).toBeDefined();
      expect(deployWorkflow.jobs['deploy-production'].needs).toEqual(['build-and-push', 'deploy-staging']);
      expect(deployWorkflow.jobs['deploy-production'].environment).toBe('production');
    });
  });

  describe('Workflow Security', () => {
    test('should not contain hardcoded secrets', () => {
      const workflowFiles = fs.readdirSync(workflowsDir).filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
      
      workflowFiles.forEach(file => {
        const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        
        // Check for potential hardcoded secrets patterns
        const secretPatterns = [
          /password:\s*['"]?[^$\s]['"]?/i,
          /token:\s*['"]?[^$\s]['"]?/i,
          /key:\s*['"]?[^$\s]['"]?/i,
          /secret:\s*['"]?[^$\s]['"]?/i
        ];

        secretPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            // Allow ${{ secrets.* }} or ${{ github.* }} patterns
            const isGitHubSecret = matches[0].includes('${{');
            expect(isGitHubSecret).toBe(true);
          }
        });
      });
    });

    test('should use secure actions versions', () => {
      const workflowFiles = fs.readdirSync(workflowsDir).filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
      
      workflowFiles.forEach(file => {
        const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        const workflow = yaml.load(content);
        
        Object.values(workflow.jobs).forEach(job => {
          if (job.steps) {
            job.steps.forEach(step => {
              if (step.uses) {
                // Check if action uses a specific version (not 'main' or 'master')
                const actionParts = step.uses.split('@');
                if (actionParts.length > 1) {
                  const version = actionParts[1];
                  expect(version).not.toBe('main');
                  expect(version).not.toBe('master');
                  expect(version).toMatch(/^v\d+/); // Should start with v and number
                }
              }
            });
          }
        });
      });
    });
  });
});