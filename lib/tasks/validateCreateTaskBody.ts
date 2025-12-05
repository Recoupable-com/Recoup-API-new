import { NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { z } from "zod";

export const createTaskBodySchema = z.object({
  title: z.string().min(1, "title body parameter is required"),
  prompt: z.string().min(1, "prompt body parameter is required"),
  schedule: z.string().min(1, "schedule body parameter is required"),
  account_id: z.string().min(1, "account_id body parameter is required"),
  artist_account_id: z.string().min(1, "artist_account_id body parameter is required"),
});

export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;

/**
 * Validates create task request body.
 *
 * @param body - The request body to validate.
 * @returns A NextResponse with an error if validation fails, or the validated body if validation passes.
 */
export function validateCreateTaskBody(body: unknown): NextResponse | CreateTaskBody {
  const validationResult = createTaskBodySchema.safeParse(body);

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return NextResponse.json(
      {
        status: "error",
        missing_fields: firstError.path,
        error: firstError.message,
      },
      {
        status: 400,
        headers: getCorsHeaders(),
      },
    );
  }

  return validationResult.data;
}
