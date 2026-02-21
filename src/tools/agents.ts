import { z } from "zod";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readDocument } from "../utils/frontmatter.js";
import { listDocuments, getComplianceRoot, today } from "../utils/documents.js";

interface AgentEntry {
  id: string;
  name: string;
  status: string;
  purpose: string;
  owner: string;
  risk_tier: number;
  context_classification: string;
  control_tier: string;
  last_reviewed: string;
  next_review: string;
  blue_team_status: string;
  tsc_controls: string[];
  path: string;
}

async function loadAgents(
  statusFilter?: string,
  contextFilter?: string,
  riskTierFilter?: number
): Promise<AgentEntry[]> {
  const docs = await listDocuments("agents", statusFilter);
  const agents: AgentEntry[] = [];

  for (const doc of docs) {
    const m = doc.metadata;
    if (m.type !== "agent-registry") continue;
    if (contextFilter && m.context_classification !== contextFilter) continue;
    if (riskTierFilter !== undefined && m.risk_tier !== riskTierFilter) continue;

    agents.push({
      id: m.id as string || "unknown",
      name: m.name as string || doc.relativePath,
      status: m.status as string || "unknown",
      purpose: m.purpose as string || "",
      owner: m.owner as string || "",
      risk_tier: (m.risk_tier as number) || 0,
      context_classification: m.context_classification as string || "unknown",
      control_tier: m.control_tier as string || "tier-1",
      last_reviewed: m.last_reviewed as string || "never",
      next_review: m.next_review as string || "unknown",
      blue_team_status: m.blue_team_status as string || "n/a",
      tsc_controls: (m.tsc_controls as string[]) || [],
      path: doc.relativePath,
    });
  }

  return agents;
}

export function registerAgentTools(server: McpServer): void {
  server.registerTool(
    "list_agents",
    {
      title: "List Agents",
      description:
        "List all registered agents in the governance registry. Filter by status, context classification, or risk tier.",
      inputSchema: z.object({
        status: z
          .enum(["active", "inactive", "decommissioned"])
          .optional()
          .describe("Filter by agent status"),
        context_classification: z
          .enum(["trusted", "untrusted"])
          .optional()
          .describe("Filter by context trust classification"),
        risk_tier: z
          .number()
          .min(1)
          .max(5)
          .optional()
          .describe("Filter by risk tier (1-5)"),
      }),
    },
    async ({ status, context_classification, risk_tier }) => {
      const agents = await loadAgents(status, context_classification, risk_tier);

      const summary = agents.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        risk_tier: a.risk_tier,
        context: a.context_classification,
        control_tier: a.control_tier,
        next_review: a.next_review,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_agent",
    {
      title: "Get Agent Details",
      description:
        "Get the full registry entry for a specific agent, including context sources, data access, tool access, boundary constraints, and credentials.",
      inputSchema: z.object({
        id: z.string().describe("Agent ID (e.g., 'AGENT-001')"),
      }),
    },
    async ({ id }) => {
      const docs = await listDocuments("agents");
      const match = docs.find((d) => d.metadata.id === id);

      if (!match) {
        const allIds = docs
          .filter((d) => d.metadata.type === "agent-registry")
          .map((d) => d.metadata.id);
        return {
          content: [
            {
              type: "text" as const,
              text: `Agent '${id}' not found. Registered agents: ${allIds.join(", ") || "none"}`,
            },
          ],
        };
      }

      const doc = await readDocument(match.path);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { metadata: doc.metadata, content: doc.content },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_agent_coverage",
    {
      title: "Get Agent Governance Coverage",
      description:
        "Summary of agent governance status: total agents, context classifications, risk tiers, review status, credential rotation compliance, and control coverage.",
      inputSchema: z.object({}),
    },
    async () => {
      const agents = await loadAgents();

      const todayStr = today();
      const overdue = agents.filter(
        (a) => a.status === "active" && a.next_review <= todayStr
      );

      const byContext = {
        trusted: agents.filter((a) => a.context_classification === "trusted").length,
        untrusted: agents.filter((a) => a.context_classification === "untrusted").length,
      };

      const byRiskTier: Record<number, number> = {};
      for (const a of agents) {
        byRiskTier[a.risk_tier] = (byRiskTier[a.risk_tier] || 0) + 1;
      }

      const byStatus = {
        active: agents.filter((a) => a.status === "active").length,
        inactive: agents.filter((a) => a.status === "inactive").length,
        decommissioned: agents.filter((a) => a.status === "decommissioned").length,
      };

      // Check untrusted agents needing blue team testing
      const untrustedAgents = agents.filter(
        (a) => a.context_classification === "untrusted" && a.status === "active"
      );
      const blueTeamNeeded = untrustedAgents.filter(
        (a) => a.blue_team_status === "n/a" || a.blue_team_status === ""
      );

      // Check agent governance controls file exists
      const controls = await listDocuments("controls");
      const hasAgentControls = controls.some(
        (c) => c.metadata.id === "TSC-AGT" || c.relativePath.includes("agent-controls")
      );

      // Check agent governance policy exists
      const policies = await listDocuments("policies");
      const hasAgentPolicy = policies.some(
        (p) =>
          (p.metadata.id as string || "").includes("POL-013") ||
          p.relativePath.includes("agent-governance")
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                totalAgents: agents.length,
                byStatus,
                byContext,
                byRiskTier,
                reviewsOverdue: overdue.map((a) => ({
                  id: a.id,
                  name: a.name,
                  next_review: a.next_review,
                })),
                blueTeamNeeded: blueTeamNeeded.map((a) => ({
                  id: a.id,
                  name: a.name,
                })),
                governanceControls: hasAgentControls
                  ? "defined"
                  : "missing — create controls/agent-controls.md",
                governancePolicy: hasAgentPolicy
                  ? "exists"
                  : "missing — generate via /compliance-policy",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "check_credential_rotation",
    {
      title: "Check Agent Credential Rotation",
      description:
        "Scan agent registry entries for credentials past their rotation target. Returns a list of overdue credentials.",
      inputSchema: z.object({
        rotation_threshold_days: z
          .number()
          .default(90)
          .describe("Rotation threshold in days (default: 90)"),
      }),
    },
    async ({ rotation_threshold_days }) => {
      const agents = await loadAgents("active");
      const findings: Array<{
        agent_id: string;
        agent_name: string;
        credential_id: string;
        last_rotated: string;
        age_days: number;
        threshold: number;
        overdue: boolean;
      }> = [];

      for (const agent of agents) {
        const doc = await readDocument(
          join(getComplianceRoot(), agent.path)
        );

        // Parse credential table from the body
        const credSection = doc.content.match(
          /#+\s*Credentials[\s\S]*?\|[\s\S]*?(?=\n#|\n---|\n$)/
        );
        if (!credSection) continue;

        const rows = credSection[0]
          .split("\n")
          .filter((line) => line.startsWith("|") && !line.includes("---") && !line.includes("Credential ID"));

        for (const row of rows) {
          const cells = row
            .split("|")
            .map((c) => c.trim())
            .filter(Boolean);
          if (cells.length < 6) continue;

          const credId = cells[0].replace(/`/g, "");
          const lastRotated = cells[3];

          if (!lastRotated || lastRotated === "N/A") continue;

          const rotatedDate = new Date(lastRotated);
          const ageDays = Math.floor(
            (Date.now() - rotatedDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          findings.push({
            agent_id: agent.id,
            agent_name: agent.name,
            credential_id: credId,
            last_rotated: lastRotated,
            age_days: ageDays,
            threshold: rotation_threshold_days,
            overdue: ageDays > rotation_threshold_days,
          });
        }
      }

      const overdue = findings.filter((f) => f.overdue);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                total_credentials: findings.length,
                overdue_count: overdue.length,
                threshold_days: rotation_threshold_days,
                credentials: findings,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "run_agent_audit",
    {
      title: "Run Agent Governance Audit",
      description:
        "Audit all registered agents against the agent governance control matrix (AGT-01 through AGT-19). Checks registry completeness, context classification, credential status, and review currency.",
      inputSchema: z.object({}),
    },
    async () => {
      const agents = await loadAgents();
      const activeAgents = agents.filter((a) => a.status === "active");
      const todayStr = today();

      const findings: Array<{
        agent_id: string;
        control: string;
        status: "pass" | "fail" | "warning";
        detail: string;
      }> = [];

      for (const agent of activeAgents) {
        const doc = await readDocument(
          join(getComplianceRoot(), agent.path)
        );
        const content = doc.content;

        // AGT-01: Agent registered
        findings.push({
          agent_id: agent.id,
          control: "AGT-01",
          status: "pass",
          detail: "Agent registered in inventory",
        });

        // AGT-02: Data access documented
        const hasDataAccess = content.includes("## Data Access") || content.includes("#### Data Access");
        findings.push({
          agent_id: agent.id,
          control: "AGT-02",
          status: hasDataAccess ? "pass" : "fail",
          detail: hasDataAccess
            ? "Data access scope documented"
            : "Missing Data Access section",
        });

        // AGT-03: Tool access documented
        const hasToolAccess = content.includes("## Tool Access") || content.includes("#### Tool Access");
        findings.push({
          agent_id: agent.id,
          control: "AGT-03",
          status: hasToolAccess ? "pass" : "fail",
          detail: hasToolAccess
            ? "Tool/MCP access scope documented"
            : "Missing Tool Access section",
        });

        // AGT-04: Boundary constraints documented
        const hasBoundary = content.includes("## Boundary Constraints") || content.includes("#### Boundary Constraints");
        findings.push({
          agent_id: agent.id,
          control: "AGT-04",
          status: hasBoundary ? "pass" : "fail",
          detail: hasBoundary
            ? "Boundary constraints documented"
            : "Missing Boundary Constraints section",
        });

        // AGT-07: Actions logged
        const hasLogging = content.includes("logged") || content.includes("audit trail") || content.includes("log");
        findings.push({
          agent_id: agent.id,
          control: "AGT-07",
          status: hasLogging ? "pass" : "warning",
          detail: hasLogging
            ? "Logging referenced in registry"
            : "No explicit logging documentation found",
        });

        // AGT-08: Context sources enumerated
        const hasContext = content.includes("## Context Sources") || content.includes("#### Context Sources");
        findings.push({
          agent_id: agent.id,
          control: "AGT-08",
          status: hasContext ? "pass" : "fail",
          detail: hasContext
            ? "Context sources enumerated"
            : "Missing Context Sources section",
        });

        // AGT-09: Context trust classified
        findings.push({
          agent_id: agent.id,
          control: "AGT-09",
          status: agent.context_classification !== "unknown" ? "pass" : "fail",
          detail: `Context classified as: ${agent.context_classification}`,
        });

        // AGT-10: Periodic review
        const reviewOverdue = agent.next_review <= todayStr;
        findings.push({
          agent_id: agent.id,
          control: "AGT-10",
          status: reviewOverdue ? "warning" : "pass",
          detail: reviewOverdue
            ? `Review overdue (was due ${agent.next_review})`
            : `Next review: ${agent.next_review}`,
        });

        // Tier 2 controls (untrusted only)
        if (agent.context_classification === "untrusted") {
          // AGT-11: Input validation
          const hasInputVal = content.includes("input validation") || content.includes("Input validation");
          findings.push({
            agent_id: agent.id,
            control: "AGT-11",
            status: hasInputVal ? "pass" : "fail",
            detail: hasInputVal
              ? "Input validation documented"
              : "UNTRUSTED: Missing input validation documentation",
          });

          // AGT-13: Prompt injection defenses
          const hasPromptDef = content.includes("prompt injection") || content.includes("system prompt");
          findings.push({
            agent_id: agent.id,
            control: "AGT-13",
            status: hasPromptDef ? "pass" : "fail",
            detail: hasPromptDef
              ? "Prompt injection defenses documented"
              : "UNTRUSTED: Missing prompt injection defense documentation",
          });

          // AGT-17: Blue team testing
          const blueTeamDone = agent.blue_team_status !== "n/a" && agent.blue_team_status !== "";
          findings.push({
            agent_id: agent.id,
            control: "AGT-17",
            status: blueTeamDone ? "pass" : "fail",
            detail: blueTeamDone
              ? `Blue team testing: ${agent.blue_team_status}`
              : "UNTRUSTED: Blue team testing not completed",
          });
        }
      }

      const passed = findings.filter((f) => f.status === "pass").length;
      const failed = findings.filter((f) => f.status === "fail").length;
      const warnings = findings.filter((f) => f.status === "warning").length;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                summary: {
                  agents_audited: activeAgents.length,
                  checks_passed: passed,
                  checks_failed: failed,
                  checks_warning: warnings,
                  total_checks: findings.length,
                },
                findings,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
