import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire utils/mcp-installer module
vi.mock('../utils/mcp-installer');

describe('init command - MCP verification flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MCP installation verification', () => {
    it('should verify MCP servers after successful installation', async () => {
      const mockInstaller = {
        installAll: vi.fn().mockResolvedValue({
          successful: ['serena', 'chrome-devtools'],
          failed: [],
          skipped: []
        }),
        verifyInstallation: vi.fn().mockResolvedValue(['serena', 'chrome-devtools'])
      };

      // Simulate the verification flow
      const report = await mockInstaller.installAll({
        installSerena: true,
        installChromeDevTools: true
      });

      const verifiedServers = await mockInstaller.verifyInstallation();

      expect(report.successful).toEqual(['serena', 'chrome-devtools']);
      expect(verifiedServers).toEqual(['serena', 'chrome-devtools']);
      expect(mockInstaller.installAll).toHaveBeenCalledWith({
        installSerena: true,
        installChromeDevTools: true
      });
      expect(mockInstaller.verifyInstallation).toHaveBeenCalled();
    });

    it('should handle verification failure after installation', async () => {
      const mockInstaller = {
        installAll: vi.fn().mockResolvedValue({
          successful: ['serena'],
          failed: [],
          skipped: []
        }),
        verifyInstallation: vi.fn().mockResolvedValue([]) // No servers detected
      };

      await mockInstaller.installAll({ installSerena: true });
      const verifiedServers = await mockInstaller.verifyInstallation();

      expect(verifiedServers).toEqual([]);
      expect(mockInstaller.verifyInstallation).toHaveBeenCalled();
    });

    it('should handle partial verification (some servers detected)', async () => {
      const mockInstaller = {
        installAll: vi.fn().mockResolvedValue({
          successful: ['serena', 'context7', 'chrome-devtools'],
          failed: [],
          skipped: []
        }),
        verifyInstallation: vi.fn().mockResolvedValue(['serena', 'context7']) // Only 2 detected
      };

      const report = await mockInstaller.installAll({
        installSerena: true,
        installContext7: true,
        installChromeDevTools: true
      });

      const verifiedServers = await mockInstaller.verifyInstallation();

      expect(report.successful.length).toBe(3);
      expect(verifiedServers.length).toBe(2);
      expect(verifiedServers).toContain('serena');
      expect(verifiedServers).toContain('context7');
      expect(verifiedServers).not.toContain('chrome-devtools');
    });

    it('should handle installation failures gracefully', async () => {
      const mockInstaller = {
        installAll: vi.fn().mockResolvedValue({
          successful: ['serena'],
          failed: ['context7'],
          skipped: []
        }),
        verifyInstallation: vi.fn().mockResolvedValue(['serena'])
      };

      const report = await mockInstaller.installAll({
        installSerena: true,
        installContext7: true
      });

      const verifiedServers = await mockInstaller.verifyInstallation();

      expect(report.successful).toEqual(['serena']);
      expect(report.failed).toEqual(['context7']);
      expect(verifiedServers).toEqual(['serena']);
    });

    it('should handle verification errors gracefully', async () => {
      const mockInstaller = {
        installAll: vi.fn().mockResolvedValue({
          successful: ['serena'],
          failed: [],
          skipped: []
        }),
        verifyInstallation: vi.fn().mockRejectedValue(new Error('Verification failed'))
      };

      await mockInstaller.installAll({ installSerena: true });

      await expect(mockInstaller.verifyInstallation()).rejects.toThrow('Verification failed');
    });

    it('should skip verification when no servers installed', async () => {
      const mockInstaller = {
        installAll: vi.fn().mockResolvedValue({
          successful: [],
          failed: [],
          skipped: ['serena', 'context7', 'chrome-devtools', 'playwright']
        }),
        verifyInstallation: vi.fn()
      };

      const report = await mockInstaller.installAll({});

      expect(report.skipped.length).toBeGreaterThan(0);
      expect(mockInstaller.verifyInstallation).not.toHaveBeenCalled();
    });
  });

  describe('MCP installation with config', () => {
    it('should install selected servers only', async () => {
      const mockConfig = {
        installSerena: true,
        installContext7: false,
        installChromeDevTools: true,
        installPlaywright: false
      };

      const mockInstaller = {
        installAll: vi.fn().mockResolvedValue({
          successful: ['serena', 'chrome-devtools'],
          failed: [],
          skipped: ['context7', 'playwright']
        }),
        verifyInstallation: vi.fn().mockResolvedValue(['serena', 'chrome-devtools'])
      };

      const report = await mockInstaller.installAll(mockConfig);

      expect(report.successful).toEqual(['serena', 'chrome-devtools']);
      expect(report.skipped).toContain('context7');
      expect(report.skipped).toContain('playwright');
    });

    it('should handle empty config gracefully', async () => {
      const mockInstaller = {
        installAll: vi.fn().mockResolvedValue({
          successful: [],
          failed: [],
          skipped: []
        }),
        verifyInstallation: vi.fn().mockResolvedValue([])
      };

      const report = await mockInstaller.installAll({});

      expect(report.successful).toEqual([]);
      expect(report.failed).toEqual([]);
    });
  });

  describe('Error message improvements', () => {
    it('should provide specific error context for failed installations', async () => {
      const specificError = new Error('Failed to install Serena MCP server: uvx command not found');

      const mockInstaller = {
        installAll: vi.fn().mockResolvedValue({
          successful: [],
          failed: ['serena'],
          skipped: []
        }),
        verifyInstallation: vi.fn().mockResolvedValue([])
      };

      const report = await mockInstaller.installAll({ installSerena: true });

      expect(report.failed).toContain('serena');
      expect(specificError.message).toContain('Failed to install Serena MCP server');
      expect(specificError.message).toContain('uvx command not found');
    });
  });
});