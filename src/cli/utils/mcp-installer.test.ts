import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPInstaller, MCPAlreadyExistsError } from './mcp-installer';
import * as childProcess from 'child_process';

// Mock child_process
vi.mock('child_process');

// Helper to mock execSync properly for string encoding
const mockExecSyncWithString = (output: string): string | Buffer => output;

describe('MCPInstaller', () => {
  let installer: MCPInstaller;
  const testProjectPath = '/test/project';

  beforeEach(() => {
    installer = new MCPInstaller(testProjectPath);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyInstallation', () => {
    it('should detect installed MCP servers correctly', async () => {
      const mockOutput = `
  serena    Connected
  context7    Available
  chrome-devtools    Connected
`;

      vi.spyOn(childProcess, 'execSync')
        .mockReturnValueOnce(Buffer.from('')) // which claude
        .mockReturnValueOnce(mockExecSyncWithString(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation(0); // No retries for faster tests

      expect(result).toEqual(['serena', 'context7', 'chrome-devtools']);
      expect(childProcess.execSync).toHaveBeenCalledWith('which claude', {
        stdio: 'pipe',
        timeout: expect.any(Number)
      });
      expect(childProcess.execSync).toHaveBeenCalledWith('claude mcp list', {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: expect.any(Number)
      });
    });

    it('should handle empty MCP list', async () => {
      const mockOutput = 'No MCP servers configured. Use `claude mcp add` to add a server.';

      vi.spyOn(childProcess, 'execSync')
        .mockReturnValueOnce(Buffer.from('')) // which claude
        .mockReturnValueOnce(mockExecSyncWithString(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation(0); // No retries for faster tests

      expect(result).toEqual([]);
    });

    it('should filter out unknown servers', async () => {
      const mockOutput = `
  serena    Connected
  unknown-server    Connected
  context7    Available
  another-unknown    Connected
`;

      vi.spyOn(childProcess, 'execSync')
        .mockReturnValueOnce(Buffer.from('')) // which claude
        .mockReturnValueOnce(mockExecSyncWithString(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation(0); // No retries for faster tests

      expect(result).toEqual(['serena', 'context7']);
      expect(result).not.toContain('unknown-server');
      expect(result).not.toContain('another-unknown');
    });

    it('should return empty array when claude CLI not found', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      vi.spyOn(childProcess, 'execSync').mockImplementationOnce(() => {
        throw new Error('which: no claude in PATH');
      });

      const result = await installer.verifyInstallation(0); // No retries for faster tests

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Claude CLI not found')
      );

      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(childProcess, 'execSync')
        .mockReturnValueOnce(Buffer.from('')) // which claude succeeds
        .mockImplementationOnce(() => {
          throw new Error('Command failed');
        });

      const result = await installer.verifyInstallation(0); // No retries for faster tests

      expect(result).toEqual([]);
    });

    it('should handle timeout errors', async () => {
      vi.spyOn(childProcess, 'execSync')
        .mockReturnValueOnce(Buffer.from('')) // which claude succeeds
        .mockImplementationOnce(() => {
          const error = new Error('Command timed out') as NodeJS.ErrnoException;
          error.code = 'ETIMEDOUT';
          throw error;
        });

      const result = await installer.verifyInstallation(0); // No retries for faster tests

      expect(result).toEqual([]);
    });

    it('should not detect false positives from error messages', async () => {
      const mockOutput = `
Error: Failed to install serena
Failed to connect to context7
chrome-devtools installation failed
`;

      vi.spyOn(childProcess, 'execSync')
        .mockReturnValueOnce(Buffer.from('')) // which claude
        .mockReturnValueOnce(mockExecSyncWithString(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation(0); // No retries for faster tests

      // Should not detect any servers since they're in error messages
      expect(result).toEqual([]);
    });

    it('should remove duplicate server entries', async () => {
      const mockOutput = `
  serena    Connected
  serena    Connected
  context7    Available
`;

      vi.spyOn(childProcess, 'execSync')
        .mockReturnValueOnce(Buffer.from('')) // which claude
        .mockReturnValueOnce(mockExecSyncWithString(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation(0); // No retries for faster tests

      expect(result).toEqual(['serena', 'context7']);
      expect(result.filter(s => s === 'serena')).toHaveLength(1);
    });

    it('should handle all supported MCP servers', async () => {
      const mockOutput = `
  serena    Connected
  context7    Available
  chrome-devtools    Connected
  playwright    configured
`;

      vi.spyOn(childProcess, 'execSync')
        .mockReturnValueOnce(Buffer.from('')) // which claude
        .mockReturnValueOnce(mockExecSyncWithString(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation(0); // No retries for faster tests

      expect(result).toEqual(['serena', 'context7', 'chrome-devtools', 'playwright']);
    });

    it('should handle different status formats', async () => {
      const mockOutput = `
  serena    Connected
  context7    Available
  chrome-devtools    configured
`;

      vi.spyOn(childProcess, 'execSync')
        .mockReturnValueOnce(Buffer.from('')) // which claude
        .mockReturnValueOnce(mockExecSyncWithString(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation(0); // No retries for faster tests

      expect(result).toEqual(['serena', 'context7', 'chrome-devtools']);
    });
  });

  describe('installSerena', () => {
    it('should use correct command for Serena installation', async () => {
      vi.spyOn(childProcess, 'execSync').mockReturnValue(Buffer.from(''));

      await installer.installSerena();

      expect(childProcess.execSync).toHaveBeenCalledWith(
        expect.stringContaining('uvx --from git+https://github.com/oraios/serena'),
        expect.any(Object)
      );
      expect(childProcess.execSync).toHaveBeenCalledWith(
        expect.stringContaining('serena start-mcp-server --context ide-assistant --project'),
        expect.any(Object)
      );
    });

    it('should quote project path with spaces', async () => {
      const installerWithSpaces = new MCPInstaller('/path with spaces/project');
      vi.spyOn(childProcess, 'execSync').mockReturnValue(Buffer.from(''));

      await installerWithSpaces.installSerena();

      expect(childProcess.execSync).toHaveBeenCalledWith(
        expect.stringContaining('"/path with spaces/project"'),
        expect.any(Object)
      );
    });

    it('should throw error on installation failure', async () => {
      interface ExecError extends Error {
        stderr: Buffer;
      }
      const error = new Error('Installation failed') as ExecError;
      error.stderr = Buffer.from('Error: package not found');

      vi.spyOn(childProcess, 'execSync').mockImplementationOnce(() => {
        throw error;
      });

      await expect(installer.installSerena()).rejects.toThrow('Error: package not found');
    });

    it('should throw MCPAlreadyExistsError when server already exists', async () => {
      interface ExecError extends Error {
        stderr: Buffer;
      }
      const error = new Error('Installation failed') as ExecError;
      error.stderr = Buffer.from('MCP server serena already exists in local config');

      vi.spyOn(childProcess, 'execSync').mockImplementation(() => {
        throw error;
      });

      await expect(installer.installSerena()).rejects.toThrow(MCPAlreadyExistsError);
      await expect(installer.installSerena()).rejects.toThrow('MCP server serena already exists');
    });
  });

  describe('installContext7', () => {
    it('should throw MCPAlreadyExistsError when server already exists', async () => {
      interface ExecError extends Error {
        stderr: Buffer;
      }
      const error = new Error('Installation failed') as ExecError;
      error.stderr = Buffer.from('MCP server context7 already exists in local config');

      vi.spyOn(childProcess, 'execSync').mockImplementation(() => {
        throw error;
      });

      await expect(installer.installContext7('test-api-key')).rejects.toThrow(MCPAlreadyExistsError);
      await expect(installer.installContext7('test-api-key')).rejects.toThrow('MCP server context7 already exists');
    });
  });

  describe('installChromeDevTools', () => {
    it('should throw MCPAlreadyExistsError when server already exists', async () => {
      interface ExecError extends Error {
        stderr: Buffer;
      }
      const error = new Error('Installation failed') as ExecError;
      error.stderr = Buffer.from('MCP server chrome-devtools already exists in local config');

      vi.spyOn(childProcess, 'execSync').mockImplementation(() => {
        throw error;
      });

      await expect(installer.installChromeDevTools()).rejects.toThrow(MCPAlreadyExistsError);
      await expect(installer.installChromeDevTools()).rejects.toThrow('MCP server chrome-devtools already exists');
    });
  });

  describe('installPlaywright', () => {
    it('should throw MCPAlreadyExistsError when server already exists', async () => {
      interface ExecError extends Error {
        stderr: Buffer;
      }
      const error = new Error('Installation failed') as ExecError;
      error.stderr = Buffer.from('MCP server playwright already exists in local config');

      vi.spyOn(childProcess, 'execSync').mockImplementation(() => {
        throw error;
      });

      await expect(installer.installPlaywright()).rejects.toThrow(MCPAlreadyExistsError);
      await expect(installer.installPlaywright()).rejects.toThrow('MCP server playwright already exists');
    });
  });

  describe('installAll', () => {
    it('should handle already exists errors as skipped', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      interface ExecError extends Error {
        stderr: Buffer;
      }
      const error = new Error('Installation failed') as ExecError;
      error.stderr = Buffer.from('MCP server serena already exists in local config');

      vi.spyOn(childProcess, 'execSync').mockImplementationOnce(() => {
        throw error;
      });

      const report = await installer.installAll({ installSerena: true });

      expect(report.skipped).toContain('serena (already installed)');
      expect(report.failed).not.toContain('serena');
      expect(report.successful).not.toContain('serena');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏭️  Serena - Already installed (skipped)')
      );

      consoleSpy.mockRestore();
    });

    it('should handle multiple already exists errors correctly', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      interface ExecError extends Error {
        stderr: Buffer;
      }
      const serenaError = new Error('Installation failed') as ExecError;
      serenaError.stderr = Buffer.from('MCP server serena already exists in local config');

      const chromeError = new Error('Installation failed') as ExecError;
      chromeError.stderr = Buffer.from('MCP server chrome-devtools already exists in local config');

      vi.spyOn(childProcess, 'execSync')
        .mockImplementationOnce(() => { throw serenaError; })
        .mockImplementationOnce(() => { throw chromeError; });

      const report = await installer.installAll({
        installSerena: true,
        installChromeDevTools: true
      });

      expect(report.skipped).toContain('serena (already installed)');
      expect(report.skipped).toContain('chrome-devtools (already installed)');
      expect(report.failed).toHaveLength(0);
      expect(report.successful).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('should differentiate between genuine failures and already exists', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      interface ExecError extends Error {
        stderr: Buffer;
      }
      const alreadyExistsError = new Error('Installation failed') as ExecError;
      alreadyExistsError.stderr = Buffer.from('MCP server serena already exists in local config');

      const realError = new Error('Installation failed') as ExecError;
      realError.stderr = Buffer.from('Error: network timeout');

      vi.spyOn(childProcess, 'execSync')
        .mockImplementationOnce(() => { throw alreadyExistsError; })
        .mockImplementationOnce(() => { throw realError; });

      const report = await installer.installAll({
        installSerena: true,
        installChromeDevTools: true
      });

      expect(report.skipped).toContain('serena (already installed)');
      expect(report.failed).toContain('chrome-devtools');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏭️  Serena - Already installed (skipped)')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Chrome DevTools installation failed')
      );

      consoleSpy.mockRestore();
    });
  });
});