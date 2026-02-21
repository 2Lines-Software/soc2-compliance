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

function loadFixture(name: string): string {
  return readFileSync(join(__dirname, "fixtures", name), "utf-8");
}

// Capture registered tool handlers
const handlers: Record<string, Function> = {};
const mockServer = {
  registerTool: (name: string, _config: unknown, handler: Function) => {
    handlers[name] = handler;
  },
} as unknown as McpServer;

// Register tools
import { registerNucleiTools } from "../src/tools/infra-nuclei.js";
registerNucleiTools(mockServer);

function parseResponse(resp: { content: Array<{ text: string }> }): unknown {
  return JSON.parse(resp.content[0].text);
}

describe("nuclei infrastructure tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("nuclei_auth_status", () => {
    it("reports installed when nuclei exists", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "Nuclei Engine Version: v3.3.7",
        parsed: null,
      });

      const resp = await handlers.nuclei_auth_status({});
      const data = parseResponse(resp) as Record<string, unknown>;
      expect(data.source).toBe("nuclei");
      expect(data.tool).toBe("nuclei_auth_status");
      const inner = data.data as Record<string, unknown>;
      expect(inner.installed).toBe(true);
      expect(inner.version).toBe("3.3.7");
    });

    it("returns error when nuclei is not installed", async () => {
      mockExecCli.mockResolvedValue({
        ok: false,
        error: "not_installed",
        message: "nuclei CLI not found on PATH.",
      });

      const resp = await handlers.nuclei_auth_status({});
      const data = parseResponse(resp) as Record<string, unknown>;
      expect(data.error).toBe("not_installed");
    });
  });

  describe("nuclei_scan", () => {
    it("parses JSONL findings and maps to TSC controls", async () => {
      const fixture = loadFixture("nuclei-scan-results.jsonl");
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: fixture,
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.nuclei_scan({
        urls: ["https://app.acme.com"],
      });
      const data = parseResponse(resp) as Record<string, unknown>;
      expect(data.source).toBe("nuclei");
      expect(data.tool).toBe("nuclei_scan");

      const inner = data.data as Record<string, unknown>;
      const summary = inner.summary as Record<string, unknown>;
      expect(summary.total_findings).toBe(3);
      expect(summary.targets_scanned).toBe(1);

      const counts = summary.severity_counts as Record<string, number>;
      expect(counts.high).toBe(1);
      expect(counts.medium).toBe(1);
      expect(counts.info).toBe(1);

      // Check findings include TSC-mapped entries
      const findings = data.findings as Array<Record<string, unknown>>;
      const controlIds = findings.map((f) => f.control_id);
      expect(controlIds).toContain("CC6.1"); // ssl finding
      expect(controlIds).toContain("CC3.2"); // scan activity
      expect(controlIds).toContain("CC4.1"); // remediation needed

      // The high-severity ssl finding should be "fail"
      const sslFinding = findings.find(
        (f) => f.description && (f.description as string).includes("Outdated TLS")
      );
      expect(sslFinding?.status).toBe("fail");

      // The medium-severity finding should be "warning"
      const headerFinding = findings.find(
        (f) =>
          f.description && (f.description as string).includes("Missing Security Headers")
      );
      expect(headerFinding?.status).toBe("warning");
    });

    it("reports clean scan with no findings", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.nuclei_scan({
        urls: ["https://secure.example.com"],
      });
      const data = parseResponse(resp) as Record<string, unknown>;
      const inner = data.data as Record<string, unknown>;
      const summary = inner.summary as Record<string, unknown>;
      expect(summary.total_findings).toBe(0);

      const findings = data.findings as Array<Record<string, unknown>>;
      // Should have pass findings for CC6.6 and CC6.1
      const cc66Pass = findings.find(
        (f) => f.control_id === "CC6.6" && f.status === "pass"
      );
      expect(cc66Pass).toBeDefined();

      const cc61Pass = findings.find(
        (f) => f.control_id === "CC6.1" && f.status === "pass"
      );
      expect(cc61Pass).toBeDefined();

      // CC3.2 scan-completed pass
      const cc32Pass = findings.find(
        (f) => f.control_id === "CC3.2" && f.status === "pass"
      );
      expect(cc32Pass).toBeDefined();
    });

    it("reports critical/high as fail with CC4.1 remediation", async () => {
      const fixture = loadFixture("nuclei-scan-critical.jsonl");
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: fixture,
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.nuclei_scan({
        urls: ["https://app.acme.com"],
      });
      const data = parseResponse(resp) as Record<string, unknown>;
      const findings = data.findings as Array<Record<string, unknown>>;

      // Critical finding should be "fail"
      const rceFinding = findings.find(
        (f) =>
          f.description &&
          (f.description as string).includes("Remote Code Execution")
      );
      expect(rceFinding?.status).toBe("fail");

      // Aggregate CC4.1 remediation finding
      const cc41 = findings.find(
        (f) =>
          f.control_id === "CC4.1" &&
          f.description &&
          (f.description as string).includes("require remediation")
      );
      expect(cc41).toBeDefined();
      expect(cc41?.status).toBe("fail");
    });

    it("handles timeout gracefully", async () => {
      mockExecCli.mockResolvedValue({
        ok: false,
        error: "timeout",
        message: "nuclei command timed out after 300000ms.",
        stderr: "",
      });

      const resp = await handlers.nuclei_scan({
        urls: ["https://slow.example.com"],
      });
      const data = parseResponse(resp) as Record<string, unknown>;
      expect(data.error).toBe("timeout");
    });

    it("passes correct args to execCli", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: null,
      });

      await handlers.nuclei_scan({
        urls: ["https://a.com", "https://b.com"],
        tags: ["ssl", "cve"],
        severity: ["critical", "high"],
        rate_limit: 10,
      });

      expect(mockExecCli).toHaveBeenCalledWith(
        "nuclei",
        expect.arrayContaining([
          "-u",
          "https://a.com",
          "-u",
          "https://b.com",
          "-tags",
          "ssl,cve",
          "-severity",
          "critical,high",
          "-jsonl",
          "-or",
          "-rl",
          "10",
          "-c",
          "8",
          "-bs",
          "8",
          "-silent",
          "-no-color",
        ]),
        expect.objectContaining({
          timeoutMs: 300_000,
          parseJson: false,
        })
      );
    });

    it("handles malformed JSONL lines gracefully", async () => {
      const stdout = [
        '{"template-id":"ssl-dns-names","type":"ssl","host":"https://app.acme.com","matched-at":"https://app.acme.com","timestamp":"2026-02-21T10:00:00Z","matcher-status":true,"info":{"name":"SSL Info","severity":"info","tags":["ssl"],"description":"SSL detected"}}',
        "this is not json",
        "",
        '{"template-id":"tls-version","type":"ssl","host":"https://app.acme.com","matched-at":"https://app.acme.com","timestamp":"2026-02-21T10:00:01Z","matcher-status":true,"info":{"name":"TLS Issue","severity":"high","tags":["tls"],"description":"Old TLS"}}',
      ].join("\n");

      mockExecCli.mockResolvedValue({
        ok: true,
        stdout,
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.nuclei_scan({
        urls: ["https://app.acme.com"],
      });
      const data = parseResponse(resp) as Record<string, unknown>;
      const inner = data.data as Record<string, unknown>;
      const summary = inner.summary as Record<string, unknown>;
      // Only 2 valid lines parsed, garbage line skipped
      expect(summary.total_findings).toBe(2);
    });
  });
});
