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

import { registerGamTools } from "../src/tools/infra-gam.js";
registerGamTools(mockServer);

function parseResponse(resp: { content: Array<{ text: string }> }): unknown {
  return JSON.parse(resp.content[0].text);
}

describe("google workspace (gam) infrastructure tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("gam_auth_status", () => {
    it("reports authenticated when gam version succeeds", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "GAM 6.30.00 - https://github.com/GAM-team/GAM\n",
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.gam_auth_status({});
      const data = parseResponse(resp) as { data: Record<string, unknown> };
      expect(data.data.authenticated).toBe(true);
      expect(data.data.version).toContain("GAM");
    });
  });

  describe("gam_users", () => {
    it("reports user counts and flags many admins", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: [
          "primaryEmail,name.fullName,suspended,isAdmin,creationTime",
          "alice@acme.com,Alice Smith,False,True,2025-01-01",
          "bob@acme.com,Bob Jones,False,False,2025-02-01",
          "carol@acme.com,Carol Lee,True,False,2025-03-01",
        ].join("\n"),
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.gam_users({});
      const data = parseResponse(resp) as {
        data: Array<Record<string, unknown>>;
        findings: Array<{ description: string }>;
      };

      expect(data.data).toHaveLength(3);
      expect(data.findings[0].description).toContain("2 active");
      expect(data.findings[0].description).toContain("1 suspended");
      expect(data.findings[0].description).toContain("1 admin");
    });
  });

  describe("gam_mfa_status", () => {
    it("reports users with and without 2SV", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: [
          "primaryEmail,isEnrolledIn2Sv,isEnforcedIn2Sv",
          "alice@acme.com,True,True",
          "bob@acme.com,False,True",
        ].join("\n"),
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.gam_mfa_status({});
      const data = parseResponse(resp) as {
        findings: Array<{ control_id: string; status: string; description: string }>;
      };

      const failFinding = data.findings.find(
        (f) => f.control_id === "CC6.2" && f.status === "fail"
      );
      expect(failFinding?.description).toContain("bob@acme.com");

      const passFinding = data.findings.find(
        (f) => f.control_id === "CC6.2" && f.status === "pass" && f.description.includes("enrolled")
      );
      expect(passFinding?.description).toContain("1 user");
    });
  });

  describe("gam_admin_roles", () => {
    it("reports admin role assignments", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: [
          "roleAssignmentId,roleName,assignedTo",
          "1,_SEED_ADMIN_ROLE,alice@acme.com",
          "2,_GROUPS_ADMIN_ROLE,bob@acme.com",
        ].join("\n"),
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.gam_admin_roles({});
      const data = parseResponse(resp) as {
        findings: Array<{ description: string }>;
      };

      expect(data.findings[0].description).toContain("2 admin role");
    });
  });

  describe("gam_login_audit", () => {
    it("reports login events", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: [
          "actor.email,events,ipAddress,time",
          "alice@acme.com,login_success,1.2.3.4,2026-02-20T10:00:00Z",
          "bob@acme.com,login_success,5.6.7.8,2026-02-19T14:00:00Z",
        ].join("\n"),
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.gam_login_audit({ days: 30 });
      const data = parseResponse(resp) as {
        data: { total_events: number };
        findings: Array<{ status: string; description: string }>;
      };

      expect(data.data.total_events).toBe(2);
      expect(data.findings[0].status).toBe("pass");
      expect(data.findings[0].description).toContain("2 login event");
    });

    it("warns when no events found", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "actor.email,events,ipAddress,time\n",
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.gam_login_audit({ days: 30 });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string }>;
      };
      expect(data.findings[0].status).toBe("warning");
    });
  });
});
