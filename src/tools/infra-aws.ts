import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  execCli,
  infraResponse,
  infraError,
  type Finding,
} from "../utils/cli.js";
import { today } from "../utils/documents.js";

const SOURCE = "aws";

function regionArgs(region?: string): string[] {
  return region ? ["--region", region] : [];
}

export function registerAwsTools(server: McpServer): void {
  // --- aws_auth_status ---
  server.registerTool(
    "aws_auth_status",
    {
      title: "AWS Auth Status",
      description:
        "Check if the AWS CLI is installed and authenticated. Run this before other AWS tools.",
      inputSchema: z.object({
        region: z.string().optional().describe("AWS region (uses default if omitted)"),
      }),
    },
    async ({ region }) => {
      const result = await execCli("aws", [
        "sts",
        "get-caller-identity",
        "--output",
        "json",
        ...regionArgs(region),
      ]);

      if (!result.ok) {
        return infraError(SOURCE, "aws_auth_status", result);
      }

      const data = result.parsed as {
        Account?: string;
        Arn?: string;
        UserId?: string;
      };

      return infraResponse({
        source: SOURCE,
        tool: "aws_auth_status",
        tsc_controls: [],
        collected_at: today(),
        data: {
          authenticated: true,
          account: data?.Account,
          arn: data?.Arn,
        },
        findings: [],
      });
    }
  );

  // --- aws_iam_mfa_status ---
  server.registerTool(
    "aws_iam_mfa_status",
    {
      title: "AWS IAM MFA Status",
      description:
        "Check MFA enrollment for all IAM users. Evidence for CC5.1 (logical access) and CC6.2 (authentication).",
      inputSchema: z.object({
        region: z.string().optional().describe("AWS region"),
      }),
    },
    async ({ region }) => {
      // List users
      const usersResult = await execCli("aws", [
        "iam",
        "list-users",
        "--output",
        "json",
        ...regionArgs(region),
      ]);

      if (!usersResult.ok) {
        return infraError(SOURCE, "aws_iam_mfa_status", usersResult);
      }

      const usersData = usersResult.parsed as {
        Users?: Array<{ UserName: string; Arn: string; CreateDate: string }>;
      };
      const users = usersData?.Users ?? [];

      if (users.length > 50) {
        return infraResponse({
          source: SOURCE,
          tool: "aws_iam_mfa_status",
          tsc_controls: ["CC5.1", "CC6.2"],
          collected_at: today(),
          data: { user_count: users.length },
          findings: [
            {
              control_id: "CC5.1",
              status: "warning",
              description: `${users.length} IAM users found — too many for automated MFA check. Review manually.`,
            },
          ],
        });
      }

      // Check MFA for each user
      const userResults: Array<{
        username: string;
        has_mfa: boolean;
      }> = [];

      for (const user of users) {
        const mfaResult = await execCli("aws", [
          "iam",
          "list-mfa-devices",
          "--user-name",
          user.UserName,
          "--output",
          "json",
          ...regionArgs(region),
        ]);

        if (mfaResult.ok) {
          const mfaData = mfaResult.parsed as {
            MFADevices?: Array<unknown>;
          };
          userResults.push({
            username: user.UserName,
            has_mfa: (mfaData?.MFADevices?.length ?? 0) > 0,
          });
        }
      }

      const findings: Finding[] = [];
      const withMfa = userResults.filter((u) => u.has_mfa);
      const withoutMfa = userResults.filter((u) => !u.has_mfa);

      if (withoutMfa.length > 0) {
        findings.push({
          control_id: "CC6.2",
          status: "fail",
          description: `${withoutMfa.length} user(s) without MFA: ${withoutMfa.map((u) => u.username).join(", ")}`,
        });
      }

      if (withMfa.length > 0) {
        findings.push({
          control_id: "CC6.2",
          status: "pass",
          description: `${withMfa.length} user(s) with MFA enabled`,
        });
      }

      findings.push({
        control_id: "CC5.1",
        status: withoutMfa.length === 0 ? "pass" : "warning",
        description: `${userResults.length} IAM users: ${withMfa.length} with MFA, ${withoutMfa.length} without`,
      });

      return infraResponse({
        source: SOURCE,
        tool: "aws_iam_mfa_status",
        tsc_controls: ["CC5.1", "CC6.2"],
        collected_at: today(),
        data: userResults,
        findings,
      });
    }
  );

  // --- aws_cloudtrail_status ---
  server.registerTool(
    "aws_cloudtrail_status",
    {
      title: "AWS CloudTrail Status",
      description:
        "Check CloudTrail logging configuration. Evidence for CC7.1 (monitoring).",
      inputSchema: z.object({
        region: z.string().optional().describe("AWS region"),
      }),
    },
    async ({ region }) => {
      const trailsResult = await execCli("aws", [
        "cloudtrail",
        "describe-trails",
        "--output",
        "json",
        ...regionArgs(region),
      ]);

      if (!trailsResult.ok) {
        return infraError(SOURCE, "aws_cloudtrail_status", trailsResult);
      }

      const trailsData = trailsResult.parsed as {
        trailList?: Array<{
          Name: string;
          TrailARN: string;
          IsMultiRegionTrail: boolean;
          LogFileValidationEnabled: boolean;
          S3BucketName: string;
          HomeRegion: string;
        }>;
      };
      const trails = trailsData?.trailList ?? [];
      const findings: Finding[] = [];

      if (trails.length === 0) {
        findings.push({
          control_id: "CC7.1",
          status: "fail",
          description: "No CloudTrail trails configured",
        });
        return infraResponse({
          source: SOURCE,
          tool: "aws_cloudtrail_status",
          tsc_controls: ["CC7.1"],
          collected_at: today(),
          data: { trails: [] },
          findings,
        });
      }

      // Check status of each trail
      const trailResults: Array<{
        name: string;
        is_logging: boolean;
        multi_region: boolean;
        log_validation: boolean;
      }> = [];

      for (const trail of trails) {
        const statusResult = await execCli("aws", [
          "cloudtrail",
          "get-trail-status",
          "--name",
          trail.TrailARN,
          "--output",
          "json",
          ...regionArgs(region),
        ]);

        const isLogging =
          statusResult.ok &&
          (statusResult.parsed as { IsLogging?: boolean })?.IsLogging === true;

        trailResults.push({
          name: trail.Name,
          is_logging: isLogging,
          multi_region: trail.IsMultiRegionTrail,
          log_validation: trail.LogFileValidationEnabled,
        });
      }

      const activeTrails = trailResults.filter((t) => t.is_logging);
      const multiRegion = trailResults.filter(
        (t) => t.is_logging && t.multi_region
      );

      if (activeTrails.length > 0) {
        findings.push({
          control_id: "CC7.1",
          status: "pass",
          description: `${activeTrails.length} active CloudTrail trail(s)`,
        });
      } else {
        findings.push({
          control_id: "CC7.1",
          status: "fail",
          description: "No active CloudTrail trails (logging disabled on all trails)",
        });
      }

      if (multiRegion.length > 0) {
        findings.push({
          control_id: "CC7.1",
          status: "pass",
          description: "Multi-region trail active",
        });
      } else if (activeTrails.length > 0) {
        findings.push({
          control_id: "CC7.1",
          status: "warning",
          description: "No multi-region trail — events may be missed in other regions",
        });
      }

      const withValidation = trailResults.filter(
        (t) => t.is_logging && t.log_validation
      );
      if (withValidation.length > 0) {
        findings.push({
          control_id: "CC7.1",
          status: "pass",
          description: "Log file validation enabled",
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "aws_cloudtrail_status",
        tsc_controls: ["CC7.1"],
        collected_at: today(),
        data: trailResults,
        findings,
      });
    }
  );

  // --- aws_s3_encryption ---
  server.registerTool(
    "aws_s3_encryption",
    {
      title: "AWS S3 Encryption",
      description:
        "Check S3 bucket default encryption configuration. Evidence for CC6.1 (encryption).",
      inputSchema: z.object({
        region: z.string().optional().describe("AWS region"),
        bucket: z
          .string()
          .optional()
          .describe("Specific bucket name (checks all if omitted)"),
      }),
    },
    async ({ region, bucket }) => {
      let bucketNames: string[];

      if (bucket) {
        bucketNames = [bucket];
      } else {
        const listResult = await execCli("aws", [
          "s3api",
          "list-buckets",
          "--output",
          "json",
          ...regionArgs(region),
        ]);

        if (!listResult.ok) {
          return infraError(SOURCE, "aws_s3_encryption", listResult);
        }

        const listData = listResult.parsed as {
          Buckets?: Array<{ Name: string }>;
        };
        bucketNames = (listData?.Buckets ?? []).map((b) => b.Name);
      }

      const results: Array<{
        bucket: string;
        encrypted: boolean;
        algorithm: string | null;
      }> = [];

      for (const name of bucketNames) {
        const encResult = await execCli("aws", [
          "s3api",
          "get-bucket-encryption",
          "--bucket",
          name,
          "--output",
          "json",
          ...regionArgs(region),
        ]);

        if (encResult.ok) {
          const encData = encResult.parsed as {
            ServerSideEncryptionConfiguration?: {
              Rules?: Array<{
                ApplyServerSideEncryptionByDefault?: {
                  SSEAlgorithm?: string;
                };
              }>;
            };
          };
          const algo =
            encData?.ServerSideEncryptionConfiguration?.Rules?.[0]
              ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm ?? null;
          results.push({ bucket: name, encrypted: !!algo, algorithm: algo });
        } else {
          results.push({ bucket: name, encrypted: false, algorithm: null });
        }
      }

      const findings: Finding[] = [];
      const unencrypted = results.filter((r) => !r.encrypted);
      const encrypted = results.filter((r) => r.encrypted);

      if (unencrypted.length > 0) {
        findings.push({
          control_id: "CC6.1",
          status: "fail",
          description: `${unencrypted.length} bucket(s) without default encryption: ${unencrypted.map((r) => r.bucket).join(", ")}`,
        });
      }

      if (encrypted.length > 0) {
        findings.push({
          control_id: "CC6.1",
          status: "pass",
          description: `${encrypted.length} bucket(s) with encryption (${encrypted.map((r) => `${r.bucket}: ${r.algorithm}`).join(", ")})`,
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "aws_s3_encryption",
        tsc_controls: ["CC6.1"],
        collected_at: today(),
        data: results,
        findings,
      });
    }
  );

  // --- aws_kms_keys ---
  server.registerTool(
    "aws_kms_keys",
    {
      title: "AWS KMS Keys",
      description:
        "Check KMS key configuration and rotation status. Evidence for CC6.1 (encryption).",
      inputSchema: z.object({
        region: z.string().optional().describe("AWS region"),
      }),
    },
    async ({ region }) => {
      const keysResult = await execCli("aws", [
        "kms",
        "list-keys",
        "--output",
        "json",
        ...regionArgs(region),
      ]);

      if (!keysResult.ok) {
        return infraError(SOURCE, "aws_kms_keys", keysResult);
      }

      const keysData = keysResult.parsed as {
        Keys?: Array<{ KeyId: string; KeyArn: string }>;
      };
      const keys = keysData?.Keys ?? [];

      const results: Array<{
        key_id: string;
        description: string;
        state: string;
        manager: string;
        rotation_enabled: boolean;
      }> = [];

      for (const key of keys) {
        const descResult = await execCli("aws", [
          "kms",
          "describe-key",
          "--key-id",
          key.KeyId,
          "--output",
          "json",
          ...regionArgs(region),
        ]);

        if (!descResult.ok) continue;

        const descData = descResult.parsed as {
          KeyMetadata?: {
            KeyId: string;
            Description: string;
            KeyState: string;
            KeyManager: string;
          };
        };
        const meta = descData?.KeyMetadata;
        if (!meta) continue;

        // Only check rotation for customer-managed, enabled keys
        let rotationEnabled = false;
        if (meta.KeyManager === "CUSTOMER" && meta.KeyState === "Enabled") {
          const rotResult = await execCli("aws", [
            "kms",
            "get-key-rotation-status",
            "--key-id",
            key.KeyId,
            "--output",
            "json",
            ...regionArgs(region),
          ]);
          if (rotResult.ok) {
            rotationEnabled =
              (rotResult.parsed as { KeyRotationEnabled?: boolean })
                ?.KeyRotationEnabled === true;
          }
        }

        results.push({
          key_id: meta.KeyId,
          description: meta.Description || "(none)",
          state: meta.KeyState,
          manager: meta.KeyManager,
          rotation_enabled: rotationEnabled,
        });
      }

      const findings: Finding[] = [];
      const customerKeys = results.filter((k) => k.manager === "CUSTOMER");
      const withoutRotation = customerKeys.filter(
        (k) => k.state === "Enabled" && !k.rotation_enabled
      );

      if (customerKeys.length === 0) {
        findings.push({
          control_id: "CC6.1",
          status: "info",
          description: "No customer-managed KMS keys found (using AWS-managed keys only)",
        });
      } else if (withoutRotation.length > 0) {
        findings.push({
          control_id: "CC6.1",
          status: "warning",
          description: `${withoutRotation.length} customer-managed key(s) without automatic rotation`,
        });
      } else {
        findings.push({
          control_id: "CC6.1",
          status: "pass",
          description: `All ${customerKeys.length} customer-managed key(s) have rotation enabled`,
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "aws_kms_keys",
        tsc_controls: ["CC6.1"],
        collected_at: today(),
        data: results,
        findings,
      });
    }
  );

  // --- aws_security_groups ---
  server.registerTool(
    "aws_security_groups",
    {
      title: "AWS Security Groups",
      description:
        "Check VPC security group rules for overly permissive access. Evidence for CC6.6 (network security).",
      inputSchema: z.object({
        region: z.string().optional().describe("AWS region"),
        vpc_id: z.string().optional().describe("Filter by VPC ID"),
      }),
    },
    async ({ region, vpc_id }) => {
      const args = [
        "ec2",
        "describe-security-groups",
        "--output",
        "json",
        ...regionArgs(region),
      ];

      if (vpc_id) {
        args.push("--filters", `Name=vpc-id,Values=${vpc_id}`);
      }

      const result = await execCli("aws", args);

      if (!result.ok) {
        return infraError(SOURCE, "aws_security_groups", result);
      }

      const data = result.parsed as {
        SecurityGroups?: Array<{
          GroupId: string;
          GroupName: string;
          VpcId: string;
          IpPermissions: Array<{
            IpProtocol: string;
            FromPort?: number;
            ToPort?: number;
            IpRanges: Array<{ CidrIp: string }>;
          }>;
        }>;
      };
      const groups = data?.SecurityGroups ?? [];
      const findings: Finding[] = [];

      // Check for overly permissive rules
      const openSsh: string[] = [];
      const openWide: string[] = [];

      for (const sg of groups) {
        for (const rule of sg.IpPermissions) {
          const hasOpenCidr = rule.IpRanges.some(
            (r) => r.CidrIp === "0.0.0.0/0"
          );
          if (!hasOpenCidr) continue;

          if (rule.FromPort === 22 || rule.ToPort === 22) {
            openSsh.push(`${sg.GroupId} (${sg.GroupName})`);
          } else if (
            rule.IpProtocol === "-1" ||
            (rule.FromPort === 0 && rule.ToPort === 65535)
          ) {
            openWide.push(`${sg.GroupId} (${sg.GroupName})`);
          }
        }
      }

      if (openSsh.length > 0) {
        findings.push({
          control_id: "CC6.6",
          status: "fail",
          description: `SSH (port 22) open to 0.0.0.0/0 in: ${openSsh.join(", ")}`,
        });
      }

      if (openWide.length > 0) {
        findings.push({
          control_id: "CC6.6",
          status: "fail",
          description: `All ports open to 0.0.0.0/0 in: ${openWide.join(", ")}`,
        });
      }

      if (openSsh.length === 0 && openWide.length === 0) {
        findings.push({
          control_id: "CC6.6",
          status: "pass",
          description: `${groups.length} security group(s) reviewed — no overly permissive inbound rules found`,
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "aws_security_groups",
        tsc_controls: ["CC6.6"],
        collected_at: today(),
        data: groups.map((sg) => ({
          id: sg.GroupId,
          name: sg.GroupName,
          vpc: sg.VpcId,
          inbound_rules: sg.IpPermissions.length,
        })),
        findings,
      });
    }
  );

  // --- aws_backup_config ---
  server.registerTool(
    "aws_backup_config",
    {
      title: "AWS Backup Configuration",
      description:
        "Check AWS Backup vaults and plans. Evidence for CC7.3 (backup/recovery).",
      inputSchema: z.object({
        region: z.string().optional().describe("AWS region"),
      }),
    },
    async ({ region }) => {
      const vaultsResult = await execCli("aws", [
        "backup",
        "list-backup-vaults",
        "--output",
        "json",
        ...regionArgs(region),
      ]);

      const plansResult = await execCli("aws", [
        "backup",
        "list-backup-plans",
        "--output",
        "json",
        ...regionArgs(region),
      ]);

      if (!vaultsResult.ok && !plansResult.ok) {
        return infraError(SOURCE, "aws_backup_config", vaultsResult);
      }

      const vaults =
        vaultsResult.ok
          ? ((vaultsResult.parsed as { BackupVaultList?: Array<{ BackupVaultName: string; NumberOfRecoveryPoints: number }> })?.BackupVaultList ?? [])
          : [];

      const plans =
        plansResult.ok
          ? ((plansResult.parsed as { BackupPlansList?: Array<{ BackupPlanName: string; BackupPlanId: string }> })?.BackupPlansList ?? [])
          : [];

      const findings: Finding[] = [];

      if (plans.length === 0 && vaults.length === 0) {
        findings.push({
          control_id: "CC7.3",
          status: "warning",
          description: "No AWS Backup plans or vaults configured",
        });
      } else {
        if (plans.length > 0) {
          findings.push({
            control_id: "CC7.3",
            status: "pass",
            description: `${plans.length} backup plan(s) configured`,
          });
        }
        if (vaults.length > 0) {
          findings.push({
            control_id: "CC7.3",
            status: "info",
            description: `${vaults.length} backup vault(s) with ${vaults.reduce((sum, v) => sum + (v.NumberOfRecoveryPoints || 0), 0)} total recovery points`,
          });
        }
      }

      return infraResponse({
        source: SOURCE,
        tool: "aws_backup_config",
        tsc_controls: ["CC7.3"],
        collected_at: today(),
        data: { vaults, plans },
        findings,
      });
    }
  );
}
