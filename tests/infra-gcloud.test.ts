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

import { registerGCloudTools } from "../src/tools/infra-gcloud.js";
registerGCloudTools(mockServer);

function parseResponse(resp: { content: Array<{ text: string }> }): unknown {
  return JSON.parse(resp.content[0].text);
}

describe("gcloud infrastructure tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("gcloud_auth_status", () => {
    it("reports authenticated with active account", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: [
          { account: "alice@acme.com", status: "ACTIVE" },
          { account: "bob@acme.com", status: "" },
        ],
      });

      const resp = await handlers.gcloud_auth_status({});
      const data = parseResponse(resp) as { data: Record<string, unknown> };
      expect(data.data.authenticated).toBe(true);
      expect(data.data.active_account).toBe("alice@acme.com");
    });

    it("reports not authenticated when no active account", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: [],
      });

      const resp = await handlers.gcloud_auth_status({});
      const data = parseResponse(resp) as { data: Record<string, unknown> };
      expect(data.data.authenticated).toBe(false);
    });
  });

  describe("gcloud_iam_policy", () => {
    it("reports bindings and flags broad roles", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: {
          bindings: [
            { role: "roles/owner", members: ["user:alice@acme.com", "user:bob@acme.com", "user:charlie@acme.com", "user:dave@acme.com"] },
            { role: "roles/viewer", members: ["user:intern@acme.com"] },
          ],
        },
      });

      const resp = await handlers.gcloud_iam_policy({ project: "acme-prod" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const broadFinding = data.findings.find((f) =>
        f.description.includes("Owner/Editor")
      );
      expect(broadFinding?.status).toBe("warning");
      expect(broadFinding?.description).toContain("4");
    });

    it("reports info for small owner count", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: {
          bindings: [
            { role: "roles/owner", members: ["user:alice@acme.com"] },
          ],
        },
      });

      const resp = await handlers.gcloud_iam_policy({ project: "acme-prod" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const ownerFinding = data.findings.find((f) =>
        f.description.includes("Owner/Editor")
      );
      expect(ownerFinding?.status).toBe("info");
    });
  });

  describe("gcloud_service_accounts", () => {
    it("flags default service accounts", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: [
          { email: "my-sa@acme-prod.iam.gserviceaccount.com", displayName: "My SA", disabled: false },
          { email: "123456-compute@developer.gserviceaccount.com", displayName: "Default compute", disabled: false },
        ],
      });

      const resp = await handlers.gcloud_service_accounts({ project: "acme-prod" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const defaultFinding = data.findings.find((f) =>
        f.description.includes("default service account")
      );
      expect(defaultFinding?.status).toBe("warning");
    });
  });

  describe("gcloud_logging_sinks", () => {
    it("reports configured sinks", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: [
          { name: "bigquery-sink", destination: "bigquery.googleapis.com/projects/acme/datasets/logs", filter: "" },
        ],
      });

      const resp = await handlers.gcloud_logging_sinks({ project: "acme-prod" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      expect(data.findings[0].status).toBe("pass");
      expect(data.findings[0].description).toContain("1 logging sink");
    });

    it("warns when no sinks", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: [],
      });

      const resp = await handlers.gcloud_logging_sinks({ project: "acme-prod" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string }>;
      };
      expect(data.findings[0].status).toBe("warning");
    });
  });

  describe("gcloud_kms_keys", () => {
    it("reports keys with rotation status", async () => {
      mockExecCli.mockImplementation(async (_cmd, args) => {
        if (args.includes("keyrings")) {
          return {
            ok: true, stdout: "", stderr: "",
            parsed: [{ name: "projects/acme/locations/global/keyRings/main-ring" }],
          };
        }
        if (args.includes("keys")) {
          return {
            ok: true, stdout: "", stderr: "",
            parsed: [
              { name: "projects/acme/.../cryptoKeys/data-key", purpose: "ENCRYPT_DECRYPT", rotationPeriod: "7776000s" },
              { name: "projects/acme/.../cryptoKeys/backup-key", purpose: "ENCRYPT_DECRYPT" },
            ],
          };
        }
        return { ok: true, stdout: "", stderr: "", parsed: {} };
      });

      const resp = await handlers.gcloud_kms_keys({ project: "acme-prod", location: "global" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const keysFinding = data.findings.find((f) =>
        f.description.includes("customer-managed")
      );
      expect(keysFinding?.status).toBe("pass");

      const rotFinding = data.findings.find((f) =>
        f.description.includes("without automatic rotation")
      );
      expect(rotFinding?.status).toBe("warning");
    });

    it("reports info when no keyrings", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: [],
      });

      const resp = await handlers.gcloud_kms_keys({ project: "acme-prod", location: "global" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };
      expect(data.findings[0].status).toBe("info");
      expect(data.findings[0].description).toContain("Google-managed");
    });
  });

  describe("gcloud_firewall_rules", () => {
    it("flags SSH open to the world", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: [
          {
            name: "allow-ssh",
            network: "default",
            direction: "INGRESS",
            priority: 1000,
            sourceRanges: ["0.0.0.0/0"],
            allowed: [{ IPProtocol: "tcp", ports: ["22"] }],
            disabled: false,
          },
          {
            name: "allow-https",
            network: "default",
            direction: "INGRESS",
            priority: 1000,
            sourceRanges: ["0.0.0.0/0"],
            allowed: [{ IPProtocol: "tcp", ports: ["443"] }],
            disabled: false,
          },
        ],
      });

      const resp = await handlers.gcloud_firewall_rules({ project: "acme-prod" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const sshFinding = data.findings.find((f) =>
        f.description.includes("SSH")
      );
      expect(sshFinding?.status).toBe("fail");
      expect(sshFinding?.description).toContain("allow-ssh");
    });

    it("passes when no permissive rules", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: [
          {
            name: "internal-only",
            network: "default",
            direction: "INGRESS",
            priority: 1000,
            sourceRanges: ["10.0.0.0/8"],
            allowed: [{ IPProtocol: "tcp", ports: ["22"] }],
            disabled: false,
          },
        ],
      });

      const resp = await handlers.gcloud_firewall_rules({ project: "acme-prod" });
      const data = parseResponse(resp) as {
        findings: Array<{ status: string }>;
      };
      expect(data.findings[0].status).toBe("pass");
    });
  });
});
