import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { selectCatalogSongsWithArtists } from "@/lib/supabase/catalog_songs/selectCatalogSongsWithArtists";

/**
 * Handler for retrieving catalog songs with pagination.
 *
 * Parameters:
 * - catalog_id (required): The unique identifier of the catalog to query songs for
 * - artistName (optional): Filter songs by artist name
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Number of songs per page (default: 20, max: 100)
 *
 * @param request - The request object containing query parameters.
 * @returns A NextResponse with songs and pagination metadata.
 */
export async function getCatalogSongsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const catalog_id = searchParams.get("catalog_id");
    const artistName = searchParams.get("artistName");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    // Validate required catalog_id parameter
    if (!catalog_id || typeof catalog_id !== "string") {
      return NextResponse.json(
        {
          status: "error",
          error: "catalog_id parameter is required",
        },
        {
          status: 400,
          headers: getCorsHeaders(),
        },
      );
    }

    // Parse and validate pagination parameters
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const artistNameParam = artistName && typeof artistName === "string" ? artistName : undefined;

    if (isNaN(pageNum) || pageNum < 1) {
      return NextResponse.json(
        {
          status: "error",
          error: "page must be a positive integer",
        },
        {
          status: 400,
          headers: getCorsHeaders(),
        },
      );
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return NextResponse.json(
        {
          status: "error",
          error: "limit must be a positive integer between 1 and 100",
        },
        {
          status: 400,
          headers: getCorsHeaders(),
        },
      );
    }

    // Fetch catalog songs with pagination
    const result = await selectCatalogSongsWithArtists({
      catalogId: catalog_id,
      artistName: artistNameParam,
      page: pageNum,
      limit: limitNum,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(result.total_count / limitNum);

    return NextResponse.json(
      {
        status: "success",
        songs: result.songs,
        pagination: {
          total_count: result.total_count,
          page: pageNum,
          limit: limitNum,
          total_pages: totalPages,
        },
      },
      {
        status: 200,
        headers: getCorsHeaders(),
      },
    );
  } catch (error) {
    console.error("Error fetching catalog songs:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status: 500,
        headers: getCorsHeaders(),
      },
    );
  }
}
