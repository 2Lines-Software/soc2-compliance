import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  execCli,
  infraResponse,
  infraError,
  type Finding,
  type CliOutcome,
} from "../utils/cli.js";
import { today } from "../utils/documents.js";

const SOURCE = "github";

export function registerGitHubTools(server: McpServer): void {
  // --- gh_auth_status ---
  server.registerTool(
    "gh_auth_status",
    {
      title: "GitHub Auth Status",
      description:
        "Check if the GitHub CLI (gh) is installed and authenticated. Run this before other GitHub tools.",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await execCli("gh", ["auth", "status"], {
        parseJson: false,
      });

      if (!result.ok) {
        return infraError(SOURCE, "gh_auth_status", result);
      }

      return infraResponse({
        source: SOURCE,
        tool: "gh_auth_status",
        tsc_controls: [],
        collected_at: today(),
        data: { authenticated: true, output: result.stderr || result.stdout },
        findings: [],
      });
    }
  );

  // --- gh_branch_protection ---
  server.registerTool(
    "gh_branch_protection",
    {
      title: "GitHub Branch Protection",
      description:
        "Check branch protection rules for a repository. Evidence for CC5.2 (system operations) and CC8.1 (change management).",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner (user or org)"),
        repo: z.string().describe("Repository name"),
        branch: z
          .string()
          .default("main")
          .describe("Branch to check (default: main)"),
      }),
    },
    async ({ owner, repo, branch }) => {
      const result = await execCli("gh", [
        "api",
        `repos/${owner}/${repo}/branches/${branch}/protection`,
      ]);

      if (!result.ok) {
        // 404 means no protection configured — that's a finding, not an error
        if (result.exitCode === 1 && result.stderr?.includes("404")) {
          return infraResponse({
            source: SOURCE,
            tool: "gh_branch_protection",
            tsc_controls: ["CC5.2", "CC8.1"],
            collected_at: today(),
            data: { protected: false },
            findings: [
              {
                control_id: "CC8.1",
                status: "fail",
                description: `No branch protection configured on ${branch}`,
              },
              {
                control_id: "CC5.2",
                status: "fail",
                description: `No branch protection configured on ${branch}`,
              },
            ],
          });
        }
        return infraError(SOURCE, "gh_branch_protection", result);
      }

      const data = result.parsed as Record<string, unknown>;
      const findings: Finding[] = [];

      // Check required reviews
      const reviews = data.required_pull_request_reviews as
        | Record<string, unknown>
        | undefined;
      if (reviews) {
        const count = (reviews.required_approving_review_count as number) ?? 0;
        findings.push({
          control_id: "CC8.1",
          status: count > 0 ? "pass" : "warning",
          description:
            count > 0
              ? `Requires ${count} approving review(s)`
              : "Pull request reviews enabled but 0 approvals required",
        });
      } else {
        findings.push({
          control_id: "CC8.1",
          status: "fail",
          description: "No pull request review requirement configured",
        });
      }

      // Check status checks
      const statusChecks = data.required_status_checks as
        | Record<string, unknown>
        | undefined;
      if (statusChecks) {
        findings.push({
          control_id: "CC8.1",
          status: "pass",
          description: `Status checks required${statusChecks.strict ? " (strict — branch must be up to date)" : ""}`,
        });
      } else {
        findings.push({
          control_id: "CC8.1",
          status: "warning",
          description: "No required status checks configured",
        });
      }

      // Check admin enforcement
      const enforceAdmins = data.enforce_admins as
        | Record<string, unknown>
        | undefined;
      if (enforceAdmins?.enabled) {
        findings.push({
          control_id: "CC5.2",
          status: "pass",
          description: "Branch protection enforced for administrators",
        });
      } else {
        findings.push({
          control_id: "CC5.2",
          status: "warning",
          description: "Administrators can bypass branch protection",
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "gh_branch_protection",
        tsc_controls: ["CC5.2", "CC8.1"],
        collected_at: today(),
        data,
        findings,
      });
    }
  );

  // --- gh_repo_security ---
  server.registerTool(
    "gh_repo_security",
    {
      title: "GitHub Repo Security Features",
      description:
        "Check secret scanning, Dependabot, and other security features. Evidence for CC7.1 (monitoring).",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner"),
        repo: z.string().describe("Repository name"),
      }),
    },
    async ({ owner, repo }) => {
      const result = await execCli("gh", [
        "api",
        `repos/${owner}/${repo}`,
      ]);

      if (!result.ok) {
        return infraError(SOURCE, "gh_repo_security", result);
      }

      const data = result.parsed as Record<string, unknown>;
      const security = data.security_and_analysis as
        | Record<string, Record<string, string>>
        | undefined;
      const findings: Finding[] = [];

      if (!security) {
        findings.push({
          control_id: "CC7.1",
          status: "warning",
          description:
            "Security features data not available (may require admin access or GitHub Advanced Security)",
        });
      } else {
        // Secret scanning
        const secretScanning = security.secret_scanning?.status;
        findings.push({
          control_id: "CC7.1",
          status: secretScanning === "enabled" ? "pass" : "fail",
          description:
            secretScanning === "enabled"
              ? "Secret scanning is enabled"
              : "Secret scanning is not enabled",
        });

        // Secret scanning push protection
        const pushProtection =
          security.secret_scanning_push_protection?.status;
        if (pushProtection) {
          findings.push({
            control_id: "CC7.1",
            status: pushProtection === "enabled" ? "pass" : "warning",
            description:
              pushProtection === "enabled"
                ? "Secret scanning push protection is enabled"
                : "Secret scanning push protection is not enabled",
          });
        }

        // Dependabot alerts
        const dependabot = security.dependabot_security_updates?.status;
        if (dependabot) {
          findings.push({
            control_id: "CC7.1",
            status: dependabot === "enabled" ? "pass" : "warning",
            description:
              dependabot === "enabled"
                ? "Dependabot security updates are enabled"
                : "Dependabot security updates are not enabled",
          });
        }
      }

      return infraResponse({
        source: SOURCE,
        tool: "gh_repo_security",
        tsc_controls: ["CC7.1"],
        collected_at: today(),
        data: { security_and_analysis: security || null },
        findings,
      });
    }
  );

  // --- gh_collaborators ---
  server.registerTool(
    "gh_collaborators",
    {
      title: "GitHub Collaborators",
      description:
        "List repository collaborators and their permission levels. Evidence for CC5.1 (logical access).",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner"),
        repo: z.string().describe("Repository name"),
      }),
    },
    async ({ owner, repo }) => {
      const result = await execCli("gh", [
        "api",
        `repos/${owner}/${repo}/collaborators`,
        "--paginate",
      ]);

      if (!result.ok) {
        return infraError(SOURCE, "gh_collaborators", result);
      }

      const collaborators = result.parsed as Array<{
        login: string;
        role_name?: string;
        permissions?: Record<string, boolean>;
      }>;
      const findings: Finding[] = [];

      const admins = collaborators.filter(
        (c) =>
          c.role_name === "admin" || c.permissions?.admin === true
      );

      findings.push({
        control_id: "CC5.1",
        status: "info",
        description: `${collaborators.length} collaborator(s), ${admins.length} with admin access`,
      });

      if (admins.length > 3) {
        findings.push({
          control_id: "CC5.1",
          status: "warning",
          description: `${admins.length} admin users — consider reducing to principle of least privilege`,
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "gh_collaborators",
        tsc_controls: ["CC5.1"],
        collected_at: today(),
        data: collaborators.map((c) => ({
          login: c.login,
          role: c.role_name || "unknown",
          admin: c.permissions?.admin ?? false,
        })),
        findings,
      });
    }
  );

  // --- gh_workflows ---
  server.registerTool(
    "gh_workflows",
    {
      title: "GitHub Workflows",
      description:
        "List CI/CD workflows and their status. Evidence for CC8.1 (change management).",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner"),
        repo: z.string().describe("Repository name"),
      }),
    },
    async ({ owner, repo }) => {
      const result = await execCli("gh", [
        "workflow",
        "list",
        "--repo",
        `${owner}/${repo}`,
        "--json",
        "id,name,path,state",
      ]);

      if (!result.ok) {
        return infraError(SOURCE, "gh_workflows", result);
      }

      const workflows = result.parsed as Array<{
        id: number;
        name: string;
        path: string;
        state: string;
      }>;
      const findings: Finding[] = [];

      const active = workflows.filter((w) => w.state === "active");
      const disabled = workflows.filter((w) => w.state !== "active");

      if (active.length > 0) {
        findings.push({
          control_id: "CC8.1",
          status: "pass",
          description: `${active.length} active CI/CD workflow(s) configured`,
        });
      } else {
        findings.push({
          control_id: "CC8.1",
          status: "warning",
          description: "No active CI/CD workflows found",
        });
      }

      if (disabled.length > 0) {
        findings.push({
          control_id: "CC8.1",
          status: "info",
          description: `${disabled.length} disabled/inactive workflow(s)`,
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "gh_workflows",
        tsc_controls: ["CC8.1"],
        collected_at: today(),
        data: workflows,
        findings,
      });
    }
  );
}
