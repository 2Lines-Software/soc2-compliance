import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  execCli,
  infraResponse,
  infraError,
  type Finding,
  type CliError,
} from "../utils/cli.js";
import { today } from "../utils/documents.js";

const SOURCE = "cloudflare";
const API_BASE = "https://api.cloudflare.com/client/v4";

function getToken(): string | undefined {
  return process.env.CF_API_TOKEN;
}

async function cfApi(
  path: string
): ReturnType<typeof execCli> {
  const token = getToken();
  if (!token) {
    return {
      ok: false,
      error: "not_authenticated" as const,
      message:
        "CF_API_TOKEN environment variable not set. Create a read-only API token at https://dash.cloudflare.com/profile/api-tokens",
    };
  }

  return execCli("curl", [
    "-s",
    "-H",
    `Authorization: Bearer ${token}`,
    "-H",
    "Content-Type: application/json",
    `${API_BASE}${path}`,
  ]);
}

export function registerCloudflareTools(server: McpServer): void {
  // --- cf_auth_status ---
  server.registerTool(
    "cf_auth_status",
    {
      title: "Cloudflare Auth Status",
      description:
        "Verify the Cloudflare API token is valid. Requires CF_API_TOKEN environment variable.",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await cfApi("/user/tokens/verify");

      if (!result.ok) {
        return infraError(SOURCE, "cf_auth_status", result);
      }

      const data = result.parsed as {
        success?: boolean;
        result?: { status: string };
      };

      if (!data?.success) {
        return infraError(SOURCE, "cf_auth_status", {
          ok: false,
          error: "not_authenticated",
          message: "Cloudflare API token is invalid or expired.",
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "cf_auth_status",
        tsc_controls: [],
        collected_at: today(),
        data: { authenticated: true, status: data.result?.status },
        findings: [],
      });
    }
  );

  // --- cf_zones ---
  server.registerTool(
    "cf_zones",
    {
      title: "Cloudflare Zones",
      description:
        "List Cloudflare zones (domains) and their status. Evidence for CC6.1 (encryption) and CC6.6 (network security).",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await cfApi("/zones?per_page=50");

      if (!result.ok) {
        return infraError(SOURCE, "cf_zones", result);
      }

      const data = result.parsed as {
        success?: boolean;
        result?: Array<{
          id: string;
          name: string;
          status: string;
          plan?: { name: string };
        }>;
      };
      const zones = data?.result ?? [];
      const findings: Finding[] = [];

      const active = zones.filter((z) => z.status === "active");

      findings.push({
        control_id: "CC6.6",
        status: "info",
        description: `${active.length} active zone(s) managed in Cloudflare`,
      });

      return infraResponse({
        source: SOURCE,
        tool: "cf_zones",
        tsc_controls: ["CC6.1", "CC6.6"],
        collected_at: today(),
        data: zones.map((z) => ({
          id: z.id,
          name: z.name,
          status: z.status,
          plan: z.plan?.name,
        })),
        findings,
      });
    }
  );

  // --- cf_ssl_tls ---
  server.registerTool(
    "cf_ssl_tls",
    {
      title: "Cloudflare SSL/TLS Settings",
      description:
        "Check SSL/TLS mode and minimum TLS version for a zone. Evidence for CC6.1 (encryption).",
      inputSchema: z.object({
        zone_id: z.string().describe("Cloudflare zone ID"),
      }),
    },
    async ({ zone_id }) => {
      const sslResult = await cfApi(`/zones/${zone_id}/settings/ssl`);
      const tlsResult = await cfApi(
        `/zones/${zone_id}/settings/min_tls_version`
      );

      const findings: Finding[] = [];

      if (sslResult.ok) {
        const sslData = sslResult.parsed as {
          result?: { value: string };
        };
        const sslMode = sslData?.result?.value ?? "unknown";

        if (sslMode === "full" || sslMode === "strict") {
          findings.push({
            control_id: "CC6.1",
            status: "pass",
            description: `SSL mode is "${sslMode}" — origin connections are encrypted`,
          });
        } else if (sslMode === "flexible") {
          findings.push({
            control_id: "CC6.1",
            status: "warning",
            description:
              'SSL mode is "flexible" — origin connections may be unencrypted. Upgrade to "full (strict)"',
          });
        } else if (sslMode === "off") {
          findings.push({
            control_id: "CC6.1",
            status: "fail",
            description: "SSL is disabled — all traffic is unencrypted",
          });
        }
      }

      if (tlsResult.ok) {
        const tlsData = tlsResult.parsed as {
          result?: { value: string };
        };
        const minTls = tlsData?.result?.value ?? "unknown";

        if (minTls === "1.2" || minTls === "1.3") {
          findings.push({
            control_id: "CC6.1",
            status: "pass",
            description: `Minimum TLS version is ${minTls}`,
          });
        } else {
          findings.push({
            control_id: "CC6.1",
            status: "warning",
            description: `Minimum TLS version is ${minTls} — consider upgrading to 1.2+`,
          });
        }
      }

      if (!sslResult.ok && !tlsResult.ok) {
        return infraError(SOURCE, "cf_ssl_tls", sslResult as CliError);
      }

      return infraResponse({
        source: SOURCE,
        tool: "cf_ssl_tls",
        tsc_controls: ["CC6.1"],
        collected_at: today(),
        data: {
          ssl: sslResult.ok ? (sslResult.parsed as Record<string, unknown>)?.result : null,
          min_tls: tlsResult.ok ? (tlsResult.parsed as Record<string, unknown>)?.result : null,
        },
        findings,
      });
    }
  );

  // --- cf_waf_rules ---
  server.registerTool(
    "cf_waf_rules",
    {
      title: "Cloudflare WAF Status",
      description:
        "Check WAF (Web Application Firewall) managed rules status. Evidence for CC6.6 (network security).",
      inputSchema: z.object({
        zone_id: z.string().describe("Cloudflare zone ID"),
      }),
    },
    async ({ zone_id }) => {
      const result = await cfApi(`/zones/${zone_id}/settings/waf`);

      if (!result.ok) {
        // WAF might not be available on free plans
        if (result.stderr?.includes("403") || (result as CliError).exitCode === 0) {
          return infraResponse({
            source: SOURCE,
            tool: "cf_waf_rules",
            tsc_controls: ["CC6.6"],
            collected_at: today(),
            data: { available: false },
            findings: [
              {
                control_id: "CC6.6",
                status: "info",
                description:
                  "WAF managed rules may not be available on current plan",
              },
            ],
          });
        }
        return infraError(SOURCE, "cf_waf_rules", result);
      }

      const data = result.parsed as {
        success?: boolean;
        result?: { value: string };
      };
      const wafStatus = data?.result?.value ?? "unknown";
      const findings: Finding[] = [];

      if (wafStatus === "on") {
        findings.push({
          control_id: "CC6.6",
          status: "pass",
          description: "WAF managed rules are enabled",
        });
      } else {
        findings.push({
          control_id: "CC6.6",
          status: "warning",
          description: "WAF managed rules are not enabled",
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "cf_waf_rules",
        tsc_controls: ["CC6.6"],
        collected_at: today(),
        data: { waf_status: wafStatus },
        findings,
      });
    }
  );

  // --- cf_security_settings ---
  server.registerTool(
    "cf_security_settings",
    {
      title: "Cloudflare Security Settings",
      description:
        "Check Always Use HTTPS, security level, and browser integrity check. Evidence for CC6.1 and CC6.6.",
      inputSchema: z.object({
        zone_id: z.string().describe("Cloudflare zone ID"),
      }),
    },
    async ({ zone_id }) => {
      // Fetch multiple settings in parallel-ish (sequential for simplicity)
      const httpsResult = await cfApi(
        `/zones/${zone_id}/settings/always_use_https`
      );
      const secLevelResult = await cfApi(
        `/zones/${zone_id}/settings/security_level`
      );
      const bicResult = await cfApi(
        `/zones/${zone_id}/settings/browser_check`
      );

      const findings: Finding[] = [];
      const settings: Record<string, unknown> = {};

      if (httpsResult.ok) {
        const val = (httpsResult.parsed as { result?: { value: string } })
          ?.result?.value;
        settings.always_use_https = val;
        findings.push({
          control_id: "CC6.1",
          status: val === "on" ? "pass" : "fail",
          description:
            val === "on"
              ? "Always Use HTTPS is enabled"
              : "Always Use HTTPS is not enabled — HTTP traffic is allowed",
        });
      }

      if (secLevelResult.ok) {
        const val = (secLevelResult.parsed as { result?: { value: string } })
          ?.result?.value;
        settings.security_level = val;
        findings.push({
          control_id: "CC6.6",
          status: val === "high" || val === "under_attack" ? "pass" : "info",
          description: `Security level is "${val}"`,
        });
      }

      if (bicResult.ok) {
        const val = (bicResult.parsed as { result?: { value: string } })
          ?.result?.value;
        settings.browser_integrity_check = val;
        findings.push({
          control_id: "CC6.6",
          status: val === "on" ? "pass" : "warning",
          description:
            val === "on"
              ? "Browser integrity check is enabled"
              : "Browser integrity check is not enabled",
        });
      }

      if (!httpsResult.ok && !secLevelResult.ok && !bicResult.ok) {
        return infraError(
          SOURCE,
          "cf_security_settings",
          httpsResult as CliError
        );
      }

      return infraResponse({
        source: SOURCE,
        tool: "cf_security_settings",
        tsc_controls: ["CC6.1", "CC6.6"],
        collected_at: today(),
        data: settings,
        findings,
      });
    }
  );
}
