import { NextRequest } from "next/server";
import refreshConnectedAccount from "@/lib/composio/googleSheets/refreshConnectedAccount";
import { createApiResponse } from "@/lib/networking/createApiResponse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, redirectUrl } = body;

    if (!accountId) {
      return createApiResponse({ error: "accountId is required" }, 400);
    }

    const response = await refreshConnectedAccount(accountId, redirectUrl);

    return createApiResponse(
      { message: "Connected account refreshed successfully", ...response },
      200
    );
  } catch (error) {
    console.error("Error refreshing connected account:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    const statusCode = errorMessage.includes("not found") ? 404 : 500;

    return createApiResponse({ error: errorMessage }, statusCode);
  }
}
