import { CreateConnectedAccountOptions } from "@composio/core";
import { getComposioClient } from "../client";

const googleSheetsAuthConfigId = process.env?.COMPOSIO_GOOGLE_SHEETS_AUTH_CONFIG_ID as string;
if (!googleSheetsAuthConfigId) {
  throw new Error("COMPOSIO_GOOGLE_SHEETS_AUTH_CONFIG_ID not found in environment variables");
}

/**
 * Authenticate a user with the Google Sheets toolkit.
 *
 * @param userId - The user ID to authenticate.
 * @param options - The options for the authentication.
 * @returns The connection request.
 */
async function authenticateGoogleSheetsToolkit(
  userId: string,
  options?: CreateConnectedAccountOptions,
) {
  const composio = getComposioClient();
  const connectionRequest = await composio.connectedAccounts.initiate(
    userId,
    googleSheetsAuthConfigId,
    options,
  );
  return connectionRequest;
}

export default authenticateGoogleSheetsToolkit;
