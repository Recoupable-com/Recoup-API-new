import { CallToolResult } from "./getToolResultSuccess";

/**
 * Creates a standardized error response for MCP tools.
 *
 * @param message - The error message to return
 * @returns An MCP tool response with error content
 */
export function getToolResultError(message: string): CallToolResult {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          success: false,
          message,
        }),
      },
    ],
  };
}
