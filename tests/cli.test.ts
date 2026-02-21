import { describe, it, expect, vi, beforeEach } from "vitest";
import { execFile } from "node:child_process";
import { cliAvailable, execCli, infraResponse, infraError } from "../src/utils/cli.js";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

const mockExecFile = vi.mocked(execFile);

function simulateExecFile(
  result:
    | { stdout: string; stderr: string }
    | { error: { code?: string; killed?: boolean; stderr?: string; status?: number } }
) {
  mockExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
    // execFile can be called with (cmd, args, callback) or (cmd, args, opts, callback)
    const cb =
      typeof _opts === "function" ? (_opts as Function) : (callback as Function);
    if ("error" in result) {
      const err = Object.assign(new Error("command failed"), result.error);
      cb(err, "", result.error.stderr || "");
    } else {
      cb(null, result.stdout, result.stderr);
    }
    return {} as any;
  });
}

describe("cli utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cliAvailable", () => {
    it("returns true when command exists on PATH", async () => {
      simulateExecFile({ stdout: "/usr/bin/gh\n", stderr: "" });
      const result = await cliAvailable("gh");
      expect(result).toBe(true);
    });

    it("returns false when command is not found", async () => {
      simulateExecFile({
        error: { code: "ENOENT", stderr: "" },
      });
      const result = await cliAvailable("nonexistent-cli");
      expect(result).toBe(false);
    });
  });

  describe("execCli", () => {
    it("parses JSON stdout by default", async () => {
      // First call: cliAvailable (which), second call: actual command
      let callCount = 0;
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
        const cb =
          typeof _opts === "function" ? (_opts as Function) : (callback as Function);
        callCount++;
        if (callCount === 1) {
          // which command
          cb(null, "/usr/bin/gh\n", "");
        } else {
          // actual command
          cb(null, JSON.stringify({ key: "value" }), "");
        }
        return {} as any;
      });

      const result = await execCli("gh", ["auth", "status"]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.parsed).toEqual({ key: "value" });
      }
    });

    it("returns null parsed when stdout is not valid JSON", async () => {
      let callCount = 0;
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
        const cb =
          typeof _opts === "function" ? (_opts as Function) : (callback as Function);
        callCount++;
        if (callCount === 1) {
          cb(null, "/usr/bin/aws\n", "");
        } else {
          cb(null, "not json output", "");
        }
        return {} as any;
      });

      const result = await execCli("aws", ["sts", "get-caller-identity"]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.parsed).toBeNull();
        expect(result.stdout).toBe("not json output");
      }
    });

    it("returns not_installed when CLI is missing", async () => {
      simulateExecFile({
        error: { code: "ENOENT", stderr: "" },
      });

      const result = await execCli("nonexistent", ["arg"]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("not_installed");
        expect(result.message).toContain("nonexistent");
      }
    });

    it("returns timeout when command is killed", async () => {
      let callCount = 0;
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
        const cb =
          typeof _opts === "function" ? (_opts as Function) : (callback as Function);
        callCount++;
        if (callCount === 1) {
          cb(null, "/usr/bin/aws\n", "");
        } else {
          const err = Object.assign(new Error("killed"), {
            killed: true,
            stderr: "",
          });
          cb(err, "", "");
        }
        return {} as any;
      });

      const result = await execCli("aws", ["s3api", "list-buckets"]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("timeout");
      }
    });

    it("returns exec_error with stderr on non-zero exit", async () => {
      let callCount = 0;
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
        const cb =
          typeof _opts === "function" ? (_opts as Function) : (callback as Function);
        callCount++;
        if (callCount === 1) {
          cb(null, "/usr/bin/gh\n", "");
        } else {
          const err = Object.assign(new Error("exit 1"), {
            stderr: "not logged in",
            status: 1,
          });
          cb(err, "", "not logged in");
        }
        return {} as any;
      });

      const result = await execCli("gh", ["auth", "status"]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("exec_error");
        expect(result.stderr).toBe("not logged in");
        expect(result.exitCode).toBe(1);
      }
    });

    it("skips JSON parsing when parseJson is false", async () => {
      let callCount = 0;
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
        const cb =
          typeof _opts === "function" ? (_opts as Function) : (callback as Function);
        callCount++;
        if (callCount === 1) {
          cb(null, "/usr/bin/gh\n", "");
        } else {
          cb(null, '{"key": "value"}', "");
        }
        return {} as any;
      });

      const result = await execCli("gh", ["auth", "status"], {
        parseJson: false,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.parsed).toBeNull();
        expect(result.stdout).toBe('{"key": "value"}');
      }
    });
  });

  describe("infraResponse", () => {
    it("formats a structured MCP response", () => {
      const resp = infraResponse({
        source: "github",
        tool: "gh_branch_protection",
        tsc_controls: ["CC5.2", "CC8.1"],
        collected_at: "2026-02-21",
        data: { protected: true },
        findings: [
          {
            control_id: "CC8.1",
            status: "pass",
            description: "Branch protection enabled",
          },
        ],
      });

      expect(resp.content).toHaveLength(1);
      expect(resp.content[0].type).toBe("text");
      const parsed = JSON.parse(resp.content[0].text);
      expect(parsed.source).toBe("github");
      expect(parsed.findings).toHaveLength(1);
      expect(parsed.findings[0].status).toBe("pass");
    });
  });

  describe("infraError", () => {
    it("includes install help for not_installed errors", () => {
      const resp = infraError("github", "gh_branch_protection", {
        ok: false,
        error: "not_installed",
        message: "gh CLI not found on PATH.",
      });

      const parsed = JSON.parse(resp.content[0].text);
      expect(parsed.error).toBe("not_installed");
      expect(parsed.help).toContain("Install the github CLI");
    });

    it("includes auth help for not_authenticated errors", () => {
      const resp = infraError("aws", "aws_auth_status", {
        ok: false,
        error: "not_authenticated",
        message: "Unable to locate credentials.",
      });

      const parsed = JSON.parse(resp.content[0].text);
      expect(parsed.error).toBe("not_authenticated");
      expect(parsed.help).toContain("aws configure");
    });
  });
});
