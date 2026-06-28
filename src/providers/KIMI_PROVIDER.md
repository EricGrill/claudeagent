# Kimi CLI Provider

This document describes the Kimi CLI execution contract and usage for the `KimiProvider` class.

## Target CLI Specification

| Property | Value |
|----------|-------|
| **CLI Name** | kimi-code (Kimi Code CLI) |
| **Repository** | https://github.com/MoonshotAI/kimi-code |
| **Minimum Version** | 0.20.0 |
| **Language** | TypeScript (successor to Python-based kimi-cli) |
| **Documentation** | https://moonshotai.github.io/kimi-code/en/reference/kimi-command.html |

### Installation

```bash
# Official install script (recommended)
curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash

# Or via npm (requires Node.js >= 22.19)
npm install -g @moonshot-ai/kimi-code
```

## Command Format

The provider uses Kimi's non-interactive mode for execution:

```bash
kimi -p "<prompt>" [--output-format text|stream-json] [--model <alias>] [--add-dir <path>]...
```

### Non-Interactive Mode Behavior

When using `-p` (prompt) flag:
- No TUI is opened
- Auto permission policy is used (no human approval required)
- Static deny rules remain in effect
- Thinking/tool progress → stderr
- Assistant output → stdout

### Output Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| `text` | Human-readable transcript with `• ` prefix | Manual inspection |
| `stream-json` | One JSON object per line | Programmatic parsing (default) |

## Configuration Options

```typescript
interface KimiProviderConfig {
  // Path to the Kimi binary (default: 'kimi')
  kimiBinary?: string;

  // Working directory for Kimi
  workDir?: string;

  // Additional workspace directories (--add-dir)
  additionalDirs?: string[];

  // Model alias (--model)
  model?: string;

  // Output format (default: 'stream-json')
  outputFormat?: 'text' | 'stream-json';

  // Continue most recent session (--continue)
  continueSession?: boolean;

  // Resume specific session (--session)
  sessionId?: string;

  // Custom skills directories (--skills-dir)
  skillsDirs?: string[];

  // Execution timeout in ms (default: 300000)
  timeout?: number;

  // Environment variables for subprocess
  env?: Record<string, string>;

  // Dry-run mode - logs command without executing
  dryRun?: boolean;

  // Max buffer size for stdout/stderr (default: 10MB)
  maxBuffer?: number;
}
```

## Usage Examples

### Basic Usage

```typescript
import { KimiProvider } from './providers';

const provider = new KimiProvider({
  model: 'kimi-code/kimi-for-coding',
  workDir: '/path/to/project',
});

const result = await provider.execute({
  prompt: 'Analyze the error handling in this codebase',
});

if (result.success) {
  console.log('Output:', result.stdout);
  console.log('Messages:', result.messages);
} else {
  console.error('Failed:', result.error);
}
```

### Dry-Run Mode for Testing

```typescript
const provider = new KimiProvider({ dryRun: true });

const result = await provider.execute({
  prompt: 'Test prompt',
});

console.log(result.stdout);
// [DRY-RUN] Would execute: kimi -p 'Test prompt' --output-format stream-json
```

### Job-Level Configuration Override

```typescript
const provider = new KimiProvider({
  model: 'default-model',
  timeout: 300000,
});

// Override for specific job
const result = await provider.execute({
  prompt: 'Quick task',
  config: {
    model: 'fast-model',
    timeout: 60000,
  },
});
```

### Generating Reports

```typescript
import { KimiProvider } from './providers';

const result = await provider.execute({
  prompt: 'Fix the bug in auth.ts',
});

const report = KimiProvider.formatResultForReport(result);
// Returns markdown suitable for Linear comments
```

## Error Handling

The provider handles these error scenarios:

| Error Code | Description | Recovery |
|------------|-------------|----------|
| `BINARY_NOT_FOUND` | Kimi CLI not installed or not in PATH | Install Kimi CLI |
| `BINARY_NOT_EXECUTABLE` | Binary exists but lacks execute permission | `chmod +x` the binary |
| `TIMEOUT` | Execution exceeded timeout | Increase timeout or simplify task |
| `INVALID_CONFIG` | Configuration conflict | Fix conflicting options |
| `EXECUTION_FAILED` | Process spawn failed | Check system resources |
| `PARSE_ERROR` | Failed to parse JSON output | Check CLI version compatibility |

## Security Considerations

1. **Prompt Serialization**: Prompts are passed as arguments to `spawn()`, not through shell execution, avoiding shell injection.

2. **Environment Isolation**: The provider sets `TERM=dumb` and `CI=true` to ensure non-interactive behavior.

3. **Buffer Limits**: stdout/stderr are limited to 10MB by default to prevent memory exhaustion.

4. **Timeout**: Default 5-minute timeout prevents runaway processes.

## Testing

Run unit tests:
```bash
npm test
```

Integration tests (require Kimi CLI installation):
```bash
# Unskip integration tests in kimi-provider.test.ts first
npm test -- --testNamePattern="integration"
```

## Changelog

### v1.0.0
- Initial implementation targeting kimi-code >= 0.20.0
- Non-interactive execution via `-p` flag
- JSON output parsing for `stream-json` format
- Dry-run mode for local testing
- Binary validation before execution
- Comprehensive error handling
- Report formatting for Linear comments
