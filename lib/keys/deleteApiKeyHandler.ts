import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { validateDeleteApiKeyQuery } from "@/lib/keys/validateDeleteApiKeyQuery";
import { deleteApiKey } from "@/lib/supabase/account_api_keys/deleteApiKey";

/**
 * Handler for deleting an API key.
 *
 * Query parameters:
 * - keyId (required): The ID of the API key to delete
 *
 * @param request - The request object containing query parameters.
 * @returns A NextResponse with the delete operation status.
 */
export async function deleteApiKeyHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const validatedQuery = validateDeleteApiKeyQuery(searchParams);
    if (validatedQuery instanceof NextResponse) {
      return validatedQuery;
    }

    const { error } = await deleteApiKey(validatedQuery.keyId);

    if (error) {
      console.error("Error deleting API key:", error);
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to delete API key",
        },
        {
          status: 500,
          headers: getCorsHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        status: "success",
        message: "API key deleted successfully",
      },
      {
        status: 200,
        headers: getCorsHeaders(),
      },
    );
  } catch (error) {
    console.error("[ERROR] Error deleting API key:", error);
    const message = error instanceof Error ? error.message : "Failed to delete API key";
    return NextResponse.json(
      {
        status: "error",
        message,
      },
      {
        status: 500,
        headers: getCorsHeaders(),
      },
    );
  }
}
