import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  execCli,
  infraResponse,
  infraError,
  parseCsv,
  type Finding,
} from "../utils/cli.js";
import { today } from "../utils/documents.js";

const SOURCE = "google-workspace";

export function registerGamTools(server: McpServer): void {
  // --- gam_auth_status ---
  server.registerTool(
    "gam_auth_status",
    {
      title: "Google Workspace Auth Status",
      description:
        "Check if GAM (Google Apps Manager) is installed and authenticated. Run this before other Workspace tools. Install GAM from https://github.com/GAM-team/GAM",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await execCli("gam", ["version"], { parseJson: false });

      if (!result.ok) {
        return infraError(SOURCE, "gam_auth_status", result);
      }

      return infraResponse({
        source: SOURCE,
        tool: "gam_auth_status",
        tsc_controls: [],
        collected_at: today(),
        data: { authenticated: true, version: result.stdout.trim().split("\n")[0] },
        findings: [],
      });
    }
  );

  // --- gam_users ---
  server.registerTool(
    "gam_users",
    {
      title: "Google Workspace Users",
      description:
        "List all users in the Google Workspace directory. Evidence for CC5.1 (logical access).",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await execCli(
        "gam",
        ["print", "users", "fields", "primaryEmail,name.fullName,suspended,isAdmin,creationTime"],
        { parseJson: false }
      );

      if (!result.ok) {
        return infraError(SOURCE, "gam_users", result);
      }

      const users = parseCsv(result.stdout);
      const findings: Finding[] = [];

      const active = users.filter((u) => u.suspended !== "True");
      const suspended = users.filter((u) => u.suspended === "True");
      const admins = users.filter((u) => u.isAdmin === "True");

      findings.push({
        control_id: "CC5.1",
        status: "info",
        description: `${active.length} active user(s), ${suspended.length} suspended, ${admins.length} admin(s)`,
      });

      if (admins.length > 3) {
        findings.push({
          control_id: "CC5.1",
          status: "warning",
          description: `${admins.length} admin users — consider reducing to principle of least privilege`,
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "gam_users",
        tsc_controls: ["CC5.1"],
        collected_at: today(),
        data: users.map((u) => ({
          email: u.primaryEmail,
          name: u["name.fullName"] || u.name,
          suspended: u.suspended === "True",
          admin: u.isAdmin === "True",
        })),
        findings,
      });
    }
  );

  // --- gam_mfa_status ---
  server.registerTool(
    "gam_mfa_status",
    {
      title: "Google Workspace MFA Status",
      description:
        "Check 2-step verification enrollment for all users. Evidence for CC6.2 (authentication).",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await execCli(
        "gam",
        ["print", "users", "fields", "primaryEmail,isEnrolledIn2Sv,isEnforcedIn2Sv"],
        { parseJson: false }
      );

      if (!result.ok) {
        return infraError(SOURCE, "gam_mfa_status", result);
      }

      const users = parseCsv(result.stdout);
      const findings: Finding[] = [];

      const enrolled = users.filter((u) => u.isEnrolledIn2Sv === "True");
      const notEnrolled = users.filter((u) => u.isEnrolledIn2Sv !== "True");
      const enforced = users.filter((u) => u.isEnforcedIn2Sv === "True");

      if (notEnrolled.length > 0) {
        findings.push({
          control_id: "CC6.2",
          status: "fail",
          description: `${notEnrolled.length} user(s) without 2-step verification: ${notEnrolled.map((u) => u.primaryEmail).join(", ")}`,
        });
      }

      if (enrolled.length > 0) {
        findings.push({
          control_id: "CC6.2",
          status: "pass",
          description: `${enrolled.length} user(s) enrolled in 2-step verification`,
        });
      }

      if (enforced.length > 0) {
        findings.push({
          control_id: "CC6.2",
          status: "pass",
          description: `2-step verification enforced for ${enforced.length} user(s)`,
        });
      } else {
        findings.push({
          control_id: "CC6.2",
          status: "warning",
          description: "2-step verification is not enforced via admin policy",
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "gam_mfa_status",
        tsc_controls: ["CC6.2"],
        collected_at: today(),
        data: users.map((u) => ({
          email: u.primaryEmail,
          enrolled: u.isEnrolledIn2Sv === "True",
          enforced: u.isEnforcedIn2Sv === "True",
        })),
        findings,
      });
    }
  );

  // --- gam_admin_roles ---
  server.registerTool(
    "gam_admin_roles",
    {
      title: "Google Workspace Admin Roles",
      description:
        "List users with admin role assignments. Evidence for CC5.1 (logical access).",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await execCli("gam", ["print", "admins"], {
        parseJson: false,
      });

      if (!result.ok) {
        return infraError(SOURCE, "gam_admin_roles", result);
      }

      const admins = parseCsv(result.stdout);
      const findings: Finding[] = [];

      // Group by role
      const roleMap: Record<string, string[]> = {};
      for (const admin of admins) {
        const role = admin.roleAssignmentId || admin.roleName || admin.role || "unknown";
        const user = admin.assignedTo || admin.userKey || admin.primaryEmail || "unknown";
        if (!roleMap[role]) roleMap[role] = [];
        roleMap[role].push(user);
      }

      const superAdmins = admins.filter(
        (a) =>
          (a.roleName || a.role || "").toLowerCase().includes("super") ||
          a.isSuperAdmin === "True"
      );

      findings.push({
        control_id: "CC5.1",
        status: "info",
        description: `${admins.length} admin role assignment(s) across ${Object.keys(roleMap).length} role(s)`,
      });

      if (superAdmins.length > 2) {
        findings.push({
          control_id: "CC5.1",
          status: "warning",
          description: `${superAdmins.length} super admin(s) — consider limiting super admin access`,
        });
      }

      return infraResponse({
        source: SOURCE,
        tool: "gam_admin_roles",
        tsc_controls: ["CC5.1"],
        collected_at: today(),
        data: admins,
        findings,
      });
    }
  );

  // --- gam_login_audit ---
  server.registerTool(
    "gam_login_audit",
    {
      title: "Google Workspace Login Audit",
      description:
        "Pull recent login events from Google Workspace audit log. Evidence for CC7.1 (monitoring).",
      inputSchema: z.object({
        days: z
          .number()
          .default(30)
          .describe("Number of days of login history to pull (default: 30)"),
      }),
    },
    async ({ days }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startStr = startDate.toISOString().split("T")[0];

      const result = await execCli(
        "gam",
        ["report", "login", "start", startStr],
        { parseJson: false, timeoutMs: 60000 }
      );

      if (!result.ok) {
        return infraError(SOURCE, "gam_login_audit", result);
      }

      const events = parseCsv(result.stdout);
      const findings: Finding[] = [];

      if (events.length === 0) {
        findings.push({
          control_id: "CC7.1",
          status: "warning",
          description: `No login events found in the last ${days} days`,
        });
      } else {
        findings.push({
          control_id: "CC7.1",
          status: "pass",
          description: `${events.length} login event(s) captured in the last ${days} days`,
        });

        // Check for suspicious events
        const suspicious = events.filter(
          (e) =>
            (e.events || e.event || "").toLowerCase().includes("suspicious") ||
            (e.events || e.event || "").toLowerCase().includes("blocked")
        );

        if (suspicious.length > 0) {
          findings.push({
            control_id: "CC7.1",
            status: "warning",
            description: `${suspicious.length} suspicious/blocked login event(s) detected`,
          });
        }
      }

      return infraResponse({
        source: SOURCE,
        tool: "gam_login_audit",
        tsc_controls: ["CC7.1"],
        collected_at: today(),
        data: {
          period_days: days,
          total_events: events.length,
          sample: events.slice(0, 50),
        },
        findings,
      });
    }
  );
}
