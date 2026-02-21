import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Mock the cli utility module
vi.mock("../src/utils/cli.js", async () => {
  const actual = await vi.importActual<typeof import("../src/utils/cli.js")>(
    "../src/utils/cli.js"
  );
  return {
    ...actual,
    execCli: vi.fn(),
  };
});

import { execCli } from "../src/utils/cli.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const mockExecCli = vi.mocked(execCli);

function loadFixture(name: string): unknown {
  const raw = readFileSync(join(__dirname, "fixtures", name), "utf-8");
  return JSON.parse(raw);
}

// Capture registered tool handlers
const handlers: Record<string, Function> = {};
const mockServer = {
  registerTool: (name: string, _config: unknown, handler: Function) => {
    handlers[name] = handler;
  },
} as unknown as McpServer;

// Register tools
import { registerGitHubTools } from "../src/tools/infra-github.js";
registerGitHubTools(mockServer);

function parseResponse(resp: { content: Array<{ text: string }> }): unknown {
  return JSON.parse(resp.content[0].text);
}

describe("github infrastructure tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("gh_auth_status", () => {
    it("reports authenticated when gh auth succeeds", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "Logged in to github.com account alice",
        parsed: null,
      });

      const resp = await handlers.gh_auth_status({});
      const data = parseResponse(resp) as Record<string, unknown>;
      expect(data.source).toBe("github");
      expect((data.data as Record<string, unknown>).authenticated).toBe(true);
    });

    it("returns error when gh is not installed", async () => {
      mockExecCli.mockResolvedValue({
        ok: false,
        error: "not_installed",
        message: "gh CLI not found on PATH.",
      });

      const resp = await handlers.gh_auth_status({});
      const data = parseResponse(resp) as Record<string, unknown>;
      expect(data.error).toBe("not_installed");
    });
  });

  describe("gh_branch_protection", () => {
    it("reports passing controls when fully protected", async () => {
      const fixture = loadFixture("gh-branch-protection.json");
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: JSON.stringify(fixture),
        stderr: "",
        parsed: fixture,
      });

      const resp = await handlers.gh_branch_protection({
        owner: "acme",
        repo: "webapp",
        branch: "main",
      });
      const data = parseResponse(resp) as {
        findings: Array<{ control_id: string; status: string; description: string }>;
      };

      expect(data.findings.length).toBeGreaterThanOrEqual(3);

      const reviewFinding = data.findings.find(
        (f) => f.description.includes("approving review")
      );
      expect(reviewFinding?.status).toBe("pass");

      const statusFinding = data.findings.find(
        (f) => f.description.includes("Status checks")
      );
      expect(statusFinding?.status).toBe("pass");

      const adminFinding = data.findings.find(
        (f) => f.description.includes("administrator")
      );
      expect(adminFinding?.status).toBe("pass");
    });

    it("reports fail when no protection exists (404)", async () => {
      mockExecCli.mockResolvedValue({
        ok: false,
        error: "exec_error",
        message: "gh command failed",
        stderr: "HTTP 404: Not Found",
        exitCode: 1,
      });

      const resp = await handlers.gh_branch_protection({
        owner: "acme",
        repo: "webapp",
        branch: "main",
      });
      const data = parseResponse(resp) as {
        data: { protected: boolean };
        findings: Array<{ status: string }>;
      };

      expect(data.data.protected).toBe(false);
      expect(data.findings.every((f) => f.status === "fail")).toBe(true);
    });

    it("reports warning when reviews require 0 approvals", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "{}",
        stderr: "",
        parsed: {
          required_pull_request_reviews: {
            required_approving_review_count: 0,
          },
          enforce_admins: { enabled: false },
        },
      });

      const resp = await handlers.gh_branch_protection({
        owner: "acme",
        repo: "webapp",
        branch: "main",
      });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const reviewFinding = data.findings.find((f) =>
        f.description.includes("0 approvals")
      );
      expect(reviewFinding?.status).toBe("warning");
    });
  });

  describe("gh_repo_security", () => {
    it("reports passing when all security features enabled", async () => {
      const fixture = loadFixture("gh-repo.json");
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: JSON.stringify(fixture),
        stderr: "",
        parsed: fixture,
      });

      const resp = await handlers.gh_repo_security({
        owner: "acme",
        repo: "webapp",
      });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const secretScanning = data.findings.find((f) =>
        f.description.includes("Secret scanning is enabled")
      );
      expect(secretScanning?.status).toBe("pass");

      const dependabot = data.findings.find((f) =>
        f.description.includes("Dependabot")
      );
      expect(dependabot?.status).toBe("pass");
    });

    it("reports fail when secret scanning is disabled", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "{}",
        stderr: "",
        parsed: {
          security_and_analysis: {
            secret_scanning: { status: "disabled" },
          },
        },
      });

      const resp = await handlers.gh_repo_security({
        owner: "acme",
        repo: "webapp",
      });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const secretScanning = data.findings.find((f) =>
        f.description.includes("Secret scanning")
      );
      expect(secretScanning?.status).toBe("fail");
    });
  });

  describe("gh_collaborators", () => {
    it("reports collaborator count and admin count", async () => {
      const fixture = loadFixture("gh-collaborators.json");
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: JSON.stringify(fixture),
        stderr: "",
        parsed: fixture,
      });

      const resp = await handlers.gh_collaborators({
        owner: "acme",
        repo: "webapp",
      });
      const data = parseResponse(resp) as {
        data: Array<{ login: string; admin: boolean }>;
        findings: Array<{ description: string }>;
      };

      expect(data.data).toHaveLength(2);
      expect(data.findings[0].description).toContain("2 collaborator");
      expect(data.findings[0].description).toContain("1 with admin");
    });
  });

  describe("gh_workflows", () => {
    it("reports active and disabled workflows", async () => {
      const fixture = loadFixture("gh-workflows.json");
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: JSON.stringify(fixture),
        stderr: "",
        parsed: fixture,
      });

      const resp = await handlers.gh_workflows({
        owner: "acme",
        repo: "webapp",
      });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const activeFinding = data.findings.find((f) =>
        f.description.includes("active CI/CD")
      );
      expect(activeFinding?.status).toBe("pass");
      expect(activeFinding?.description).toContain("2");

      const disabledFinding = data.findings.find((f) =>
        f.description.includes("disabled")
      );
      expect(disabledFinding?.status).toBe("info");
    });

    it("reports warning when no active workflows", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "[]",
        stderr: "",
        parsed: [],
      });

      const resp = await handlers.gh_workflows({
        owner: "acme",
        repo: "webapp",
      });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      expect(data.findings[0].status).toBe("warning");
      expect(data.findings[0].description).toContain("No active");
    });
  });
});
