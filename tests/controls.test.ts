import { describe, it, expect, beforeEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { readFile } from "node:fs/promises";

describe("control parsing", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "compliance-controls-test-"));
    process.env.COMPLIANCE_ROOT = tempDir;
  });

  it("TSC security controls file is parseable", async () => {
    const controlsFile = join(
      process.cwd(),
      "compliance",
      "controls",
      "tsc-security.md"
    );
    const content = await readFile(controlsFile, "utf-8");

    // Verify key control IDs are present
    expect(content).toContain("### CC1.1");
    expect(content).toContain("### CC5.1");
    expect(content).toContain("### CC6.1");
    expect(content).toContain("### CC7.1");
    expect(content).toContain("### CC7.2");
    expect(content).toContain("### CC8.1");
    expect(content).toContain("### CC9.1");

    // Verify structure
    expect(content).toContain("**What the auditor looks for**");
    expect(content).toContain("**Evidence types**");
    expect(content).toContain("**Solo-company note**");
    expect(content).toContain("**Compensating control**");
  });

  it("TSC confidentiality controls file is parseable", async () => {
    const controlsFile = join(
      process.cwd(),
      "compliance",
      "controls",
      "tsc-confidentiality.md"
    );
    const content = await readFile(controlsFile, "utf-8");

    // Verify key control IDs
    expect(content).toContain("### C1.1.1");
    expect(content).toContain("### C1.1.2");
    expect(content).toContain("### C1.2.1");
    expect(content).toContain("### C1.2.2");

    // Verify cross-references
    expect(content).toContain("Cross-References to Security Controls");
  });

  it("control files have valid frontmatter", async () => {
    const { parseDocument } = await import("../src/utils/frontmatter.js");
    const securityFile = join(
      process.cwd(),
      "compliance",
      "controls",
      "tsc-security.md"
    );
    const confFile = join(
      process.cwd(),
      "compliance",
      "controls",
      "tsc-confidentiality.md"
    );

    const security = parseDocument(await readFile(securityFile, "utf-8"));
    expect(security.metadata.id).toBe("TSC-SEC");
    expect(security.metadata.status).toBe("approved");
    expect(security.metadata.tsc_criteria).toContain("CC1");

    const conf = parseDocument(await readFile(confFile, "utf-8"));
    expect(conf.metadata.id).toBe("TSC-CONF");
    expect(conf.metadata.status).toBe("approved");
    expect(conf.metadata.tsc_criteria).toContain("C1");
  });
});
