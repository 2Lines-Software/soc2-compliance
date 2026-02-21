import { z } from "zod";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readDocument, writeDocument } from "../utils/frontmatter.js";
import {
  listDocuments,
  getComplianceRoot,
  ensureDir,
  today,
} from "../utils/documents.js";

export function registerAssessmentTools(server: McpServer): void {
  server.registerTool(
    "run_gap_analysis",
    {
      title: "Run Gap Analysis",
      description:
        "Produce a structured gap analysis report by aggregating control coverage, evidence status, and policy completeness. Writes the report to gaps/.",
      inputSchema: z.object({
        report_content: z
          .string()
          .describe(
            "Full markdown content for the gap analysis report. Should follow the standard gap report structure: Executive Summary, Critical Gaps, Medium Gaps, Controls Met, Remediation Roadmap."
          ),
      }),
    },
    async ({ report_content }) => {
      const gapsDir = join(getComplianceRoot(), "gaps");
      await ensureDir(gapsDir);

      const filename = `gap-analysis-${today()}.md`;
      const filePath = join(gapsDir, filename);

      await writeDocument(
        filePath,
        {
          id: `GAP-${today()}`,
          title: `SOC 2 Gap Assessment Report — ${today()}`,
          status: "draft",
          version: "1.0",
          assessment_date: today(),
        },
        report_content
      );

      return {
        content: [
          {
            type: "text" as const,
            text: `Gap analysis report created: gaps/${filename}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "run_readiness_check",
    {
      title: "Run Readiness Check",
      description:
        "Validate audit readiness by checking that all required policies exist and are approved, all controls have evidence, and no critical gaps remain unresolved. Writes assessment to assessments/.",
      inputSchema: z.object({
        assessment_content: z
          .string()
          .describe(
            "Full markdown content for the readiness assessment. Should include: overall pass/fail, checklist of requirements, and actionable items."
          ),
      }),
    },
    async ({ assessment_content }) => {
      const assessDir = join(getComplianceRoot(), "assessments");
      await ensureDir(assessDir);

      const filename = `readiness-check-${today()}.md`;
      const filePath = join(assessDir, filename);

      await writeDocument(
        filePath,
        {
          id: `READY-${today()}`,
          title: `Audit Readiness Assessment — ${today()}`,
          status: "draft",
          version: "1.0",
          assessment_date: today(),
        },
        assessment_content
      );

      return {
        content: [
          {
            type: "text" as const,
            text: `Readiness assessment created: assessments/${filename}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_compliance_dashboard",
    {
      title: "Get Compliance Dashboard",
      description:
        "Get a summary dashboard of the current compliance state: controls, policies, evidence coverage, and gap status.",
      inputSchema: z.object({}),
    },
    async () => {
      // Gather data from all sources
      const [policies, gaps, assessments, evidence] = await Promise.all([
        listDocuments("policies"),
        listDocuments("gaps"),
        listDocuments("assessments"),
        listDocuments("evidence"),
      ]);

      // Read manifest for coverage data
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
        // Manifest may not exist
      }

      // Count evidence statuses from manifest
      const evidenceCollected = (manifestContent.match(/✅/g) || []).length;
      const evidencePending = (manifestContent.match(/⏳/g) || []).length;
      const evidenceExpired = (manifestContent.match(/❌/g) || []).length;

      // Policy statuses
      const policyStatuses = {
        draft: policies.filter((p) => p.metadata.status === "draft").length,
        review: policies.filter((p) => p.metadata.status === "review").length,
        approved: policies.filter((p) => p.metadata.status === "approved")
          .length,
        expired: policies.filter((p) => p.metadata.status === "expired").length,
      };

      // Latest gap report
      const latestGap = gaps.sort((a, b) =>
        (b.metadata.assessment_date as string || "").localeCompare(
          a.metadata.assessment_date as string || ""
        )
      )[0];

      // Latest readiness check
      const latestReadiness = assessments.sort((a, b) =>
        (b.metadata.assessment_date as string || "").localeCompare(
          a.metadata.assessment_date as string || ""
        )
      )[0];

      const dashboard = {
        summary: {
          totalPolicies: policies.length,
          policyStatuses,
          evidenceCollected,
          evidencePending,
          evidenceExpired,
          totalEvidenceArtifacts: evidence.length,
          gapReports: gaps.length,
          readinessAssessments: assessments.length,
        },
        latestGapReport: latestGap
          ? {
              path: latestGap.relativePath,
              date: latestGap.metadata.assessment_date,
              status: latestGap.metadata.status,
            }
          : null,
        latestReadinessCheck: latestReadiness
          ? {
              path: latestReadiness.relativePath,
              date: latestReadiness.metadata.assessment_date,
              status: latestReadiness.metadata.status,
            }
          : null,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(dashboard, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_remediation_roadmap",
    {
      title: "Get Remediation Roadmap",
      description:
        "Extract the remediation roadmap from the latest gap analysis report, showing prioritized actions to close compliance gaps.",
      inputSchema: z.object({}),
    },
    async () => {
      const gaps = await listDocuments("gaps");

      if (gaps.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No gap analysis reports found. Run /compliance-gap first to generate a gap analysis.",
            },
          ],
        };
      }

      // Get the latest gap report
      const latestGap = gaps.sort((a, b) =>
        (b.metadata.assessment_date as string || "").localeCompare(
          a.metadata.assessment_date as string || ""
        )
      )[0];

      const doc = await readDocument(latestGap.path);

      // Extract remediation roadmap section
      const roadmapMatch = doc.content.match(
        /## Remediation Roadmap[\s\S]*?(?=\n## |$)/
      );

      if (!roadmapMatch) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Gap report found (${latestGap.relativePath}) but no Remediation Roadmap section found. The gap analysis may need to be regenerated.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Source: ${latestGap.relativePath}\nDate: ${latestGap.metadata.assessment_date}\n\n${roadmapMatch[0]}`,
          },
        ],
      };
    }
  );
}
