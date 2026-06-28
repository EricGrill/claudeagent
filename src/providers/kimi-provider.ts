/**
 * Kimi CLI Provider
 * 
 * Executes prompts using the Kimi Code CLI (kimi-code).
 * 
 * ## Target CLI Specification
 * 
 * - **CLI Name**: kimi-code (Kimi Code CLI)
 * - **Minimum Version**: 0.20.0
 * - **Repository**: https://github.com/MoonshotAI/kimi-code
 * - **Installation**: 
 *   - Script: `curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash`
 *   - npm: `npm install -g @moonshot-ai/kimi-code`
 * 
 * ## Command Format
 * 
 * Non-interactive execution (used by this provider):
 * ```
 * kimi -p "<prompt>" [--output-format text|stream-json] [--model <alias>] [--add-dir <path>]...
 * ```
 * 
 * In `-p` mode:
 * - No TUI is opened
 * - Auto permission policy is used (no human approval)
 * - Thinking/tool progress goes to stderr
 * - Assistant output goes to stdout
 * - Static deny rules remain in effect
 * 
 * ## Output Formats
 * 
 * - `text` (default): Human-readable transcript, `• ` prefix on each line
 * - `stream-json`: One JSON object per line, suitable for parsing
 * 
 * @see https://moonshotai.github.io/kimi-code/en/reference/kimi-command.html
 */

import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import { access, constants } from 'fs/promises';
import { resolve, isAbsolute } from 'path';
import {
  KimiProviderConfig,
  KimiJob,
  KimiExecutionResult,
  KimiStreamMessage,
  KimiError,
  KimiErrorCode,
} from '../types/kimi';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<Pick<KimiProviderConfig, 
  'kimiBinary' | 'outputFormat' | 'timeout' | 'maxBuffer' | 'dryRun'
>> = {
  kimiBinary: 'kimi',
  outputFormat: 'stream-json',
  timeout: 300000, // 5 minutes
  maxBuffer: 10 * 1024 * 1024, // 10MB
  dryRun: false,
};

export class KimiProvider {
  private readonly config: KimiProviderConfig;

  constructor(config: KimiProviderConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.validateConfig();
  }

  /**
   * Validates the provider configuration
   * @throws {KimiError} If configuration is invalid
   */
  private validateConfig(): void {
    const { continueSession, sessionId } = this.config;

    if (continueSession && sessionId) {
      throw new KimiError(
        KimiErrorCode.INVALID_CONFIG,
        'Cannot use both continueSession and sessionId - they are mutually exclusive'
      );
    }
  }

  /**
   * Checks if the Kimi binary exists and is executable
   * @throws {KimiError} If binary is missing or not executable
   */
  async validateBinary(): Promise<void> {
    const binary = this.config.kimiBinary ?? DEFAULT_CONFIG.kimiBinary;

    // If it's an absolute path, check it directly
    if (isAbsolute(binary)) {
      try {
        await access(binary, constants.F_OK);
      } catch {
        throw new KimiError(
          KimiErrorCode.BINARY_NOT_FOUND,
          `Kimi binary not found at: ${binary}`,
          { binary }
        );
      }

      try {
        await access(binary, constants.X_OK);
      } catch {
        throw new KimiError(
          KimiErrorCode.BINARY_NOT_EXECUTABLE,
          `Kimi binary exists but is not executable: ${binary}`,
          { binary }
        );
      }
      return;
    }

    // For non-absolute paths, try to find in PATH using 'which'
    try {
      await this.runCommand('which', [binary], { timeout: 5000 });
    } catch {
      throw new KimiError(
        KimiErrorCode.BINARY_NOT_FOUND,
        `Kimi binary '${binary}' not found in PATH. Install with: npm install -g @moonshot-ai/kimi-code`,
        { binary }
      );
    }
  }

  /**
   * Executes a Kimi job with the configured settings
   */
  async execute(job: KimiJob): Promise<KimiExecutionResult> {
    const mergedConfig = { ...this.config, ...job.config };
    const binary = mergedConfig.kimiBinary ?? DEFAULT_CONFIG.kimiBinary;
    const dryRun = mergedConfig.dryRun ?? DEFAULT_CONFIG.dryRun;
    const startTime = Date.now();

    // Build command arguments
    const args = this.buildArgs(job.prompt, mergedConfig);

    // Prepare result object
    const result: KimiExecutionResult = {
      success: false,
      exitCode: null,
      stdout: '',
      stderr: '',
      durationMs: 0,
      command: binary,
      args,
      dryRun,
    };

    // Dry-run mode: just return the command that would be executed
    if (dryRun) {
      result.success = true;
      result.exitCode = 0;
      result.durationMs = Date.now() - startTime;
      result.stdout = `[DRY-RUN] Would execute: ${binary} ${args.map(a => this.shellQuote(a)).join(' ')}`;
      return result;
    }

    // Validate binary before execution
    try {
      await this.validateBinary();
    } catch (error) {
      result.durationMs = Date.now() - startTime;
      if (error instanceof KimiError) {
        result.error = error.message;
      } else {
        result.error = String(error);
      }
      return result;
    }

    // Execute the command
    try {
      const { stdout, stderr, exitCode } = await this.runKimi(binary, args, mergedConfig);
      
      result.stdout = stdout;
      result.stderr = stderr;
      result.exitCode = exitCode;
      result.success = exitCode === 0;
      result.durationMs = Date.now() - startTime;

      // Parse JSON messages if using stream-json format
      if (mergedConfig.outputFormat === 'stream-json' && stdout) {
        result.messages = this.parseStreamJson(stdout);
      }
    } catch (error) {
      result.durationMs = Date.now() - startTime;
      if (error instanceof KimiError) {
        result.error = error.message;
      } else if (error instanceof Error) {
        result.error = error.message;
      } else {
        result.error = String(error);
      }
    }

    return result;
  }

  /**
   * Builds command line arguments for the Kimi CLI
   */
  private buildArgs(prompt: string, config: KimiProviderConfig): string[] {
    const args: string[] = [];

    // Required: prompt flag for non-interactive mode
    args.push('-p', prompt);

    // Output format (default to stream-json for structured parsing)
    const outputFormat = config.outputFormat ?? DEFAULT_CONFIG.outputFormat;
    args.push('--output-format', outputFormat);

    // Model selection
    if (config.model) {
      args.push('--model', config.model);
    }

    // Session handling (mutually exclusive)
    if (config.continueSession) {
      args.push('--continue');
    } else if (config.sessionId) {
      args.push('--session', config.sessionId);
    }

    // Additional workspace directories
    if (config.additionalDirs && config.additionalDirs.length > 0) {
      for (const dir of config.additionalDirs) {
        args.push('--add-dir', this.resolvePath(dir, config.workDir));
      }
    }

    // Custom skills directories
    if (config.skillsDirs && config.skillsDirs.length > 0) {
      for (const dir of config.skillsDirs) {
        args.push('--skills-dir', this.resolvePath(dir, config.workDir));
      }
    }

    return args;
  }

  /**
   * Resolves a path relative to the working directory
   */
  private resolvePath(path: string, workDir?: string): string {
    if (isAbsolute(path)) {
      return path;
    }
    if (workDir) {
      return resolve(workDir, path);
    }
    return resolve(path);
  }

  /**
   * Executes the Kimi CLI and captures output
   */
  private runKimi(
    binary: string,
    args: string[],
    config: KimiProviderConfig
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const timeout = config.timeout ?? DEFAULT_CONFIG.timeout;
      const maxBuffer = config.maxBuffer ?? DEFAULT_CONFIG.maxBuffer;

      const spawnOptions: SpawnOptions = {
        cwd: config.workDir,
        env: {
          ...process.env,
          ...config.env,
          // Ensure non-interactive mode
          TERM: 'dumb',
          CI: 'true',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      };

      const child: ChildProcess = spawn(binary, args, spawnOptions);

      let stdout = '';
      let stderr = '';
      let stdoutSize = 0;
      let stderrSize = 0;
      let timedOut = false;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        // Force kill after 5 seconds if SIGTERM doesn't work
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);

      // Capture stdout
      child.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdoutSize += data.length;
        if (stdoutSize <= maxBuffer) {
          stdout += chunk;
        }
      });

      // Capture stderr
      child.stderr?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stderrSize += data.length;
        if (stderrSize <= maxBuffer) {
          stderr += chunk;
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new KimiError(
          KimiErrorCode.EXECUTION_FAILED,
          `Failed to spawn Kimi process: ${error.message}`,
          { error: error.message }
        ));
      });

      child.on('close', (exitCode, signal) => {
        clearTimeout(timeoutId);

        if (timedOut) {
          reject(new KimiError(
            KimiErrorCode.TIMEOUT,
            `Kimi execution timed out after ${timeout}ms`,
            { timeout, signal }
          ));
          return;
        }

        // Add truncation warnings if buffers were exceeded
        if (stdoutSize > maxBuffer) {
          stdout += `\n[TRUNCATED: stdout exceeded ${maxBuffer} bytes]`;
        }
        if (stderrSize > maxBuffer) {
          stderr += `\n[TRUNCATED: stderr exceeded ${maxBuffer} bytes]`;
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: exitCode ?? -1,
        });
      });
    });
  }

  /**
   * Runs a generic command (used for binary validation)
   */
  private runCommand(
    command: string,
    args: string[],
    options: { timeout?: number } = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let output = '';
      const timeout = options.timeout ?? 10000;

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      child.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });

      child.on('close', (exitCode) => {
        clearTimeout(timeoutId);
        if (exitCode === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Command exited with code ${exitCode}`));
        }
      });
    });
  }

  /**
   * Parses stream-json output into structured messages
   */
  private parseStreamJson(output: string): KimiStreamMessage[] {
    const messages: KimiStreamMessage[] = [];
    const lines = output.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        messages.push(parsed as KimiStreamMessage);
      } catch {
        // Skip non-JSON lines (might be progress indicators on stderr that leaked)
        continue;
      }
    }

    return messages;
  }

  /**
   * Quotes a string for safe shell display (for logging purposes only)
   */
  private shellQuote(str: string): string {
    if (!/[^a-zA-Z0-9_\-./]/.test(str)) {
      return str;
    }
    return `'${str.replace(/'/g, "'\\''")}'`;
  }

  /**
   * Formats an execution result for reporting (e.g., in a Linear comment)
   */
  static formatResultForReport(result: KimiExecutionResult): string {
    const lines: string[] = [];

    // Header
    lines.push(`## Kimi Execution ${result.success ? '✅ Success' : '❌ Failed'}`);
    lines.push('');

    // Metadata
    lines.push('### Execution Details');
    lines.push('');
    lines.push(`- **Duration**: ${result.durationMs}ms`);
    lines.push(`- **Exit Code**: ${result.exitCode ?? 'N/A'}`);
    lines.push(`- **Dry Run**: ${result.dryRun ? 'Yes' : 'No'}`);
    lines.push('');

    // Command (for debugging)
    lines.push('### Command');
    lines.push('');
    lines.push('```bash');
    lines.push(`${result.command} ${result.args.map(a => 
      /[^a-zA-Z0-9_\-./]/.test(a) ? `'${a.replace(/'/g, "'\\''")}'` : a
    ).join(' ')}`);
    lines.push('```');
    lines.push('');

    // Error (if any)
    if (result.error) {
      lines.push('### Error');
      lines.push('');
      lines.push('```');
      lines.push(result.error);
      lines.push('```');
      lines.push('');
    }

    // Stdout
    if (result.stdout) {
      lines.push('### Output (stdout)');
      lines.push('');
      lines.push('<details>');
      lines.push('<summary>Click to expand</summary>');
      lines.push('');
      lines.push('```');
      lines.push(KimiProvider.truncateOutput(result.stdout, 5000));
      lines.push('```');
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }

    // Stderr
    if (result.stderr) {
      lines.push('### Diagnostics (stderr)');
      lines.push('');
      lines.push('<details>');
      lines.push('<summary>Click to expand</summary>');
      lines.push('');
      lines.push('```');
      lines.push(KimiProvider.truncateOutput(result.stderr, 2000));
      lines.push('```');
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }

    // Parsed messages summary (if available)
    if (result.messages && result.messages.length > 0) {
      lines.push('### Parsed Messages');
      lines.push('');
      lines.push(`Total: ${result.messages.length} message(s)`);
      
      const assistantMessages = result.messages.filter(m => m.type === 'assistant');
      const toolMessages = result.messages.filter(m => m.type === 'tool');
      
      if (assistantMessages.length > 0) {
        lines.push(`- Assistant: ${assistantMessages.length}`);
      }
      if (toolMessages.length > 0) {
        lines.push(`- Tool: ${toolMessages.length}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Truncates output for display, adding indicator if truncated
   */
  private static truncateOutput(output: string, maxLength: number): string {
    if (output.length <= maxLength) {
      return output;
    }
    return output.substring(0, maxLength) + '\n\n[... truncated ...]';
  }

  /**
   * Creates a new provider instance with updated configuration
   */
  withConfig(config: Partial<KimiProviderConfig>): KimiProvider {
    return new KimiProvider({ ...this.config, ...config });
  }

  /**
   * Gets the current configuration
   */
  getConfig(): Readonly<KimiProviderConfig> {
    return { ...this.config };
  }
}

export default KimiProvider;
