import { z } from "zod";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  readDocument,
  writeDocument,
  type DocumentMetadata,
} from "../utils/frontmatter.js";
import {
  listDocuments,
  getComplianceRoot,
  getTypePath,
  ensureDir,
  today,
  type DocumentType,
} from "../utils/documents.js";

const DOC_TYPES: DocumentType[] = [
  "controls",
  "policies",
  "evidence",
  "gaps",
  "assessments",
  "inventory",
  "config",
];

export function registerDocumentTools(server: McpServer): void {
  server.registerTool(
    "list_documents",
    {
      title: "List Documents",
      description:
        "List compliance documents by type (controls, policies, evidence, gaps, assessments, inventory, config). Optionally filter by status.",
      inputSchema: z.object({
        type: z
          .enum(DOC_TYPES as [DocumentType, ...DocumentType[]])
          .describe("Document type to list"),
        status: z
          .enum(["draft", "review", "approved", "expired"])
          .optional()
          .describe("Filter by document status"),
      }),
    },
    async ({ type, status }) => {
      const docs = await listDocuments(type, status);
      const summary = docs.map((d) => ({
        path: d.relativePath,
        title: d.metadata.title || d.relativePath,
        status: d.metadata.status || "unknown",
        id: d.metadata.id || "none",
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
    "read_document",
    {
      title: "Read Document",
      description:
        "Read a compliance document by its relative path within the compliance directory. Returns parsed frontmatter metadata and content.",
      inputSchema: z.object({
        path: z
          .string()
          .describe(
            "Relative path within compliance/ directory (e.g., 'controls/tsc-security.md')"
          ),
      }),
    },
    async ({ path }) => {
      const fullPath = join(getComplianceRoot(), path);
      const doc = await readDocument(fullPath);
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
    }
  );

  server.registerTool(
    "create_document",
    {
      title: "Create Document",
      description:
        "Create a new compliance document with YAML frontmatter metadata. Specify the type and filename.",
      inputSchema: z.object({
        type: z
          .enum(DOC_TYPES as [DocumentType, ...DocumentType[]])
          .describe("Document type (determines directory)"),
        filename: z
          .string()
          .describe("Filename for the document (e.g., 'access-control-policy.md')"),
        metadata: z
          .object({
            id: z.string().optional(),
            title: z.string(),
            status: z
              .enum(["draft", "review", "approved", "expired"])
              .default("draft"),
            version: z.string().default("1.0"),
            owner: z.string().optional(),
            tsc_criteria: z.array(z.string()).optional(),
          })
          .describe("Document metadata for YAML frontmatter"),
        content: z.string().describe("Markdown content for the document body"),
      }),
    },
    async ({ type, filename, metadata, content }) => {
      const dir = getTypePath(type);
      await ensureDir(dir);
      const fullPath = join(dir, filename);

      const fullMetadata: DocumentMetadata = {
        ...metadata,
        last_reviewed: today(),
      };

      await writeDocument(fullPath, fullMetadata, content);

      return {
        content: [
          {
            type: "text" as const,
            text: `Created document: ${type}/${filename}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "update_document",
    {
      title: "Update Document",
      description:
        "Update an existing compliance document's content and/or metadata.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("Relative path within compliance/ directory"),
        metadata: z
          .record(z.unknown())
          .optional()
          .describe("Metadata fields to update (merged with existing)"),
        content: z
          .string()
          .optional()
          .describe("New markdown content (replaces existing if provided)"),
      }),
    },
    async ({ path, metadata, content }) => {
      const fullPath = join(getComplianceRoot(), path);
      const existing = await readDocument(fullPath);

      const newMetadata = {
        ...existing.metadata,
        ...(metadata || {}),
        last_updated: today(),
      };
      const newContent = content ?? existing.content;

      await writeDocument(fullPath, newMetadata, newContent);

      return {
        content: [
          {
            type: "text" as const,
            text: `Updated document: ${path}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "update_document_status",
    {
      title: "Update Document Status",
      description:
        "Change a compliance document's lifecycle status (draft → review → approved → expired).",
      inputSchema: z.object({
        path: z
          .string()
          .describe("Relative path within compliance/ directory"),
        status: z
          .enum(["draft", "review", "approved", "expired"])
          .describe("New status"),
      }),
    },
    async ({ path, status }) => {
      const fullPath = join(getComplianceRoot(), path);
      const existing = await readDocument(fullPath);

      const newMetadata = {
        ...existing.metadata,
        status,
        last_updated: today(),
        ...(status === "approved" ? { last_reviewed: today() } : {}),
      };

      await writeDocument(fullPath, newMetadata, existing.content);

      return {
        content: [
          {
            type: "text" as const,
            text: `Updated status of ${path} to '${status}'`,
          },
        ],
      };
    }
  );
}
