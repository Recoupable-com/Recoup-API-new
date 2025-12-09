import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { z } from "zod";

export const deleteApiKeyQuerySchema = z.object({
  keyId: z.string().min(1, "keyId parameter is required"),
});

export type DeleteApiKeyQuery = z.infer<typeof deleteApiKeyQuerySchema>;

/**
 * Validates delete API key query parameters.
 *
 * @param searchParams - The URL search parameters to validate.
 * @returns A NextResponse with an error if validation fails, or the validated query parameters if validation passes.
 */
export function validateDeleteApiKeyQuery(
  searchParams: URLSearchParams,
): NextResponse | DeleteApiKeyQuery {
  const params = Object.fromEntries(searchParams.entries());

  const validationResult = deleteApiKeyQuerySchema.safeParse(params);

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return NextResponse.json(
      {
        status: "error",
        message: firstError.message,
      },
      {
        status: 400,
        headers: getCorsHeaders(),
      },
    );
  }

  return validationResult.data;
}
