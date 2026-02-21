import { describe, it, expect, beforeEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { listDocuments } from "../src/utils/documents.js";
import { parseDocument } from "../src/utils/frontmatter.js";

describe("agent governance", () => {
  describe("agent controls file", () => {
    it("contains all 19 AGT controls", async () => {
      const controlsFile = join(
        process.cwd(),
        "compliance",
        "controls",
        "agent-controls.md"
      );
      const content = await readFile(controlsFile, "utf-8");

      // Tier 1 controls
      for (let i = 1; i <= 10; i++) {
        const id = `AGT-${String(i).padStart(2, "0")}`;
        expect(content).toContain(`### ${id}`);
      }

      // Tier 2 controls
      for (let i = 11; i <= 19; i++) {
        const id = `AGT-${String(i).padStart(2, "0")}`;
        expect(content).toContain(`### ${id}`);
      }
    });

    it("has valid frontmatter with TSC mappings", async () => {
      const controlsFile = join(
        process.cwd(),
        "compliance",
        "controls",
        "agent-controls.md"
      );
      const content = await readFile(controlsFile, "utf-8");
      const doc = parseDocument(content);

      expect(doc.metadata.id).toBe("TSC-AGT");
      expect(doc.metadata.status).toBe("approved");
      expect(doc.metadata.tsc_criteria).toContain("CC5.1");
      expect(doc.metadata.tsc_criteria).toContain("CC7.1");
    });

    it("includes context trust classification definitions", async () => {
      const controlsFile = join(
        process.cwd(),
        "compliance",
        "controls",
        "agent-controls.md"
      );
      const content = await readFile(controlsFile, "utf-8");

      expect(content).toContain("Context Trust Classification");
      expect(content).toContain("Trusted Context");
      expect(content).toContain("Untrusted Context");
      expect(content).toContain("Trust Transitivity");
    });

    it("includes blue team testing protocol", async () => {
      const controlsFile = join(
        process.cwd(),
        "compliance",
        "controls",
        "agent-controls.md"
      );
      const content = await readFile(controlsFile, "utf-8");

      expect(content).toContain("Blue Team Testing Protocol");
      expect(content).toContain("Prompt injection");
      expect(content).toContain("Data exfiltration");
      expect(content).toContain("Tool abuse");
      expect(content).toContain("Context poisoning");
      expect(content).toContain("Privilege escalation");
    });
  });

  describe("agent registry", () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), "compliance-agents-test-"));
      process.env.COMPLIANCE_ROOT = tempDir;
    });

    it("lists agents with type filter", async () => {
      const agentsDir = join(tempDir, "agents");
      await mkdir(agentsDir, { recursive: true });

      await writeFile(
        join(agentsDir, "AGENT-001-test.md"),
        `---
id: "AGENT-001"
type: "agent-registry"
status: "active"
name: "Test Agent"
purpose: "Testing"
owner: "John"
risk_tier: 2
context_classification: "trusted"
control_tier: "tier-1"
created: "2026-02-21"
last_reviewed: "2026-02-21"
next_review: "2026-05-21"
blue_team_status: "n/a"
tsc_controls:
  - "CC5.1"
---

## Context Sources
- Local files (trusted)

## Data Access
| Data | Scope | Classification | Access |
|------|-------|----------------|--------|
| Test | All | Internal | Read |

## Tool Access
| Tool | Permissions | Cred Type | Cred ID |
|------|-------------|-----------|---------|
| Local | Read | None | N/A |

## Boundary Constraints
- CANNOT modify any infrastructure
`
      );

      const docs = await listDocuments("agents");
      expect(docs).toHaveLength(1);
      expect(docs[0].metadata.type).toBe("agent-registry");
      expect(docs[0].metadata.context_classification).toBe("trusted");
    });

    it("agent template has required sections", async () => {
      const templateFile = join(
        process.cwd(),
        "compliance",
        "agents",
        "AGENT-template.md"
      );
      const content = await readFile(templateFile, "utf-8");

      expect(content).toContain("## Context Sources");
      expect(content).toContain("## Untrusted Input Path");
      expect(content).toContain("## Data Access");
      expect(content).toContain("## Tool Access");
      expect(content).toContain("## Action Permissions");
      expect(content).toContain("## Boundary Constraints");
      expect(content).toContain("## Credentials");
      expect(content).toContain("### Explicitly Excluded");
    });

    it("agent template frontmatter has required fields", async () => {
      const templateFile = join(
        process.cwd(),
        "compliance",
        "agents",
        "AGENT-template.md"
      );
      const content = await readFile(templateFile, "utf-8");
      const doc = parseDocument(content);

      expect(doc.metadata.type).toBe("agent-registry");
      expect(doc.metadata).toHaveProperty("risk_tier");
      expect(doc.metadata).toHaveProperty("context_classification");
      expect(doc.metadata).toHaveProperty("control_tier");
      expect(doc.metadata).toHaveProperty("blue_team_status");
      expect(doc.metadata).toHaveProperty("tsc_controls");
    });
  });

  describe("governance policy template", () => {
    it("covers all agent control areas", async () => {
      const policyFile = join(
        process.cwd(),
        "templates",
        "policies",
        "agent-governance-policy.md"
      );
      const content = await readFile(policyFile, "utf-8");

      expect(content).toContain("Agent Registration");
      expect(content).toContain("Context Trust Classification");
      expect(content).toContain("Risk Tiering");
      expect(content).toContain("Access Control");
      expect(content).toContain("Monitoring and Logging");
      expect(content).toContain("Periodic Review");
      expect(content).toContain("Untrusted-Context Controls");
      expect(content).toContain("Blue Team Testing");
      expect(content).toContain("Decommissioning");
    });

    it("has correct TSC mappings in frontmatter", async () => {
      const policyFile = join(
        process.cwd(),
        "templates",
        "policies",
        "agent-governance-policy.md"
      );
      const content = await readFile(policyFile, "utf-8");
      const doc = parseDocument(content);

      expect(doc.metadata.id).toBe("POL-013");
      expect(doc.metadata.tsc_criteria).toContain("CC5.1");
      expect(doc.metadata.tsc_criteria).toContain("CC7.2");
      expect(doc.metadata.tsc_criteria).toContain("C1.1");
    });
  });
});
