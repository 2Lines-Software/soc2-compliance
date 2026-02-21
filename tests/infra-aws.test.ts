import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

const handlers: Record<string, Function> = {};
const mockServer = {
  registerTool: (name: string, _config: unknown, handler: Function) => {
    handlers[name] = handler;
  },
} as unknown as McpServer;

import { registerAwsTools } from "../src/tools/infra-aws.js";
registerAwsTools(mockServer);

function parseResponse(resp: { content: Array<{ text: string }> }): unknown {
  return JSON.parse(resp.content[0].text);
}

describe("aws infrastructure tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("aws_auth_status", () => {
    it("reports authenticated when sts succeeds", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "{}",
        stderr: "",
        parsed: { Account: "123456", Arn: "arn:aws:iam::123456:user/alice", UserId: "AIDA123" },
      });

      const resp = await handlers.aws_auth_status({});
      const data = parseResponse(resp) as Record<string, unknown>;
      expect((data.data as Record<string, unknown>).authenticated).toBe(true);
      expect((data.data as Record<string, unknown>).account).toBe("123456");
    });
  });

  describe("aws_iam_mfa_status", () => {
    it("reports users with and without MFA", async () => {
      const usersFixture = loadFixture("aws-iam-users.json");
      let callCount = 0;

      mockExecCli.mockImplementation(async (_cmd, args) => {
        callCount++;
        if (args.includes("list-users")) {
          return { ok: true, stdout: "", stderr: "", parsed: usersFixture };
        }
        if (args.includes("list-mfa-devices")) {
          // alice has MFA, bob doesn't
          const userName = args[args.indexOf("--user-name") + 1];
          if (userName === "alice") {
            return { ok: true, stdout: "", stderr: "", parsed: { MFADevices: [{ SerialNumber: "arn:..." }] } };
          }
          return { ok: true, stdout: "", stderr: "", parsed: { MFADevices: [] } };
        }
        return { ok: true, stdout: "", stderr: "", parsed: {} };
      });

      const resp = await handlers.aws_iam_mfa_status({});
      const data = parseResponse(resp) as {
        findings: Array<{ control_id: string; status: string; description: string }>;
      };

      const failFinding = data.findings.find(
        (f) => f.control_id === "CC6.2" && f.status === "fail"
      );
      expect(failFinding?.description).toContain("bob");

      const passFinding = data.findings.find(
        (f) => f.control_id === "CC6.2" && f.status === "pass"
      );
      expect(passFinding?.description).toContain("1 user");
    });

    it("warns when too many users", async () => {
      const manyUsers = {
        Users: Array.from({ length: 55 }, (_, i) => ({
          UserName: `user${i}`,
          Arn: `arn:aws:iam::123456:user/user${i}`,
          CreateDate: "2025-01-01T00:00:00Z",
        })),
      };

      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: manyUsers,
      });

      const resp = await handlers.aws_iam_mfa_status({});
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      expect(data.findings[0].status).toBe("warning");
      expect(data.findings[0].description).toContain("55");
    });
  });

  describe("aws_cloudtrail_status", () => {
    it("reports active multi-region trail", async () => {
      const trailsFixture = loadFixture("aws-cloudtrail.json");

      mockExecCli.mockImplementation(async (_cmd, args) => {
        if (args.includes("describe-trails")) {
          return { ok: true, stdout: "", stderr: "", parsed: trailsFixture };
        }
        if (args.includes("get-trail-status")) {
          return { ok: true, stdout: "", stderr: "", parsed: { IsLogging: true } };
        }
        return { ok: true, stdout: "", stderr: "", parsed: {} };
      });

      const resp = await handlers.aws_cloudtrail_status({});
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const activeFinding = data.findings.find((f) =>
        f.description.includes("active CloudTrail")
      );
      expect(activeFinding?.status).toBe("pass");

      const multiRegionFinding = data.findings.find((f) =>
        f.description.includes("Multi-region")
      );
      expect(multiRegionFinding?.status).toBe("pass");
    });

    it("reports fail when no trails configured", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: { trailList: [] },
      });

      const resp = await handlers.aws_cloudtrail_status({});
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      expect(data.findings[0].status).toBe("fail");
      expect(data.findings[0].description).toContain("No CloudTrail");
    });
  });

  describe("aws_s3_encryption", () => {
    it("reports encrypted and unencrypted buckets", async () => {
      mockExecCli.mockImplementation(async (_cmd, args) => {
        if (args.includes("list-buckets")) {
          return {
            ok: true, stdout: "", stderr: "",
            parsed: { Buckets: [{ Name: "data-bucket" }, { Name: "logs-bucket" }] },
          };
        }
        if (args.includes("get-bucket-encryption")) {
          const bucket = args[args.indexOf("--bucket") + 1];
          if (bucket === "data-bucket") {
            return {
              ok: true, stdout: "", stderr: "",
              parsed: {
                ServerSideEncryptionConfiguration: {
                  Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "aws:kms" } }],
                },
              },
            };
          }
          return { ok: false, error: "exec_error", message: "No encryption", stderr: "" };
        }
        return { ok: true, stdout: "", stderr: "", parsed: {} };
      });

      const resp = await handlers.aws_s3_encryption({});
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const failFinding = data.findings.find((f) => f.status === "fail");
      expect(failFinding?.description).toContain("logs-bucket");

      const passFinding = data.findings.find((f) => f.status === "pass");
      expect(passFinding?.description).toContain("data-bucket");
    });
  });

  describe("aws_security_groups", () => {
    it("flags SSH open to the world", async () => {
      const fixture = loadFixture("aws-security-groups.json");
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: fixture,
      });

      const resp = await handlers.aws_security_groups({});
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const sshFinding = data.findings.find((f) =>
        f.description.includes("SSH")
      );
      expect(sshFinding?.status).toBe("fail");
      expect(sshFinding?.description).toContain("sg-456");
    });

    it("passes when no overly permissive rules", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: {
          SecurityGroups: [
            {
              GroupId: "sg-safe",
              GroupName: "safe-group",
              VpcId: "vpc-abc",
              IpPermissions: [
                { IpProtocol: "tcp", FromPort: 443, ToPort: 443, IpRanges: [{ CidrIp: "10.0.0.0/8" }] },
              ],
            },
          ],
        },
      });

      const resp = await handlers.aws_security_groups({});
      const data = parseResponse(resp) as {
        findings: Array<{ status: string }>;
      };
      expect(data.findings[0].status).toBe("pass");
    });
  });

  describe("aws_backup_config", () => {
    it("reports backup plans and vaults", async () => {
      mockExecCli.mockImplementation(async (_cmd, args) => {
        if (args.includes("list-backup-vaults")) {
          return {
            ok: true, stdout: "", stderr: "",
            parsed: { BackupVaultList: [{ BackupVaultName: "default", NumberOfRecoveryPoints: 42 }] },
          };
        }
        if (args.includes("list-backup-plans")) {
          return {
            ok: true, stdout: "", stderr: "",
            parsed: { BackupPlansList: [{ BackupPlanName: "daily", BackupPlanId: "plan-123" }] },
          };
        }
        return { ok: true, stdout: "", stderr: "", parsed: {} };
      });

      const resp = await handlers.aws_backup_config({});
      const data = parseResponse(resp) as {
        findings: Array<{ status: string; description: string }>;
      };

      const planFinding = data.findings.find((f) =>
        f.description.includes("backup plan")
      );
      expect(planFinding?.status).toBe("pass");

      const vaultFinding = data.findings.find((f) =>
        f.description.includes("vault")
      );
      expect(vaultFinding?.description).toContain("42");
    });

    it("warns when no backups configured", async () => {
      mockExecCli.mockResolvedValue({
        ok: true,
        stdout: "",
        stderr: "",
        parsed: {},
      });

      const resp = await handlers.aws_backup_config({});
      const data = parseResponse(resp) as {
        findings: Array<{ status: string }>;
      };
      expect(data.findings[0].status).toBe("warning");
    });
  });
});
