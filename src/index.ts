import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerDocumentTools } from "./tools/documents.js";
import { registerControlTools } from "./tools/controls.js";
import { registerEvidenceTools } from "./tools/evidence.js";
import { registerAssessmentTools } from "./tools/assessment.js";
import { registerAgentTools } from "./tools/agents.js";

const server = new McpServer({
  name: "soc2-compliance",
  version: "0.1.0",
});

// Register all tool groups
registerDocumentTools(server);
registerControlTools(server);
registerEvidenceTools(server);
registerAssessmentTools(server);
registerAgentTools(server);

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
