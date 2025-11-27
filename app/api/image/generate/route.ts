import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    report: {
      weather: "sunny",
      temperature: 70,
    },
  });
}
