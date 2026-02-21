import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGitHubTools } from "./infra-github.js";
import { registerAwsTools } from "./infra-aws.js";
import { registerGCloudTools } from "./infra-gcloud.js";
import { registerGamTools } from "./infra-gam.js";
import { registerCloudflareTools } from "./infra-cloudflare.js";
import { registerTerraformTools } from "./infra-terraform.js";

export function registerInfraTools(server: McpServer): void {
  registerGitHubTools(server);
  registerAwsTools(server);
  registerGCloudTools(server);
  registerGamTools(server);
  registerCloudflareTools(server);
  registerTerraformTools(server);
}
