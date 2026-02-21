import { z } from "zod";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readDocument, writeDocument } from "../utils/frontmatter.js";
import {
  listDocuments,
  getComplianceRoot,
  ensureDir,
  today,
} from "../utils/documents.js";

export function registerEvidenceTools(server: McpServer): void {
  server.registerTool(
    "store_evidence",
    {
      title: "Store Evidence",
      description:
        "Store an evidence artifact in the evidence directory. Supports both markdown documents (with frontmatter) and raw data (JSON, YAML).",
      inputSchema: z.object({
        category: z
          .enum(["automated", "manual", "policies", "reviews"])
          .describe("Evidence category"),
        subcategory: z
          .string()
          .optional()
          .describe(
            "Subcategory folder (e.g., 'cloud-iam', 'github'). Used within automated evidence."
          ),
        filename: z
          .string()
          .describe(
            "Filename for the evidence (e.g., '2026-02-21-mfa-status.json')"
          ),
        content: z.string().describe("Content of the evidence artifact"),
        content_type: z
          .enum(["markdown", "json", "yaml", "text"])
          .default("markdown")
          .describe("Content type of the evidence"),
        control_ids: z
          .array(z.string())
          .optional()
          .describe(
            "SOC 2 control IDs this evidence supports (e.g., ['CC5.1', 'CC6.1'])"
          ),
      }),
    },
    async ({
      category,
      subcategory,
      filename,
      content,
      content_type,
      control_ids,
    }) => {
      const evidenceRoot = join(getComplianceRoot(), "evidence");
      const dir = subcategory
        ? join(evidenceRoot, category, subcategory)
        : join(evidenceRoot, category);
      await ensureDir(dir);

      const filePath = join(dir, filename);

      if (content_type === "markdown") {
        await writeDocument(
          filePath,
          {
            title: filename.replace(/\.md$/, ""),
            status: "draft",
            collected_date: today(),
            tsc_criteria: control_ids,
          },
          content
        );
      } else {
        await writeFile(filePath, content, "utf-8");
      }

      // Build relative path for manifest reference
      const relPath = subcategory
        ? `${category}/${subcategory}/${filename}`
        : `${category}/${filename}`;

      return {
        content: [
          {
            type: "text" as const,
            text: `Stored evidence: evidence/${relPath}${control_ids ? `\nLinked to controls: ${control_ids.join(", ")}` : ""}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "list_evidence",
    {
      title: "List Evidence",
      description:
        "List all evidence artifacts, optionally filtered by category or control ID.",
      inputSchema: z.object({
        category: z
          .enum(["automated", "manual", "policies", "reviews"])
          .optional()
          .describe("Filter by evidence category"),
        control_id: z
          .string()
          .optional()
          .describe("Filter by SOC 2 control ID"),
      }),
    },
    async ({ category, control_id }) => {
      // List all evidence documents
      const docs = await listDocuments("evidence");

      let filtered = docs;
      if (category) {
        filtered = filtered.filter((d) =>
          d.relativePath.startsWith(`evidence/${category}/`)
        );
      }
      if (control_id) {
        filtered = filtered.filter((d) => {
          const criteria = d.metadata.tsc_criteria;
          return Array.isArray(criteria) && criteria.includes(control_id);
        });
      }

      const summary = filtered.map((d) => ({
        path: d.relativePath,
        title: d.metadata.title || d.relativePath,
        status: d.metadata.status,
        controls: d.metadata.tsc_criteria || [],
        collected: d.metadata.collected_date,
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
    "get_evidence_manifest",
    {
      title: "Get Evidence Manifest",
      description:
        "Read the evidence manifest showing all evidence mapped to controls with their collection status.",
      inputSchema: z.object({}),
    },
    async () => {
      const manifestPath = join(
        getComplianceRoot(),
        "evidence",
        "manifest.md"
      );

      try {
        const doc = await readDocument(manifestPath);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  metadata: doc.metadata,
                  content: doc.content,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch {
        return {
          content: [
            {
              type: "text" as const,
              text: "Evidence manifest not found. Run /compliance-init to create it.",
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "update_manifest",
    {
      title: "Update Evidence Manifest",
      description:
        "Replace the full content of the evidence manifest. Use this after running a comprehensive evidence collection pass.",
      inputSchema: z.object({
        content: z
          .string()
          .describe("Full markdown content for the evidence manifest"),
      }),
    },
    async ({ content }) => {
      const manifestPath = join(
        getComplianceRoot(),
        "evidence",
        "manifest.md"
      );
      let existing;
      try {
        existing = await readDocument(manifestPath);
      } catch {
        existing = { metadata: {} };
      }

      await writeDocument(
        manifestPath,
        {
          ...existing.metadata,
          id: "EV-MANIFEST",
          title: "Evidence Manifest",
          last_updated: today(),
        },
        content
      );

      return {
        content: [
          {
            type: "text" as const,
            text: "Evidence manifest updated",
          },
        ],
      };
    }
  );
}
