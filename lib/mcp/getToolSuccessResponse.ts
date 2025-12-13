import { TextContent } from "@modelcontextprotocol/sdk/types.js";

export type CallToolResult = {
  content: TextContent[];
};

/**
 * Creates a standardized success response for MCP tools.
 *
 * @param data - The data to return
 * @returns An MCP tool response with success content
 */
export function getToolSuccessResponse(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data),
      },
    ],
  };
}
