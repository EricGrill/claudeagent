import { NextRequest, NextResponse } from "next/server";
import {
  SETTING_DEFINITIONS,
  getAllDbSettings,
  getSetting,
  setSettings,
  getAllServiceStatuses,
} from "@/lib/settings";

export async function GET() {
  try {
    // Get all settings values (from DB with env fallback)
    const values: Record<string, string> = {};
    
    for (const def of SETTING_DEFINITIONS) {
      const value = await getSetting(def.key);
      // For sensitive fields, only show if they exist (mask the actual value)
      if (def.sensitive && value) {
        values[def.key] = "••••••••";
      } else if (value) {
        values[def.key] = value;
      } else {
        values[def.key] = "";
      }
    }

    // Get all service statuses
    const statuses = await getAllServiceStatuses();

    return NextResponse.json({ values, statuses });
  } catch (error) {
    console.error("Failed to get settings:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Invalid settings format" },
        { status: 400 }
      );
    }

    // Filter out empty values and masked values (don't overwrite with mask)
    const filteredSettings: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === "string" && value && value !== "••••••••") {
        // Validate that the key is a known setting
        const def = SETTING_DEFINITIONS.find((d) => d.key === key);
        if (def) {
          filteredSettings[key] = value;
        }
      }
    }

    // Save settings
    await setSettings(filteredSettings);

    // Get updated statuses
    const statuses = await getAllServiceStatuses();

    return NextResponse.json({ success: true, statuses });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
