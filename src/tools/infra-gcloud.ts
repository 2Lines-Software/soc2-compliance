import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  execCli,
  infraResponse,
  infraError,
  type Finding,
} from "../utils/cli.js";
import { today } from "../utils/documents.js";

const SOURCE = "gcloud";

export function registerGCloudTools(server: McpServer): void {
  // --- gcloud_auth_status ---
  server.registerTool(
    "gcloud_auth_status",
    {
      title: "Google Cloud Auth Status",
      description:
        "Check if the gcloud CLI is installed and authenticated. Run this before other GCloud tools.",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await execCli("gcloud", [
        "auth",
        "list",
        "--format=json",
      ]);

      if (!result.ok) {
        return infraError(SOURCE, "gcloud_auth_status", result);
      }

      const accounts = result.parsed as Array<{
        account: string;
        status: string;
      }>;
      const active = accounts?.find((a) => a.status === "ACTIVE");

      return infraResponse({
        source: SOURCE,
        tool: "gcloud_auth_status",
        tsc_controls: [],
        collected_at: today(),
        data: {
          authenticated: !!active,
          active_account: active?.account ?? null,
          total_accounts: accounts?.length ?? 0,
        },
        findings: [],
      });
    }
  );

  // --- gcloud_iam_policy ---
  server.registerTool(
    "gcloud_iam_policy",
    {
      title: "Google Cloud IAM Policy",
      description:
        "Get project-level IAM policy bindings. Evidence for CC5.1 (logical access).",
      inputSchema: z.object({
        project: z.string().describe("GCP project ID"),
      }),
    },
    async ({ project }) => {
      const result = await execCli("gcloud", [
        "projects",
        "get-iam-policy",
        project,
        "--format=json",
      ]);

      if (!result.ok) {
        return infraError(SOURCE, "gcloud_iam_policy", result);
      }

      const data = result.parsed as {
        bindings?: Array<{
          role: string;
          members: string[];
        }>;
      };
      const bindings = data?.bindings ?? [];
      const findings: Finding[] = [];

      // Flag overly broad roles
      const broadRoles = ["roles/owner", "roles/editor"];
      const broadBindings = bindings.filter((b) =>
        broadRoles.includes(b.role)
      );

      if (broadBindings.length > 0) {
        const totalBroadMembers = broadBindings.reduce(
          (sum, b) => sum + b.members.length,
          0
        );
        if (totalBroadMembers > 3) {
          findings.push({
            control_id: "CC5.1",
            status: "warning",
            description: `${totalBroadMembers} members have Owner/Editor roles — consider more granular roles`,
          });
        } else {
          findings.push({
            control_id: "CC5.1",
            status: "info",
            description: `${totalBroadMembers} member(s) with Owner/Editor roles`,
          });
        }
      }

      findings.push({
        control_id: "CC5.1",
        status: "info",
        description: `${bindings.length} IAM binding(s) across ${new Set(bindings.map((b) => b.role)).size} role(s)`,
      });

      return infraResponse({
        source: SOURCE,
        tool: "gcloud_iam_policy",
        tsc_controls: ["CC5.1"],
        collected_at: today(),
        data: bindings.map((b) => ({
          role: b.role,
          member_count: b.members.length,
          members: b.members,
        })),
        findings,
      });
    }
  );

  // --- gcloud_service_accounts ---
  server.registerTool(
    "gcloud_service_accounts",
    {
      title: "Google Cloud Service Accounts",
      description:
        "List service accounts and their status. Evidence for CC5.1 (logical access).",
      inputSchema: z.object({
        project: z.string().describe("GCP project ID"),
      }),
    },
    async ({ project }) => {
      const result = await execCli("gcloud", [
        "iam",
        "service-accounts",
        "list",
        `--project=${project}`,
        "--format=json",
      ]);

      if (!result.ok) {
        return infraError(SOURCE, "gcloud_service_accounts", result);
      }

      const accounts = result.parsed as Array<{
        email: string;
        displayName: string;
        disabled: boolean;
      }>;
      const findings: Finding[] = [];

      const active = accounts.filter((a) => !a.disabled);
      const disabled = accounts.filter((a) => a.disabled);

      // Flag default service accounts
      const defaultSAs = active.filter(
        (a) =>
          a.email.includes("compute@developer") ||
          a.email.includes("appspot.gserviceaccount.com")
      );

      if (defaultSAs.length > 0) {
        findings.push({
          control_id: "CC5.1",
          status: "warning",
          description: `${defaultSAs.length} default service account(s) still active — consider disabling if unused`,
        });
      }

      findings.push({
        control_id: "CC5.1",
        status: "info",
        description: `${active.length} active service account(s), ${disabled.length} disabled`,
      });

      return infraResponse({
        source: SOURCE,
        tool: "gcloud_service_accounts",
        tsc_controls: ["CC5.1"],
        collected_at: today(),
        data: accounts.map((a) => ({
          email: a.email,
          display_name: a.displayName,
          disabled: a.disabled,
        })),
        findings,
      });
    }
  );

  // --- gcloud_logging_sinks ---
  server.registerTool(
    "gcloud_logging_sinks",
    {
      title: "Google Cloud Logging Sinks",
      description:
        "Check Cloud Logging sink configuration. Evidence for CC7.1 (monitoring).",
      inputSchema: z.object({
        project: z.string().describe("GCP project ID"),
      }),
    },
    async ({ project }) => {
      const result = await execCli("gcloud", [
        "logging",
        "sinks",
        "list",
        `--project=${project}`,
        "--format=json",
      ]);

      if (!result.ok) {
        return infraError(SOURCE, "gcloud_logging_sinks", result);
      }

      const sinks = result.parsed as Array<{
        name: string;
        destination: string;
        filter?: string;
      }>;
      const findings: Finding[] = [];

      if (!sinks || sinks.length === 0) {
        findings.push({
          control_id: "CC7.1",
          status: "warning",
          description: "No custom logging sinks configured — logs may only be in default retention",
        });
      } else {
        findings.push({
          control_id: "CC7.1",
          status: "pass",
          description: `${sinks.length} logging sink(s) configured for log export`,
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "gcloud_logging_sinks",
        tsc_controls: ["CC7.1"],
        collected_at: today(),
        data: (sinks || []).map((s) => ({
          name: s.name,
          destination: s.destination,
          has_filter: !!s.filter,
        })),
        findings,
      });
    }
  );

  // --- gcloud_kms_keys ---
  server.registerTool(
    "gcloud_kms_keys",
    {
      title: "Google Cloud KMS Keys",
      description:
        "Check KMS keyrings and key configuration. Evidence for CC6.1 (encryption).",
      inputSchema: z.object({
        project: z.string().describe("GCP project ID"),
        location: z
          .string()
          .default("global")
          .describe("KMS location (default: global)"),
      }),
    },
    async ({ project, location }) => {
      const keyringsResult = await execCli("gcloud", [
        "kms",
        "keyrings",
        "list",
        `--project=${project}`,
        `--location=${location}`,
        "--format=json",
      ]);

      if (!keyringsResult.ok) {
        // Might not have KMS API enabled
        if (keyringsResult.stderr?.includes("PERMISSION_DENIED") || keyringsResult.stderr?.includes("not enabled")) {
          return infraResponse({
            source: SOURCE,
            tool: "gcloud_kms_keys",
            tsc_controls: ["CC6.1"],
            collected_at: today(),
            data: { keyrings: [] },
            findings: [
              {
                control_id: "CC6.1",
                status: "info",
                description: "KMS API not enabled or no permissions — may be using default Google-managed encryption",
              },
            ],
          });
        }
        return infraError(SOURCE, "gcloud_kms_keys", keyringsResult);
      }

      const keyrings = keyringsResult.parsed as Array<{ name: string }>;

      if (!keyrings || keyrings.length === 0) {
        return infraResponse({
          source: SOURCE,
          tool: "gcloud_kms_keys",
          tsc_controls: ["CC6.1"],
          collected_at: today(),
          data: { keyrings: [] },
          findings: [
            {
              control_id: "CC6.1",
              status: "info",
              description: "No KMS keyrings found — using Google-managed encryption only",
            },
          ],
        });
      }

      // List keys per keyring
      const allKeys: Array<{
        keyring: string;
        name: string;
        purpose: string;
        rotation_period: string | null;
      }> = [];

      for (const kr of keyrings) {
        // Extract keyring short name from full resource name
        const krName = kr.name.split("/").pop() ?? kr.name;
        const keysResult = await execCli("gcloud", [
          "kms",
          "keys",
          "list",
          `--keyring=${krName}`,
          `--project=${project}`,
          `--location=${location}`,
          "--format=json",
        ]);

        if (keysResult.ok) {
          const keys = keysResult.parsed as Array<{
            name: string;
            purpose: string;
            rotationPeriod?: string;
          }>;
          for (const key of keys || []) {
            allKeys.push({
              keyring: krName,
              name: key.name.split("/").pop() ?? key.name,
              purpose: key.purpose,
              rotation_period: key.rotationPeriod ?? null,
            });
          }
        }
      }

      const findings: Finding[] = [];
      const withRotation = allKeys.filter((k) => k.rotation_period);
      const withoutRotation = allKeys.filter((k) => !k.rotation_period);

      if (allKeys.length > 0) {
        findings.push({
          control_id: "CC6.1",
          status: "pass",
          description: `${allKeys.length} customer-managed key(s) across ${keyrings.length} keyring(s)`,
        });
      }

      if (withoutRotation.length > 0) {
        findings.push({
          control_id: "CC6.1",
          status: "warning",
          description: `${withoutRotation.length} key(s) without automatic rotation configured`,
        });
      } else if (withRotation.length > 0) {
        findings.push({
          control_id: "CC6.1",
          status: "pass",
          description: `All ${withRotation.length} key(s) have rotation configured`,
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "gcloud_kms_keys",
        tsc_controls: ["CC6.1"],
        collected_at: today(),
        data: { keyrings: keyrings.length, keys: allKeys },
        findings,
      });
    }
  );

  // --- gcloud_firewall_rules ---
  server.registerTool(
    "gcloud_firewall_rules",
    {
      title: "Google Cloud Firewall Rules",
      description:
        "Check VPC firewall rules for overly permissive access. Evidence for CC6.6 (network security).",
      inputSchema: z.object({
        project: z.string().describe("GCP project ID"),
      }),
    },
    async ({ project }) => {
      const result = await execCli("gcloud", [
        "compute",
        "firewall-rules",
        "list",
        `--project=${project}`,
        "--format=json",
      ]);

      if (!result.ok) {
        return infraError(SOURCE, "gcloud_firewall_rules", result);
      }

      const rules = result.parsed as Array<{
        name: string;
        network: string;
        direction: string;
        priority: number;
        sourceRanges?: string[];
        allowed?: Array<{
          IPProtocol: string;
          ports?: string[];
        }>;
        disabled: boolean;
      }>;
      const findings: Finding[] = [];

      // Check for overly permissive ingress rules
      const openSsh: string[] = [];
      const openAll: string[] = [];

      for (const rule of rules || []) {
        if (rule.disabled || rule.direction !== "INGRESS") continue;
        if (!rule.sourceRanges?.includes("0.0.0.0/0")) continue;

        for (const allowed of rule.allowed ?? []) {
          if (allowed.ports?.includes("22")) {
            openSsh.push(rule.name);
          }
          if (!allowed.ports || allowed.IPProtocol === "all") {
            openAll.push(rule.name);
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

      if (openAll.length > 0) {
        findings.push({
          control_id: "CC6.6",
          status: "fail",
          description: `All traffic open to 0.0.0.0/0 in: ${openAll.join(", ")}`,
        });
      }

      if (openSsh.length === 0 && openAll.length === 0) {
        findings.push({
          control_id: "CC6.6",
          status: "pass",
          description: `${(rules || []).length} firewall rule(s) reviewed — no overly permissive ingress rules found`,
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "gcloud_firewall_rules",
        tsc_controls: ["CC6.6"],
        collected_at: today(),
        data: (rules || []).map((r) => ({
          name: r.name,
          network: r.network,
          direction: r.direction,
          priority: r.priority,
          disabled: r.disabled,
        })),
        findings,
      });
    }
  );
}
