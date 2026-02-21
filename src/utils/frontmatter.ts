import matter from "gray-matter";
import { readFile, writeFile } from "node:fs/promises";

export interface DocumentMetadata {
  id?: string;
  title?: string;
  status?: "draft" | "review" | "approved" | "expired";
  version?: string;
  owner?: string;
  tsc_criteria?: string[];
  last_reviewed?: string | null;
  next_review?: string | null;
  last_updated?: string | null;
  [key: string]: unknown;
}

export interface ParsedDocument {
  metadata: DocumentMetadata;
  content: string;
  raw: string;
}

export function parseDocument(raw: string): ParsedDocument {
  const { data, content } = matter(raw);
  return {
    metadata: data as DocumentMetadata,
    content: content.trim(),
    raw,
  };
}

export function serializeDocument(
  metadata: DocumentMetadata,
  content: string
): string {
  return matter.stringify(`\n${content}\n`, metadata);
}

export async function readDocument(filePath: string): Promise<ParsedDocument> {
  const raw = await readFile(filePath, "utf-8");
  return parseDocument(raw);
}

export async function writeDocument(
  filePath: string,
  metadata: DocumentMetadata,
  content: string
): Promise<void> {
  const serialized = serializeDocument(metadata, content);
  await writeFile(filePath, serialized, "utf-8");
}
