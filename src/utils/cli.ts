import { execFile, type ExecFileOptions } from "node:child_process";

function execFileAsync(
  command: string,
  args: string[],
  options: ExecFileOptions
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        (error as Record<string, unknown>).stderr = stderr;
        reject(error);
      } else {
        resolve({ stdout: stdout as string, stderr: stderr as string });
      }
    });
  });
}

// --- Types ---

export interface CliSuccess {
  ok: true;
  stdout: string;
  stderr: string;
  parsed: unknown;
}

export interface CliError {
  ok: false;
  error: "not_installed" | "not_authenticated" | "timeout" | "exec_error";
  message: string;
  stderr?: string;
  exitCode?: number;
}

export type CliOutcome = CliSuccess | CliError;

export interface CliOptions {
  timeoutMs?: number;
  parseJson?: boolean;
  env?: Record<string, string>;
}

export interface Finding {
  control_id: string;
  status: "pass" | "fail" | "warning" | "info";
  description: string;
}

export interface InfraToolResult {
  source: string;
  tool: string;
  tsc_controls: string[];
  collected_at: string;
  data: unknown;
  findings: Finding[];
}

// --- CLI execution ---

/**
 * Check if a CLI tool is available on PATH.
 */
export async function cliAvailable(command: string): Promise<boolean> {
  try {
    await execFileAsync("which", [command], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute a CLI command and return a structured result.
 * Uses execFile (not exec) to avoid shell injection.
 */
export async function execCli(
  command: string,
  args: string[],
  options?: CliOptions
): Promise<CliOutcome> {
  const timeoutMs = options?.timeoutMs ?? 30000;
  const parseJson = options?.parseJson ?? true;

  const available = await cliAvailable(command);
  if (!available) {
    return {
      ok: false,
      error: "not_installed",
      message: `${command} CLI not found on PATH. Install it and authenticate before using infrastructure tools.`,
    };
  }

  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, ...options?.env },
    });

    let parsed: unknown = null;
    if (parseJson && stdout.trim()) {
      try {
        parsed = JSON.parse(stdout);
      } catch {
        parsed = null;
      }
    }

    return { ok: true, stdout, stderr, parsed };
  } catch (err: unknown) {
    const error = err as {
      code?: string;
      killed?: boolean;
      stderr?: string;
      exitCode?: number;
      status?: number;
    };

    if (error.killed || error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
      return {
        ok: false,
        error: "timeout",
        message: `${command} command timed out after ${timeoutMs}ms.`,
        stderr: error.stderr,
      };
    }

    return {
      ok: false,
      error: "exec_error",
      message: `${command} command failed: ${error.stderr || String(err)}`,
      stderr: error.stderr,
      exitCode: error.exitCode ?? error.status,
    };
  }
}

// --- Response helpers ---

/**
 * Format a successful infrastructure tool response for MCP.
 */
export function infraResponse(result: InfraToolResult) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Format an error response for MCP infrastructure tools.
 */
export function infraError(source: string, tool: string, error: CliError) {
  const help =
    error.error === "not_installed"
      ? `Install the ${source} CLI and authenticate before using this tool.`
      : error.error === "not_authenticated"
        ? `Run the appropriate auth command (e.g., 'gh auth login', 'aws configure', 'gcloud auth login').`
        : undefined;

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          { source, tool, error: error.error, message: error.message, help },
          null,
          2
        ),
      },
    ],
  };
}
