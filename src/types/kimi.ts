/**
 * Kimi CLI Types
 * 
 * Target CLI: kimi-code (Kimi Code CLI)
 * Version: >=0.20.0 (TypeScript-based successor to legacy Python kimi-cli)
 * Repository: https://github.com/MoonshotAI/kimi-code
 * 
 * Command Format:
 *   kimi -p "<prompt>" [options]
 * 
 * Non-interactive mode automatically uses 'auto' permission policy.
 */

/**
 * Output format options for non-interactive execution
 */
export type KimiOutputFormat = 'text' | 'stream-json';

/**
 * Configuration for the Kimi CLI provider
 */
export interface KimiProviderConfig {
  /**
   * Path to the Kimi binary. Defaults to 'kimi' (assumes it's in PATH)
   */
  kimiBinary?: string;

  /**
   * Working directory for Kimi to operate in
   */
  workDir?: string;

  /**
   * Additional workspace directories to include
   * Maps to: --add-dir <path>
   */
  additionalDirs?: string[];

  /**
   * Model alias to use (e.g., 'kimi-code/kimi-for-coding')
   * Maps to: --model <alias> or -m <alias>
   */
  model?: string;

  /**
   * Output format for non-interactive mode
   * 'text' - Human-readable transcript (default)
   * 'stream-json' - JSON objects, one per line
   */
  outputFormat?: KimiOutputFormat;

  /**
   * Continue the most recent session in the working directory
   * Maps to: --continue or -c
   * Cannot be used with sessionId
   */
  continueSession?: boolean;

  /**
   * Resume a specific session by ID
   * Maps to: --session <id> or -S <id>
   * Cannot be used with continueSession
   */
  sessionId?: string;

  /**
   * Custom skills directories to load
   * Maps to: --skills-dir <path> (can be repeated)
   */
  skillsDirs?: string[];

  /**
   * Timeout in milliseconds for command execution
   * Default: 300000 (5 minutes)
   */
  timeout?: number;

  /**
   * Environment variables to pass to the Kimi process
   */
  env?: Record<string, string>;

  /**
   * Enable dry-run mode - logs command without executing
   */
  dryRun?: boolean;

  /**
   * Maximum buffer size for stdout/stderr in bytes
   * Default: 10MB (10 * 1024 * 1024)
   */
  maxBuffer?: number;
}

/**
 * Represents a job to be executed by the Kimi provider
 */
export interface KimiJob {
  /**
   * The prompt to send to Kimi CLI
   */
  prompt: string;

  /**
   * Optional job-specific configuration overrides
   */
  config?: Partial<KimiProviderConfig>;

  /**
   * Metadata associated with this job (e.g., Linear issue ID)
   */
  metadata?: Record<string, unknown>;
}

/**
 * JSON message types emitted by Kimi in stream-json mode
 */
export interface KimiStreamMessage {
  type: 'assistant' | 'tool' | 'error';
  content?: string;
  tool_calls?: KimiToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface KimiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Result of a Kimi CLI execution
 */
export interface KimiExecutionResult {
  /**
   * Whether the execution was successful (exit code 0)
   */
  success: boolean;

  /**
   * Exit code from the Kimi process
   */
  exitCode: number | null;

  /**
   * Standard output from the process
   */
  stdout: string;

  /**
   * Standard error from the process
   */
  stderr: string;

  /**
   * Parsed JSON messages if outputFormat was 'stream-json'
   */
  messages?: KimiStreamMessage[];

  /**
   * Execution duration in milliseconds
   */
  durationMs: number;

  /**
   * The exact command that was executed (for debugging)
   */
  command: string;

  /**
   * Arguments passed to the command
   */
  args: string[];

  /**
   * Error message if execution failed
   */
  error?: string;

  /**
   * Whether this was a dry-run (command not actually executed)
   */
  dryRun: boolean;
}

/**
 * Error types specific to Kimi provider
 */
export enum KimiErrorCode {
  BINARY_NOT_FOUND = 'BINARY_NOT_FOUND',
  BINARY_NOT_EXECUTABLE = 'BINARY_NOT_EXECUTABLE',
  TIMEOUT = 'TIMEOUT',
  INVALID_CONFIG = 'INVALID_CONFIG',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  PARSE_ERROR = 'PARSE_ERROR',
}

export class KimiError extends Error {
  constructor(
    public readonly code: KimiErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'KimiError';
  }
}
