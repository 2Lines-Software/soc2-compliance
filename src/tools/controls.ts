import { z } from "zod";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readDocument } from "../utils/frontmatter.js";
import {
  listDocuments,
  getComplianceRoot,
  today,
} from "../utils/documents.js";

interface ControlEntry {
  id: string;
  name: string;
  criteria: string;
  auditorLooksFor: string;
  evidenceTypes: string[];
  soloCompanyNote?: string;
  compensatingControl?: string;
  mcpTargets?: string;
}

/**
 * Parse control entries from a TSC control mapping markdown file.
 * Extracts structured data from the heading/bullet format.
 */
function parseControls(content: string): ControlEntry[] {
  const controls: ControlEntry[] = [];
  const lines = content.split("\n");

  let currentCriteria = "";
  let currentControl: Partial<ControlEntry> | null = null;

  for (const line of lines) {
    // Match criteria headings like "## CC1 — Control Environment"
    const criteriaMatch = line.match(/^## (CC\d+|C\d+)\s*[—–-]\s*(.+)/);
    if (criteriaMatch) {
      currentCriteria = criteriaMatch[1];
      continue;
    }

    // Match sub-control headings like "### CC1.1 — Organization and Management"
    const controlMatch = line.match(
      /^### (CC?\d+\.\d+(?:\.\d+)?)\s*[—–-]\s*(.+)/
    );
    if (controlMatch) {
      if (currentControl?.id) {
        controls.push(currentControl as ControlEntry);
      }
      currentControl = {
        id: controlMatch[1],
        name: controlMatch[2],
        criteria: currentCriteria,
        evidenceTypes: [],
      };
      continue;
    }

    if (!currentControl) continue;

    // Parse bullet fields
    const auditorMatch = line.match(
      /\*\*What the auditor looks for\*\*:\s*(.+)/
    );
    if (auditorMatch) {
      currentControl.auditorLooksFor = auditorMatch[1];
    }

    const evidenceMatch = line.match(/\*\*Evidence types\*\*:\s*(.+)/);
    if (evidenceMatch) {
      currentControl.evidenceTypes = evidenceMatch[1]
        .split(",")
        .map((s) => s.trim());
    }

    const soloMatch = line.match(/\*\*Solo-company note\*\*:\s*(.+)/);
    if (soloMatch) {
      currentControl.soloCompanyNote = soloMatch[1];
    }

    const compMatch = line.match(/\*\*Compensating control\*\*:\s*(.+)/);
    if (compMatch) {
      currentControl.compensatingControl = compMatch[1];
    }

    const mcpMatch = line.match(/\*\*MCP discovery targets\*\*:\s*(.+)/);
    if (mcpMatch) {
      currentControl.mcpTargets = mcpMatch[1];
    }
  }

  // Don't forget the last control
  if (currentControl?.id) {
    controls.push(currentControl as ControlEntry);
  }

  return controls;
}

/**
 * Load all controls from all control mapping files.
 */
async function loadAllControls(): Promise<ControlEntry[]> {
  const docs = await listDocuments("controls");
  const allControls: ControlEntry[] = [];

  for (const doc of docs) {
    const parsed = await readDocument(doc.path);
    const controls = parseControls(parsed.content);
    allControls.push(...controls);
  }

  return allControls;
}

export function registerControlTools(server: McpServer): void {
  server.registerTool(
    "list_controls",
    {
      title: "List Controls",
      description:
        "List all SOC 2 controls from the TSC mappings. Optionally filter by criteria group (e.g., CC1, CC5, C1).",
      inputSchema: z.object({
        criteria: z
          .string()
          .optional()
          .describe(
            "Filter by criteria group (e.g., 'CC1', 'CC5', 'C1'). Omit for all."
          ),
      }),
    },
    async ({ criteria }) => {
      const controls = await loadAllControls();
      const filtered = criteria
        ? controls.filter(
            (c) =>
              c.criteria === criteria ||
              c.id.startsWith(criteria)
          )
        : controls;

      const summary = filtered.map((c) => ({
        id: c.id,
        name: c.name,
        criteria: c.criteria,
        hasCompensatingControl: !!c.compensatingControl,
        hasMcpTargets: !!c.mcpTargets,
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
    "get_control",
    {
      title: "Get Control Details",
      description:
        "Get detailed information about a specific SOC 2 control, including what the auditor looks for, evidence types, and solo-company notes.",
      inputSchema: z.object({
        id: z
          .string()
          .describe("Control ID (e.g., 'CC5.1', 'C1.1.1')"),
      }),
    },
    async ({ id }) => {
      const controls = await loadAllControls();
      const control = controls.find((c) => c.id === id);

      if (!control) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Control '${id}' not found. Available controls: ${controls.map((c) => c.id).join(", ")}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(control, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_control_coverage",
    {
      title: "Get Control Coverage",
      description:
        "Get a summary of control coverage: total controls, how many have evidence mapped in the manifest, and coverage percentage.",
      inputSchema: z.object({}),
    },
    async () => {
      const controls = await loadAllControls();

      // Read the evidence manifest to check coverage
      const manifestPath = join(
        getComplianceRoot(),
        "evidence",
        "manifest.md"
      );
      let manifestContent = "";
      try {
        const manifest = await readDocument(manifestPath);
        manifestContent = manifest.content;
      } catch {
        // Manifest may not exist yet
      }

      // Count controls referenced in the manifest
      const coveredControls = new Set<string>();
      for (const control of controls) {
        if (manifestContent.includes(control.id)) {
          coveredControls.add(control.id);
        }
      }

      const total = controls.length;
      const covered = coveredControls.size;
      const uncovered = total - covered;
      const percentage =
        total > 0 ? Math.round((covered / total) * 100) : 0;

      // Group by criteria
      const byCriteria: Record<string, { total: number; covered: number }> = {};
      for (const control of controls) {
        if (!byCriteria[control.criteria]) {
          byCriteria[control.criteria] = { total: 0, covered: 0 };
        }
        byCriteria[control.criteria].total++;
        if (coveredControls.has(control.id)) {
          byCriteria[control.criteria].covered++;
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                total,
                covered,
                uncovered,
                coveragePercent: percentage,
                byCriteria,
                uncoveredControls: controls
                  .filter((c) => !coveredControls.has(c.id))
                  .map((c) => ({ id: c.id, name: c.name })),
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
    "map_evidence_to_control",
    {
      title: "Map Evidence to Control",
      description:
        "Add an entry to the evidence manifest linking an evidence artifact to a SOC 2 control.",
      inputSchema: z.object({
        control_id: z.string().describe("Control ID (e.g., 'CC5.1')"),
        evidence_file: z
          .string()
          .describe("Path to evidence file relative to evidence/ directory"),
        collection_method: z
          .string()
          .describe(
            "How the evidence was collected (e.g., 'MCP: cloud', 'Manual', 'Policy Agent')"
          ),
        status: z
          .enum(["collected", "pending", "expired"])
          .default("collected")
          .describe("Evidence status"),
      }),
    },
    async ({ control_id, evidence_file, collection_method, status }) => {
      const manifestPath = join(
        getComplianceRoot(),
        "evidence",
        "manifest.md"
      );
      const manifest = await readDocument(manifestPath);

      const statusEmoji =
        status === "collected" ? "✅" : status === "pending" ? "⏳" : "❌";
      const newRow = `| ${control_id} | ${evidence_file} | ${collection_method} | ${today()} | ${statusEmoji} |`;

      // Insert before the collection summary section
      let content = manifest.content;
      const summaryIndex = content.indexOf("## Collection Summary");
      if (summaryIndex !== -1) {
        // Insert the new row before the summary
        const tableEnd = content.lastIndexOf("\n", summaryIndex);
        content =
          content.slice(0, tableEnd) +
          "\n" +
          newRow +
          content.slice(tableEnd);
      } else {
        // Append to the evidence index table
        content += "\n" + newRow;
      }

      const { writeDocument } = await import("../utils/frontmatter.js");
      await writeDocument(
        manifestPath,
        { ...manifest.metadata, last_updated: today() },
        content
      );

      return {
        content: [
          {
            type: "text" as const,
            text: `Mapped evidence '${evidence_file}' to control ${control_id}`,
          },
        ],
      };
    }
  );
}
