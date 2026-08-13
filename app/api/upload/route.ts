import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";

export const runtime = "nodejs";

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const allowedFolders = ["products", "banners"] as const;

type UploadFolder = (typeof allowedFolders)[number];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const requestedFolder = String(
      formData.get("folder") || "products"
    );

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select an image.",
        },
        {
          status: 400,
        }
      );
    }

    const folder: UploadFolder = allowedFolders.includes(
      requestedFolder as UploadFolder
    )
      ? (requestedFolder as UploadFolder)
      : "products";

    const extension = allowedTypes[file.type];

    if (!extension) {
      return NextResponse.json(
        {
          success: false,
          error: "Only JPG, PNG and WEBP images are allowed.",
        },
        {
          status: 400,
        }
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "Image must be smaller than 5MB.",
        },
        {
          status: 400,
        }
      );
    }

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const blob = await put(
      `${folder}/${fileName}`,
      file,
      {
        access: "public",
        addRandomSuffix: false,
      }
    );

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    console.error("Upload Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Image upload failed.",
      },
      {
        status: 500,
      }
    );
  }
}