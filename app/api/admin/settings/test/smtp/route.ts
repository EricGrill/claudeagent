import { NextResponse } from "next/server";
import { testConnection } from "@/lib/email";

export async function POST() {
  try {
    const result = await testConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error("SMTP test failed:", error);
    return NextResponse.json(
      { success: false, error: "Test failed unexpectedly" },
      { status: 500 }
    );
  }
}
