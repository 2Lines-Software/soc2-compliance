import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGitHubTools } from "./infra-github.js";
import { registerAwsTools } from "./infra-aws.js";
import { registerGCloudTools } from "./infra-gcloud.js";

export function registerInfraTools(server: McpServer): void {
  registerGitHubTools(server);
  registerAwsTools(server);
  registerGCloudTools(server);
}
