import { NextResponse } from "next/server";
import { testConnection } from "@/lib/storage";

export async function POST() {
  try {
    const result = await testConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Storage test failed:", error);
    return NextResponse.json(
      { success: false, error: "Test failed unexpectedly" },
      { status: 500 }
    );
  }
}
