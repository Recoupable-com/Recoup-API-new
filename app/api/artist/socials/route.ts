import { NextRequest } from "next/server";
import { getArtistSocialsHandler } from "@/lib/artist/getArtistSocialsHandler";

/**
 * GET /api/artist/socials
 *
 * Retrieves all social media profiles associated with an artist account.
 *
 * Query parameters:
 * - artist_account_id (required): The unique identifier of the artist account
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Number of socials per page (default: 20, max: 100)
 *
 * @param request - The request object containing query parameters.
 * @returns A NextResponse with social media profiles and pagination metadata.
 */
export async function GET(request: NextRequest) {
  return getArtistSocialsHandler(request);
}
