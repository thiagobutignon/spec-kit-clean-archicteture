import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPInstaller } from './mcp-installer';
import * as childProcess from 'child_process';

// Mock child_process
vi.mock('child_process');

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
        .mockReturnValueOnce(Buffer.from(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation();

      expect(result).toEqual(['serena', 'context7', 'chrome-devtools']);
      expect(childProcess.execSync).toHaveBeenCalledWith('which claude', {
        stdio: 'pipe',
        timeout: 2000
      });
      expect(childProcess.execSync).toHaveBeenCalledWith('claude mcp list', {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 5000
      });
    });

    it('should handle empty MCP list', async () => {
      const mockOutput = 'No MCP servers configured. Use `claude mcp add` to add a server.';

      vi.spyOn(childProcess, 'execSync')
        .mockReturnValueOnce(Buffer.from('')) // which claude
        .mockReturnValueOnce(Buffer.from(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation();

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
        .mockReturnValueOnce(Buffer.from(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation();

      expect(result).toEqual(['serena', 'context7']);
      expect(result).not.toContain('unknown-server');
      expect(result).not.toContain('another-unknown');
    });

    it('should return empty array when claude CLI not found', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      vi.spyOn(childProcess, 'execSync').mockImplementationOnce(() => {
        throw new Error('which: no claude in PATH');
      });

      const result = await installer.verifyInstallation();

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

      const result = await installer.verifyInstallation();

      expect(result).toEqual([]);
    });

    it('should handle timeout errors', async () => {
      vi.spyOn(childProcess, 'execSync')
        .mockReturnValueOnce(Buffer.from('')) // which claude succeeds
        .mockImplementationOnce(() => {
          const error: any = new Error('Command timed out');
          error.code = 'ETIMEDOUT';
          throw error;
        });

      const result = await installer.verifyInstallation();

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
        .mockReturnValueOnce(Buffer.from(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation();

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
        .mockReturnValueOnce(Buffer.from(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation();

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
        .mockReturnValueOnce(Buffer.from(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation();

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
        .mockReturnValueOnce(Buffer.from(mockOutput)); // claude mcp list

      const result = await installer.verifyInstallation();

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
      const error: any = new Error('Installation failed');
      error.stderr = Buffer.from('Error: package not found');

      vi.spyOn(childProcess, 'execSync').mockImplementationOnce(() => {
        throw error;
      });

      await expect(installer.installSerena()).rejects.toThrow('Error: package not found');
    });
  });
});