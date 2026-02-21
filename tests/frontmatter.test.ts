import { describe, it, expect } from "vitest";
import { parseDocument, serializeDocument } from "../src/utils/frontmatter.js";

describe("frontmatter", () => {
  describe("parseDocument", () => {
    it("parses YAML frontmatter and content", () => {
      const raw = `---
id: POL-001
title: Test Policy
status: draft
version: "1.0"
tsc_criteria:
  - CC1.1
  - CC2.1
---

# Test Policy

This is the content.`;

      const result = parseDocument(raw);

      expect(result.metadata.id).toBe("POL-001");
      expect(result.metadata.title).toBe("Test Policy");
      expect(result.metadata.status).toBe("draft");
      expect(result.metadata.version).toBe("1.0");
      expect(result.metadata.tsc_criteria).toEqual(["CC1.1", "CC2.1"]);
      expect(result.content).toContain("# Test Policy");
      expect(result.content).toContain("This is the content.");
    });

    it("handles documents without frontmatter", () => {
      const raw = "# Just a heading\n\nSome content.";
      const result = parseDocument(raw);

      expect(result.metadata).toEqual({});
      expect(result.content).toContain("# Just a heading");
    });

    it("handles empty frontmatter", () => {
      const raw = "---\n---\n\n# Content";
      const result = parseDocument(raw);

      expect(result.metadata).toEqual({});
      expect(result.content).toContain("# Content");
    });
  });

  describe("serializeDocument", () => {
    it("serializes metadata and content to frontmatter format", () => {
      const metadata = {
        id: "POL-002",
        title: "Access Control",
        status: "approved" as const,
      };
      const content = "# Access Control\n\nPolicy content here.";

      const result = serializeDocument(metadata, content);

      expect(result).toContain("---");
      expect(result).toContain("id: POL-002");
      expect(result).toContain("title: Access Control");
      expect(result).toContain("status: approved");
      expect(result).toContain("# Access Control");
      expect(result).toContain("Policy content here.");
    });

    it("handles arrays in metadata", () => {
      const metadata = {
        tsc_criteria: ["CC5.1", "CC6.1"],
      };
      const content = "Test content";

      const result = serializeDocument(metadata, content);

      expect(result).toContain("CC5.1");
      expect(result).toContain("CC6.1");
    });
  });

  describe("roundtrip", () => {
    it("preserves data through parse-serialize cycle", () => {
      const metadata = {
        id: "TSC-SEC",
        title: "Security Controls",
        status: "approved" as const,
        version: "1.0",
        tsc_criteria: ["CC1", "CC2", "CC3"],
      };
      const content = "# Security\n\n## CC1\n\nControl environment.";

      const serialized = serializeDocument(metadata, content);
      const parsed = parseDocument(serialized);

      expect(parsed.metadata.id).toBe(metadata.id);
      expect(parsed.metadata.title).toBe(metadata.title);
      expect(parsed.metadata.status).toBe(metadata.status);
      expect(parsed.metadata.tsc_criteria).toEqual(metadata.tsc_criteria);
      expect(parsed.content).toContain("# Security");
      expect(parsed.content).toContain("## CC1");
    });
  });
});
