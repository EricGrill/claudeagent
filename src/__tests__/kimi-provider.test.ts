import { KimiProvider, KimiProviderConfig, KimiError, KimiErrorCode } from '../providers';

describe('KimiProvider', () => {
  describe('constructor', () => {
    it('should create provider with default configuration', () => {
      const provider = new KimiProvider();
      const config = provider.getConfig();

      expect(config.kimiBinary).toBe('kimi');
      expect(config.outputFormat).toBe('stream-json');
      expect(config.timeout).toBe(300000);
      expect(config.maxBuffer).toBe(10 * 1024 * 1024);
      expect(config.dryRun).toBe(false);
    });

    it('should merge custom configuration with defaults', () => {
      const provider = new KimiProvider({
        kimiBinary: '/custom/path/kimi',
        model: 'kimi-code/kimi-for-coding',
        timeout: 60000,
      });
      const config = provider.getConfig();

      expect(config.kimiBinary).toBe('/custom/path/kimi');
      expect(config.model).toBe('kimi-code/kimi-for-coding');
      expect(config.timeout).toBe(60000);
      expect(config.outputFormat).toBe('stream-json'); // default preserved
    });

    it('should throw error for conflicting session options', () => {
      expect(() => {
        new KimiProvider({
          continueSession: true,
          sessionId: 'abc123',
        });
      }).toThrow(KimiError);
    });
  });

  describe('withConfig', () => {
    it('should return new provider with merged config', () => {
      const provider1 = new KimiProvider({ model: 'model1' });
      const provider2 = provider1.withConfig({ timeout: 60000 });

      expect(provider1.getConfig().timeout).toBe(300000);
      expect(provider2.getConfig().timeout).toBe(60000);
      expect(provider2.getConfig().model).toBe('model1');
    });
  });

  describe('dry-run mode', () => {
    it('should return command without execution in dry-run mode', async () => {
      const provider = new KimiProvider({ dryRun: true });
      const result = await provider.execute({
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.stdout).toContain('[DRY-RUN]');
      expect(result.stdout).toContain('kimi');
      expect(result.stdout).toContain('-p');
      expect(result.stdout).toContain('Test prompt');
    });

    it('should include all configured options in dry-run output', async () => {
      const provider = new KimiProvider({
        dryRun: true,
        model: 'custom-model',
        additionalDirs: ['/path/to/dir'],
        skillsDirs: ['/path/to/skills'],
      });
      const result = await provider.execute({
        prompt: 'Test prompt',
      });

      expect(result.stdout).toContain('--model');
      expect(result.stdout).toContain('custom-model');
      expect(result.stdout).toContain('--add-dir');
      expect(result.stdout).toContain('--skills-dir');
    });
  });

  describe('argument building', () => {
    it('should build correct arguments for basic prompt', async () => {
      const provider = new KimiProvider({ dryRun: true });
      const result = await provider.execute({
        prompt: 'Hello world',
      });

      expect(result.args).toContain('-p');
      expect(result.args).toContain('Hello world');
      expect(result.args).toContain('--output-format');
      expect(result.args).toContain('stream-json');
    });

    it('should include model flag when specified', async () => {
      const provider = new KimiProvider({
        dryRun: true,
        model: 'kimi-code/kimi-for-coding',
      });
      const result = await provider.execute({
        prompt: 'Test',
      });

      expect(result.args).toContain('--model');
      expect(result.args).toContain('kimi-code/kimi-for-coding');
    });

    it('should include --continue flag when continueSession is true', async () => {
      const provider = new KimiProvider({
        dryRun: true,
        continueSession: true,
      });
      const result = await provider.execute({
        prompt: 'Test',
      });

      expect(result.args).toContain('--continue');
    });

    it('should include --session flag with ID when sessionId is specified', async () => {
      const provider = new KimiProvider({
        dryRun: true,
        sessionId: '01HZ123XYZ',
      });
      const result = await provider.execute({
        prompt: 'Test',
      });

      expect(result.args).toContain('--session');
      expect(result.args).toContain('01HZ123XYZ');
    });

    it('should include multiple --add-dir flags', async () => {
      const provider = new KimiProvider({
        dryRun: true,
        additionalDirs: ['/dir1', '/dir2'],
      });
      const result = await provider.execute({
        prompt: 'Test',
      });

      const addDirCount = result.args.filter(a => a === '--add-dir').length;
      expect(addDirCount).toBe(2);
      expect(result.args).toContain('/dir1');
      expect(result.args).toContain('/dir2');
    });

    it('should include multiple --skills-dir flags', async () => {
      const provider = new KimiProvider({
        dryRun: true,
        skillsDirs: ['/skills1', '/skills2'],
      });
      const result = await provider.execute({
        prompt: 'Test',
      });

      const skillsDirCount = result.args.filter(a => a === '--skills-dir').length;
      expect(skillsDirCount).toBe(2);
    });
  });

  describe('job-level config override', () => {
    it('should allow job to override provider config', async () => {
      const provider = new KimiProvider({
        dryRun: true,
        model: 'provider-model',
      });
      const result = await provider.execute({
        prompt: 'Test',
        config: {
          model: 'job-model',
        },
      });

      expect(result.args).toContain('job-model');
      expect(result.args).not.toContain('provider-model');
    });
  });

  describe('formatResultForReport', () => {
    it('should format successful result', () => {
      const result = {
        success: true,
        exitCode: 0,
        stdout: 'Output content',
        stderr: 'Debug info',
        durationMs: 1234,
        command: 'kimi',
        args: ['-p', 'Test prompt', '--output-format', 'stream-json'],
        dryRun: false,
      };

      const report = KimiProvider.formatResultForReport(result);

      expect(report).toContain('✅ Success');
      expect(report).toContain('1234ms');
      expect(report).toContain('Exit Code**: 0');
      expect(report).toContain('Output content');
      expect(report).toContain('Debug info');
    });

    it('should format failed result with error', () => {
      const result = {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: 'Error occurred',
        durationMs: 500,
        command: 'kimi',
        args: ['-p', 'Test'],
        dryRun: false,
        error: 'Binary not found',
      };

      const report = KimiProvider.formatResultForReport(result);

      expect(report).toContain('❌ Failed');
      expect(report).toContain('Binary not found');
    });

    it('should indicate dry-run in report', () => {
      const result = {
        success: true,
        exitCode: 0,
        stdout: '[DRY-RUN] Would execute...',
        stderr: '',
        durationMs: 10,
        command: 'kimi',
        args: ['-p', 'Test'],
        dryRun: true,
      };

      const report = KimiProvider.formatResultForReport(result);

      expect(report).toContain('Dry Run**: Yes');
    });

    it('should include parsed message counts', () => {
      const result = {
        success: true,
        exitCode: 0,
        stdout: '{"type":"assistant"}\n{"type":"tool"}',
        stderr: '',
        durationMs: 1000,
        command: 'kimi',
        args: ['-p', 'Test'],
        dryRun: false,
        messages: [
          { type: 'assistant' as const, content: 'Hello' },
          { type: 'tool' as const, name: 'read_file' },
        ],
      };

      const report = KimiProvider.formatResultForReport(result);

      expect(report).toContain('2 message(s)');
      expect(report).toContain('Assistant: 1');
      expect(report).toContain('Tool: 1');
    });
  });

  describe('KimiError', () => {
    it('should create error with code and message', () => {
      const error = new KimiError(
        KimiErrorCode.BINARY_NOT_FOUND,
        'Kimi binary not found'
      );

      expect(error.code).toBe(KimiErrorCode.BINARY_NOT_FOUND);
      expect(error.message).toBe('Kimi binary not found');
      expect(error.name).toBe('KimiError');
    });

    it('should include details when provided', () => {
      const error = new KimiError(
        KimiErrorCode.TIMEOUT,
        'Execution timed out',
        { timeout: 5000, pid: 12345 }
      );

      expect(error.details).toEqual({ timeout: 5000, pid: 12345 });
    });
  });
});

describe('KimiProvider integration', () => {
  // These tests require actual Kimi CLI installation
  // They are skipped by default and can be enabled for local testing

  describe.skip('validateBinary', () => {
    it('should succeed if kimi is in PATH', async () => {
      const provider = new KimiProvider();
      await expect(provider.validateBinary()).resolves.not.toThrow();
    });

    it('should throw for non-existent binary path', async () => {
      const provider = new KimiProvider({
        kimiBinary: '/non/existent/path/kimi',
      });
      await expect(provider.validateBinary()).rejects.toThrow(KimiError);
    });
  });

  describe.skip('execute with real CLI', () => {
    it('should execute simple prompt', async () => {
      const provider = new KimiProvider({
        timeout: 60000,
      });

      const result = await provider.execute({
        prompt: 'What is 2 + 2? Reply with just the number.',
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });
  });
});
