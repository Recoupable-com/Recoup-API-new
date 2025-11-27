import getConnectedAccount from "./getConnectedAccount";
import { getComposioApiKey } from "../getComposioApiKey";

export interface ConnectedAccountRefreshResponse {
  id: string;
  redirect_url: string | null;
  status: "INITIALIZING" | "INITIATED" | "ACTIVE" | "FAILED" | "EXPIRED" | "INACTIVE";
}

const COMPOSIO_API_BASE_URL = "https://backend.composio.dev";

/**
 * Refresh a connected account.
 *
 * @param accountId - The ID of the connected account to refresh.
 * @param redirectUrl - The URL to redirect to after the refresh.
 * @returns The refreshed connected account.
 */
export default async function refreshConnectedAccount(
  accountId: string,
  redirectUrl?: string,
): Promise<ConnectedAccountRefreshResponse | null> {
  const apiKey = getComposioApiKey();
  const accounts = await getConnectedAccount(accountId);

  if (!accounts.items || accounts.items.length === 0) {
    throw new Error("Connected account not found");
  }

  const connectedAccountId = accounts.items[0].id;

  if (!connectedAccountId) {
    throw new Error("Connected account ID not found");
  }

  const url = new URL(
    `${COMPOSIO_API_BASE_URL}/api/v3/connected_accounts/${connectedAccountId}/refresh`,
  );

  const body: { redirect_url?: string } = {};
  if (redirectUrl) {
    body.redirect_url = redirectUrl;
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh connected account: ${response.status} ${errorText}`);
  }

  return await response.json();
}
