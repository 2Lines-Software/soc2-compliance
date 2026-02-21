import { describe, it, expect, vi, beforeEach } from "vitest";

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

const handlers: Record<string, Function> = {};
const mockServer = {
  registerTool: (name: string, _config: unknown, handler: Function) => {
    handlers[name] = handler;
  },
} as unknown as McpServer;

import { registerCloudflareTools } from "../src/tools/infra-cloudflare.js";
registerCloudflareTools(mockServer);

function parseResponse(resp: { content: Array<{ text: string }> }): unknown {
  return JSON.parse(resp.content[0].text);
}

describe("cloudflare infrastructure tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CF_API_TOKEN = "test-token";
  });

  describe("cf_auth_status", () => {
    it("reports authenticated when token is valid", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: { success: true, result: { status: "active" } },
      });

      const resp = await handlers.cf_auth_status({});
      const data = parseResponse(resp) as { data: Record<string, unknown> };
      expect(data.data.authenticated).toBe(true);
    });

    it("reports error when token is missing", async () => {
      delete process.env.CF_API_TOKEN;

      const resp = await handlers.cf_auth_status({});
      const data = parseResponse(resp) as { error: string };
      expect(data.error).toBe("not_authenticated");
    });
  });

  describe("cf_zones", () => {
    it("reports active zones", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: {
          success: true,
          result: [
            { id: "zone1", name: "acme.com", status: "active", plan: { name: "Pro" } },
            { id: "zone2", name: "acme.dev", status: "active", plan: { name: "Free" } },
          ],
        },
      });

      const resp = await handlers.cf_zones({});
      const data = parseResponse(resp) as {
        data: Array<Record<string, unknown>>;
        findings: Array<{ description: string }>;
      };

      expect(data.data).toHaveLength(2);
      expect(data.findings[0].description).toContain("2 active zone");
    });
  });

  describe("cf_ssl_tls", () => {
    it("reports passing for strict SSL and TLS 1.2", async () => {
      let callCount = 0;
      mockExecCli.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { ok: true, stdout: "", stderr: "", parsed: { result: { value: "strict" } } };
        }
        return { ok: true, stdout: "", stderr: "", parsed: { result: { value: "1.2" } } };
      });

      const resp = await handlers.cf_ssl_tls({ zone_id: "zone1" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const sslFinding = data.findings.find((f: any) => f.description.includes("strict"));
      expect(sslFinding?.status).toBe("pass");

      const tlsFinding = data.findings.find((f: any) => f.description.includes("1.2"));
      expect(tlsFinding?.status).toBe("pass");
    });

    it("warns for flexible SSL", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: { result: { value: "flexible" } },
      });

      const resp = await handlers.cf_ssl_tls({ zone_id: "zone1" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const sslFinding = data.findings.find((f: any) => f.description.includes("flexible"));
      expect(sslFinding?.status).toBe("warning");
    });
  });

  describe("cf_waf_rules", () => {
    it("reports WAF enabled", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: { success: true, result: { value: "on" } },
      });

      const resp = await handlers.cf_waf_rules({ zone_id: "zone1" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string }>;
      };
      expect(data.findings[0].status).toBe("pass");
    });

    it("warns when WAF is off", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: { success: true, result: { value: "off" } },
      });

      const resp = await handlers.cf_waf_rules({ zone_id: "zone1" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string }>;
      };
      expect(data.findings[0].status).toBe("warning");
    });
  });

  describe("cf_security_settings", () => {
    it("reports HTTPS and security settings", async () => {
      let callCount = 0;
      mockExecCli.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { ok: true, stdout: "", stderr: "", parsed: { result: { value: "on" } } };
        }
        if (callCount === 2) {
          return { ok: true, stdout: "", stderr: "", parsed: { result: { value: "high" } } };
        }
        return { ok: true, stdout: "", stderr: "", parsed: { result: { value: "on" } } };
      });

      const resp = await handlers.cf_security_settings({ zone_id: "zone1" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const httpsFinding = data.findings.find((f: any) => f.description.includes("HTTPS"));
      expect(httpsFinding?.status).toBe("pass");

      const secFinding = data.findings.find((f: any) => f.description.includes("Security level"));
      expect(secFinding?.status).toBe("pass");
    });

    it("fails when HTTPS is not enforced", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: { result: { value: "off" } },
      });

      const resp = await handlers.cf_security_settings({ zone_id: "zone1" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const httpsFinding = data.findings.find((f: any) => f.description.includes("HTTPS"));
      expect(httpsFinding?.status).toBe("fail");
    });
  });
});
