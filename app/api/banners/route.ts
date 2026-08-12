import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";

export const runtime = "nodejs";

// ============================
// GET ALL BANNERS
// ============================

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const activeOnly =
      searchParams.get("active") === "true";

    const filter = activeOnly
      ? {
          isActive: true,
        }
      : {};

    const banners = await Banner.find(filter).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      banners,
    });
  } catch (error) {
    console.error("Fetch banners error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch banners",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================
// CREATE BANNER
// ============================

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      title,
      subtitle,
      desktopImage,
      mobileImage,
      buttonText,
      buttonLink,
      displayOrder,
      isActive,
    } = body;

    if (
      !desktopImage ||
      !String(desktopImage).trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Desktop banner image is required",
        },
        {
          status: 400,
        }
      );
    }

    const banner = await Banner.create({
      title: String(title || "").trim(),

      subtitle: String(
        subtitle || ""
      ).trim(),

      desktopImage: String(
        desktopImage
      ).trim(),

      mobileImage: String(
        mobileImage || ""
      ).trim(),

      buttonText:
        String(buttonText || "").trim() ||
        "Shop Now",

      buttonLink:
        String(buttonLink || "").trim() || "/",

      displayOrder: Math.max(
        0,
        Number(displayOrder || 0)
      ),

      isActive:
        typeof isActive === "boolean"
          ? isActive
          : true,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Banner created successfully",
        banner,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Create banner error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create banner",
      },
      {
        status: 500,
      }
    );
  }
}