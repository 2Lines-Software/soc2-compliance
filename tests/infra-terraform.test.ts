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

import { registerTerraformTools } from "../src/tools/infra-terraform.js";
registerTerraformTools(mockServer);

function parseResponse(resp: { content: Array<{ text: string }> }): unknown {
  return JSON.parse(resp.content[0].text);
}

describe("terraform infrastructure tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("tf_version", () => {
    it("reports terraform version", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: { terraform_version: "1.7.0", platform: "darwin_arm64" },
      });

      const resp = await handlers.tf_version({});
      const data = parseResponse(resp) as { data: Record<string, unknown> };
      expect(data.data.version).toBe("1.7.0");
    });
  });

  describe("tf_state_resources", () => {
    it("reports managed resources by type", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: [
          "aws_instance.web",
          "aws_instance.api",
          "aws_s3_bucket.data",
          "aws_iam_role.app",
          "aws_security_group.web",
        ].join("\n"),
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.tf_state_resources({});
      const data = parseResponse(resp) as {
        data: { total: number; by_type: Record<string, number> };
        findings: Array<{ status: string; description: string }>;
      };

      expect(data.data.total).toBe(5);
      expect(data.data.by_type.aws_instance).toBe(2);
      expect(data.data.by_type.aws_s3_bucket).toBe(1);

      const passFinding = data.findings.find((f) => f.status === "pass");
      expect(passFinding?.description).toContain("5 resource");
      expect(passFinding?.description).toContain("Infrastructure as Code");
    });

    it("warns when no state file found", async () => {
      mockExecCli.mockResolvedValue({
        ok: false,
        error: "exec_error",
        message: "terraform failed",
        stderr: "No state file was found",
        exitCode: 1,
      });

      const resp = await handlers.tf_state_resources({});
      const data = parseResponse(resp) as {
        findings: Array<{ status: string }>;
      };
      expect(data.findings[0].status).toBe("warning");
    });

    it("warns when state is empty", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "\n",
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.tf_state_resources({});
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };
      expect(data.findings[0].status).toBe("warning");
      expect(data.findings[0].description).toContain("empty");
    });
  });

  describe("tf_workspace", () => {
    it("reports current workspace and all workspaces", async () => {
      let callCount = 0;
      mockExecCli.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { ok: true, stdout: "production\n", stderr: "", parsed: null };
        }
        return {
          ok: true,
          stdout: "  default\n  staging\n* production\n",
          stderr: "",
          parsed: null,
        };
      });

      const resp = await handlers.tf_workspace({});
      const data = parseResponse(resp) as {
        data: { current: string; all_workspaces: string[] };
        findings: Array<{ status: string; description: string }>;
      };

      expect(data.data.current).toBe("production");
      expect(data.data.all_workspaces).toHaveLength(3);

      const sepFinding = data.findings.find((f) =>
        f.description.includes("environment separation")
      );
      expect(sepFinding?.status).toBe("pass");
    });
  });

  describe("tf_providers", () => {
    it("reports providers in use", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: [
          "Providers required by configuration:",
          ".",
          "├── provider[registry.terraform.io/hashicorp/aws] ~> 5.0",
          "├── provider[registry.terraform.io/hashicorp/random] ~> 3.0",
          "└── provider[registry.terraform.io/cloudflare/cloudflare] ~> 4.0",
        ].join("\n"),
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.tf_providers({});
      const data = parseResponse(resp) as {
        data: { providers: string[] };
        findings: Array<{ status: string; description: string }>;
      };

      expect(data.data.providers).toHaveLength(3);
      expect(data.findings[0].status).toBe("pass");
      expect(data.findings[0].description).toContain("3 provider");
    });

    it("reports info when no providers found", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: null,
      });

      const resp = await handlers.tf_providers({});
      const data = parseResponse(resp) as {
        findings: Array<{ status: string }>;
      };
      expect(data.findings[0].status).toBe("info");
    });
  });
});
