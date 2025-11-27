import { NextResponse } from "next/server";
import { getCorsHeaders } from "./getCorsHeaders";

/**
 * Creates a NextResponse with CORS headers automatically applied
 *
 * @param data - The data to send in the response.
 * @param status - The status code of the response.
 * @returns A NextResponse with CORS headers automatically applied.
 */
export function createApiResponse(data: unknown, status: number = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: getCorsHeaders(),
  });
}
