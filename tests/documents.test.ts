import { describe, it, expect, beforeEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { listDocuments, ensureDir, today } from "../src/utils/documents.js";

describe("documents", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "compliance-test-"));
    process.env.COMPLIANCE_ROOT = tempDir;
  });

  describe("listDocuments", () => {
    it("lists markdown files in a type directory", async () => {
      const policiesDir = join(tempDir, "policies");
      await mkdir(policiesDir, { recursive: true });

      await writeFile(
        join(policiesDir, "test-policy.md"),
        `---
title: Test Policy
status: draft
---

# Test Policy`
      );

      await writeFile(
        join(policiesDir, "another-policy.md"),
        `---
title: Another Policy
status: approved
---

# Another Policy`
      );

      const docs = await listDocuments("policies");
      expect(docs).toHaveLength(2);
      expect(docs.map((d) => d.metadata.title).sort()).toEqual([
        "Another Policy",
        "Test Policy",
      ]);
    });

    it("filters by status", async () => {
      const policiesDir = join(tempDir, "policies");
      await mkdir(policiesDir, { recursive: true });

      await writeFile(
        join(policiesDir, "draft.md"),
        `---
status: draft
---
# Draft`
      );

      await writeFile(
        join(policiesDir, "approved.md"),
        `---
status: approved
---
# Approved`
      );

      const approved = await listDocuments("policies", "approved");
      expect(approved).toHaveLength(1);
      expect(approved[0].metadata.status).toBe("approved");
    });

    it("returns empty array for non-existent directory", async () => {
      const docs = await listDocuments("policies");
      expect(docs).toEqual([]);
    });

    it("finds markdown files in subdirectories", async () => {
      const subDir = join(tempDir, "evidence", "automated", "github");
      await mkdir(subDir, { recursive: true });

      await writeFile(
        join(subDir, "branch-protection.md"),
        `---
title: Branch Protection
---
# Evidence`
      );

      const docs = await listDocuments("evidence");
      expect(docs).toHaveLength(1);
      expect(docs[0].metadata.title).toBe("Branch Protection");
    });
  });

  describe("ensureDir", () => {
    it("creates directory if it does not exist", async () => {
      const newDir = join(tempDir, "new", "nested", "dir");
      await ensureDir(newDir);
      // Should not throw
      const { stat } = await import("node:fs/promises");
      const stats = await stat(newDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it("does not throw if directory already exists", async () => {
      await ensureDir(tempDir);
      // Should not throw
    });
  });

  describe("today", () => {
    it("returns date in YYYY-MM-DD format", () => {
      const result = today();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
