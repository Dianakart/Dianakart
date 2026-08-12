import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidBannerId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ============================
// GET SINGLE BANNER
// ============================

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!isValidBannerId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid banner ID",
        },
        {
          status: 400,
        }
      );
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return NextResponse.json(
        {
          success: false,
          message: "Banner not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      banner,
    });
  } catch (error) {
    console.error(
      "Fetch single banner error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch banner",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================
// UPDATE BANNER
// ============================

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!isValidBannerId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid banner ID",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const existingBanner =
      await Banner.findById(id);

    if (!existingBanner) {
      return NextResponse.json(
        {
          success: false,
          message: "Banner not found",
        },
        {
          status: 404,
        }
      );
    }

    const desktopImage =
      body.desktopImage !== undefined
        ? String(body.desktopImage).trim()
        : existingBanner.desktopImage;

    if (!desktopImage) {
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

    const updateData = {
      title:
        body.title !== undefined
          ? String(body.title).trim()
          : existingBanner.title,

      subtitle:
        body.subtitle !== undefined
          ? String(body.subtitle).trim()
          : existingBanner.subtitle,

      desktopImage,

      mobileImage:
        body.mobileImage !== undefined
          ? String(body.mobileImage).trim()
          : existingBanner.mobileImage,

      buttonText:
        body.buttonText !== undefined
          ? String(body.buttonText).trim() ||
            "Shop Now"
          : existingBanner.buttonText,

      buttonLink:
        body.buttonLink !== undefined
          ? String(body.buttonLink).trim() ||
            "/"
          : existingBanner.buttonLink,

      displayOrder:
        body.displayOrder !== undefined
          ? Math.max(
              0,
              Number(body.displayOrder || 0)
            )
          : existingBanner.displayOrder,

      isActive:
        typeof body.isActive === "boolean"
          ? body.isActive
          : existingBanner.isActive,
    };

    const updatedBanner =
      await Banner.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    return NextResponse.json({
      success: true,
      message:
        "Banner updated successfully",
      banner: updatedBanner,
    });
  } catch (error) {
    console.error(
      "Update banner error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update banner",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================
// DELETE BANNER
// ============================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!isValidBannerId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid banner ID",
        },
        {
          status: 400,
        }
      );
    }

    const deletedBanner =
      await Banner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return NextResponse.json(
        {
          success: false,
          message: "Banner not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Banner deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete banner error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete banner",
      },
      {
        status: 500,
      }
    );
  }
}