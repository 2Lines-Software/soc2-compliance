import { readdir, stat, mkdir } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { readDocument, type ParsedDocument } from "./frontmatter.js";

export type DocumentType =
  | "controls"
  | "policies"
  | "evidence"
  | "gaps"
  | "assessments"
  | "inventory"
  | "config"
  | "agents";

export interface DocumentEntry {
  path: string;
  relativePath: string;
  type: DocumentType;
  metadata: ParsedDocument["metadata"];
}

/**
 * Resolve the compliance root directory.
 * Uses COMPLIANCE_ROOT env var or defaults to ./compliance relative to cwd.
 */
export function getComplianceRoot(): string {
  return process.env.COMPLIANCE_ROOT || join(process.cwd(), "compliance");
}

/**
 * Get the directory path for a given document type.
 */
export function getTypePath(type: DocumentType): string {
  return join(getComplianceRoot(), type);
}

/**
 * Recursively find all .md files in a directory.
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findMarkdownFiles(fullPath);
      results.push(...nested);
    } else if (entry.isFile() && extname(entry.name) === ".md") {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * List all compliance documents of a given type.
 */
export async function listDocuments(
  type: DocumentType,
  statusFilter?: string
): Promise<DocumentEntry[]> {
  const dir = getTypePath(type);
  const files = await findMarkdownFiles(dir);
  const root = getComplianceRoot();

  const entries: DocumentEntry[] = [];

  for (const filePath of files) {
    try {
      const doc = await readDocument(filePath);
      if (statusFilter && doc.metadata.status !== statusFilter) continue;

      entries.push({
        path: filePath,
        relativePath: relative(root, filePath),
        type,
        metadata: doc.metadata,
      });
    } catch {
      // Skip files that can't be parsed
    }
  }

  return entries;
}

/**
 * Ensure a directory exists, creating it if needed.
 */
export async function ensureDir(dir: string): Promise<void> {
  try {
    await stat(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
export function today(): string {
  return new Date().toISOString().split("T")[0];
}
