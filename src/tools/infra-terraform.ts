import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  execCli,
  infraResponse,
  infraError,
  type Finding,
} from "../utils/cli.js";
import { today } from "../utils/documents.js";

const SOURCE = "terraform";

export function registerTerraformTools(server: McpServer): void {
  // --- tf_version ---
  server.registerTool(
    "tf_version",
    {
      title: "Terraform Version",
      description:
        "Check if Terraform is installed and show version info. Run this before other Terraform tools.",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await execCli("terraform", ["version", "-json"]);

      if (!result.ok) {
        return infraError(SOURCE, "tf_version", result);
      }

      const data = result.parsed as {
        terraform_version?: string;
        platform?: string;
        provider_selections?: Record<string, string>;
      };

      return infraResponse({
        source: SOURCE,
        tool: "tf_version",
        tsc_controls: [],
        collected_at: today(),
        data: {
          version: data?.terraform_version,
          platform: data?.platform,
        },
        findings: [],
      });
    }
  );

  // --- tf_state_resources ---
  server.registerTool(
    "tf_state_resources",
    {
      title: "Terraform State Resources",
      description:
        "List all resources managed by Terraform. Evidence for CC8.1 (change management) — proves infrastructure is managed as code.",
      inputSchema: z.object({
        working_dir: z
          .string()
          .optional()
          .describe("Path to Terraform working directory (default: current directory)"),
      }),
    },
    async ({ working_dir }) => {
      const result = await execCli(
        "terraform",
        ["state", "list"],
        { parseJson: false, cwd: working_dir }
      );

      if (!result.ok) {
        // No state file might mean not initialized
        if (result.stderr?.includes("No state file") || result.stderr?.includes("does not exist")) {
          return infraResponse({
            source: SOURCE,
            tool: "tf_state_resources",
            tsc_controls: ["CC8.1"],
            collected_at: today(),
            data: { resources: [], initialized: false },
            findings: [
              {
                control_id: "CC8.1",
                status: "warning",
                description: "No Terraform state found — run 'terraform init' first or check working directory",
              },
            ],
          });
        }
        return infraError(SOURCE, "tf_state_resources", result);
      }

      const resources = result.stdout
        .trim()
        .split("\n")
        .filter((l) => l.trim());
      const findings: Finding[] = [];

      // Categorize resources by type
      const typeCount: Record<string, number> = {};
      for (const res of resources) {
        const type = res.split(".")[0];
        typeCount[type] = (typeCount[type] || 0) + 1;
      }

      if (resources.length > 0) {
        findings.push({
          control_id: "CC8.1",
          status: "pass",
          description: `${resources.length} resource(s) managed by Terraform (Infrastructure as Code)`,
        });

        const topTypes = Object.entries(typeCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([type, count]) => `${type}: ${count}`)
          .join(", ");

        findings.push({
          control_id: "CC8.1",
          status: "info",
          description: `Resource types: ${topTypes}`,
        });
      } else {
        findings.push({
          control_id: "CC8.1",
          status: "warning",
          description: "Terraform state is empty — no resources under IaC management",
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "tf_state_resources",
        tsc_controls: ["CC8.1"],
        collected_at: today(),
        data: {
          total: resources.length,
          resources,
          by_type: typeCount,
        },
        findings,
      });
    }
  );

  // --- tf_workspace ---
  server.registerTool(
    "tf_workspace",
    {
      title: "Terraform Workspace",
      description:
        "Show current Terraform workspace. Evidence for CC8.1 (change management) — environment separation.",
      inputSchema: z.object({
        working_dir: z
          .string()
          .optional()
          .describe("Path to Terraform working directory"),
      }),
    },
    async ({ working_dir }) => {
      const result = await execCli(
        "terraform",
        ["workspace", "show"],
        { parseJson: false, cwd: working_dir }
      );

      if (!result.ok) {
        return infraError(SOURCE, "tf_workspace", result);
      }

      const workspace = result.stdout.trim();
      const findings: Finding[] = [];

      findings.push({
        control_id: "CC8.1",
        status: "info",
        description: `Current workspace: "${workspace}"`,
      });

      // Also list all workspaces
      const listResult = await execCli(
        "terraform",
        ["workspace", "list"],
        { parseJson: false, cwd: working_dir }
      );

      let workspaces: string[] = [workspace];
      if (listResult.ok) {
        workspaces = listResult.stdout
          .trim()
          .split("\n")
          .map((l) => l.replace(/^\*?\s*/, "").trim())
          .filter((l) => l);

        if (workspaces.length > 1) {
          findings.push({
            control_id: "CC8.1",
            status: "pass",
            description: `${workspaces.length} workspace(s) configured — environment separation in place`,
          });
        }
      }

      return infraResponse({
        source: SOURCE,
        tool: "tf_workspace",
        tsc_controls: ["CC8.1"],
        collected_at: today(),
        data: {
          current: workspace,
          all_workspaces: workspaces,
        },
        findings,
      });
    }
  );

  // --- tf_providers ---
  server.registerTool(
    "tf_providers",
    {
      title: "Terraform Providers",
      description:
        "List Terraform providers in use. Evidence for CC8.1 (change management) — shows which infrastructure platforms are managed as code.",
      inputSchema: z.object({
        working_dir: z
          .string()
          .optional()
          .describe("Path to Terraform working directory"),
      }),
    },
    async ({ working_dir }) => {
      const result = await execCli(
        "terraform",
        ["providers"],
        { parseJson: false, cwd: working_dir }
      );

      if (!result.ok) {
        return infraError(SOURCE, "tf_providers", result);
      }

      // Parse the tree-style output to extract provider names
      const providerLines = result.stdout
        .split("\n")
        .filter((l) => l.includes("provider["))
        .map((l) => {
          const match = l.match(/provider\[([^\]]+)\]/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      const unique = [...new Set(providerLines)];
      const findings: Finding[] = [];

      if (unique.length > 0) {
        findings.push({
          control_id: "CC8.1",
          status: "pass",
          description: `${unique.length} provider(s) managed via Terraform: ${unique.join(", ")}`,
        });
      } else {
        findings.push({
          control_id: "CC8.1",
          status: "info",
          description: "No providers detected — Terraform may not be initialized",
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "tf_providers",
        tsc_controls: ["CC8.1"],
        collected_at: today(),
        data: { providers: unique },
        findings,
      });
    }
  );
}
