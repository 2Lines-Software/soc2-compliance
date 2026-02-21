import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  execCli,
  infraResponse,
  infraError,
  type Finding,
} from "../utils/cli.js";
import { today } from "../utils/documents.js";

const SOURCE = "nuclei";

/** SOC 2-relevant nuclei template tags. */
const SOC2_TAGS = [
  "ssl",
  "tls",
  "security-headers",
  "misconfiguration",
  "exposure",
  "cve",
  "network",
  "token",
  "default-login",
];

/** Subset of nuclei JSONL result fields we parse. */
interface NucleiResult {
  "template-id": string;
  type: string;
  host: string;
  "matched-at"?: string;
  timestamp: string;
  "matcher-status": boolean;
  info: {
    name?: string;
    severity?: string;
    tags?: string[];
    description?: string;
    classification?: {
      cve_id?: string[];
      cwe_id?: string[];
      cvss_score?: number;
    };
    reference?: string[];
    remediation?: string;
  };
}

/** Map nuclei template tags to TSC controls. */
function tagsToControls(tags: string[]): string[] {
  const controls = new Set<string>();
  for (const tag of tags) {
    if (tag === "ssl" || tag === "tls") controls.add("CC6.1");
    if (tag === "security-headers") controls.add("CC6.1");
    if (
      ["misconfiguration", "exposure", "network", "default-login", "token"].includes(tag)
    )
      controls.add("CC6.6");
    if (tag === "cve") controls.add("CC7.1");
  }
  return [...controls];
}

/** Map nuclei severity to finding status. */
function severityToStatus(
  severity: string
): "pass" | "fail" | "warning" | "info" {
  switch (severity) {
    case "critical":
    case "high":
      return "fail";
    case "medium":
      return "warning";
    default:
      return "info";
  }
}

export function registerNucleiTools(server: McpServer): void {
  // --- nuclei_auth_status ---
  server.registerTool(
    "nuclei_auth_status",
    {
      title: "Nuclei Auth Status",
      description:
        "Check if the Nuclei vulnerability scanner is installed. Run this before nuclei_scan.",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await execCli("nuclei", ["-version"], {
        parseJson: false,
      });

      if (!result.ok) {
        return infraError(SOURCE, "nuclei_auth_status", result);
      }

      const versionOutput = result.stderr || result.stdout;
      const versionMatch = versionOutput.match(/v?(\d+\.\d+\.\d+)/);

      return infraResponse({
        source: SOURCE,
        tool: "nuclei_auth_status",
        tsc_controls: [],
        collected_at: today(),
        data: {
          installed: true,
          version: versionMatch?.[1] ?? "unknown",
          output: versionOutput.trim(),
        },
        findings: [],
      });
    }
  );

  // --- nuclei_scan ---
  server.registerTool(
    "nuclei_scan",
    {
      title: "Nuclei Security Scan",
      description:
        "Run a Nuclei vulnerability scan against target URLs. Produces SOC 2 pentest evidence mapped to CC3.2 (risk assessment), CC4.1 (deficiency management), CC6.1 (encryption), CC6.6 (boundaries), CC7.1 (monitoring). Rate-limited and scoped to SOC 2-relevant templates.",
      inputSchema: z.object({
        urls: z
          .array(z.string().url())
          .min(1)
          .max(25)
          .describe("Target URLs to scan (1-25)"),
        tags: z
          .array(z.string())
          .optional()
          .describe(
            "Nuclei template tags (default: ssl,tls,security-headers,misconfiguration,exposure,cve,network,token,default-login)"
          ),
        severity: z
          .array(z.enum(["critical", "high", "medium", "low", "info"]))
          .optional()
          .describe(
            "Severity levels to include (default: critical,high,medium,low)"
          ),
        rate_limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Requests per second (default: 25)"),
      }),
    },
    async ({ urls, tags, severity, rate_limit }) => {
      const scanTags = tags ?? SOC2_TAGS;
      const scanSeverity = severity ?? ["critical", "high", "medium", "low"];
      const rl = rate_limit ?? 25;

      const args: string[] = [];
      for (const url of urls) {
        args.push("-u", url);
      }
      args.push(
        "-tags",
        scanTags.join(","),
        "-severity",
        scanSeverity.join(","),
        "-jsonl",
        "-or",
        "-rl",
        String(rl),
        "-c",
        "8",
        "-bs",
        "8",
        "-silent",
        "-no-color"
      );

      const result = await execCli("nuclei", args, {
        timeoutMs: 300_000,
        parseJson: false,
      });

      if (!result.ok) {
        return infraError(SOURCE, "nuclei_scan", result);
      }

      // Parse JSONL output (one JSON object per line)
      const lines = result.stdout
        .trim()
        .split("\n")
        .filter((l) => l.trim());
      const results: NucleiResult[] = [];
      for (const line of lines) {
        try {
          results.push(JSON.parse(line) as NucleiResult);
        } catch {
          // Skip non-JSON lines (nuclei status output)
        }
      }

      // Build findings mapped to TSC controls
      const findings: Finding[] = [];
      const allControls = new Set<string>();
      const severityCounts: Record<string, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      };

      for (const r of results) {
        const sev = r.info?.severity ?? "info";
        severityCounts[sev] = (severityCounts[sev] ?? 0) + 1;

        const resultTags = r.info?.tags ?? [];
        const controls = tagsToControls(resultTags);

        if (sev === "critical" || sev === "high" || sev === "medium") {
          controls.push("CC4.1");
        }
        controls.push("CC3.2");

        for (const c of controls) allControls.add(c);

        findings.push({
          control_id: controls[0] || "CC3.2",
          status: severityToStatus(sev),
          description: `[${sev.toUpperCase()}] ${r.info?.name ?? r["template-id"]} at ${r["matched-at"] ?? r.host}`,
        });
      }

      // Aggregate findings
      const criticalHigh = severityCounts.critical + severityCounts.high;

      if (results.length === 0) {
        findings.push({
          control_id: "CC6.6",
          status: "pass",
          description: `No vulnerabilities found across ${urls.length} target(s) using ${scanTags.length} tag categories`,
        });
        findings.push({
          control_id: "CC6.1",
          status: "pass",
          description:
            "No SSL/TLS or encryption-in-transit issues detected",
        });
      }

      if (criticalHigh > 0) {
        findings.push({
          control_id: "CC4.1",
          status: "fail",
          description: `${criticalHigh} critical/high severity finding(s) require remediation`,
        });
      }

      findings.push({
        control_id: "CC3.2",
        status: "pass",
        description: `Vulnerability scan completed: ${urls.length} target(s), ${results.length} finding(s)`,
      });

      allControls.add("CC3.2");
      allControls.add("CC4.1");
      allControls.add("CC6.1");
      allControls.add("CC6.6");
      allControls.add("CC7.1");

      return infraResponse({
        source: SOURCE,
        tool: "nuclei_scan",
        tsc_controls: [...allControls],
        collected_at: today(),
        data: {
          summary: {
            targets_scanned: urls.length,
            total_findings: results.length,
            severity_counts: severityCounts,
            tags_used: scanTags,
            rate_limit: rl,
          },
          results: results.map((r) => ({
            template_id: r["template-id"],
            name: r.info?.name,
            severity: r.info?.severity,
            host: r.host,
            matched_at: r["matched-at"],
            tags: r.info?.tags,
            description: r.info?.description,
            classification: r.info?.classification,
            reference: r.info?.reference,
            remediation: r.info?.remediation,
            timestamp: r.timestamp,
          })),
        },
        findings,
      });
    }
  );
}
