import {
  NextRequest,
  NextResponse,
} from "next/server";

import { connectDB } from "@/lib/mongodb";
import WebsiteSettings from "@/models/WebsiteSettings";

export const runtime = "nodejs";

// ============================
// GET WEBSITE SETTINGS
// ============================

export async function GET() {
  try {
    await connectDB();

    let settings =
      await WebsiteSettings.findOne().sort({
        createdAt: -1,
      });

    if (!settings) {
      settings = await WebsiteSettings.create({
        storeName: "DianaKart",
        logoUrl: "/logo.png",

        contactNumber: "",
        email: "",
        address: "",

        instagramUrl: "",
        facebookUrl: "",
        whatsappNumber: "",

        footerText:
          "© DianaKart. All rights reserved.",

        seoTitle:
          "DianaKart - Women Fashion Store",

        seoDescription:
          "Shop dresses, handbags, footwear, jewellery and beauty products at DianaKart.",

        isActive: true,
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Fetch website settings error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch website settings",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================
// CREATE OR UPDATE SETTINGS
// ============================

export async function PUT(
  request: NextRequest
) {
  try {
    await connectDB();

    const body = await request.json();

    const existingSettings =
      await WebsiteSettings.findOne().sort({
        createdAt: -1,
      });

    const payload = {
      storeName:
        String(body.storeName || "").trim() ||
        "DianaKart",

      logoUrl:
        String(body.logoUrl || "").trim() ||
        "/logo.png",

      contactNumber: String(
        body.contactNumber || ""
      ).trim(),

      email: String(
        body.email || ""
      )
        .trim()
        .toLowerCase(),

      address: String(
        body.address || ""
      ).trim(),

      instagramUrl: String(
        body.instagramUrl || ""
      ).trim(),

      facebookUrl: String(
        body.facebookUrl || ""
      ).trim(),

      whatsappNumber: String(
        body.whatsappNumber || ""
      ).trim(),

      footerText:
        String(body.footerText || "").trim() ||
        "© DianaKart. All rights reserved.",

      seoTitle:
        String(body.seoTitle || "").trim() ||
        "DianaKart - Women Fashion Store",

      seoDescription:
        String(
          body.seoDescription || ""
        ).trim() ||
        "Shop dresses, handbags, footwear, jewellery and beauty products at DianaKart.",

      isActive:
        typeof body.isActive === "boolean"
          ? body.isActive
          : true,
    };

    let settings;

    if (existingSettings) {
      settings =
        await WebsiteSettings.findByIdAndUpdate(
          existingSettings._id,
          payload,
          {
            new: true,
            runValidators: true,
          }
        );
    } else {
      settings =
        await WebsiteSettings.create(
          payload
        );
    }

    return NextResponse.json({
      success: true,
      message:
        "Website settings saved successfully",
      settings,
    });
  } catch (error) {
    console.error(
      "Save website settings error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to save website settings",
      },
      {
        status: 500,
      }
    );
  }
}