import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface ProductRequestBody {
  name?: string;
  sku?: string;
  brand?: string;
  category?: string;
  supplier?: string;
  costPrice?: number | string;
  sellingPrice?: number | string;
  stock?: number | string;
  image?: string;
  images?: string[];
  description?: string;
  status?: string;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeImages(body: ProductRequestBody) {
  const validImages = Array.isArray(body.images)
    ? body.images
        .filter(
          (image): image is string =>
            typeof image === "string" && image.trim().length > 0
        )
        .map((image) => image.trim())
        .slice(0, 5)
    : [];

  const mainImage = normalizeText(body.image);

  if (validImages.length === 0 && mainImage) {
    return [mainImage];
  }

  if (mainImage && !validImages.includes(mainImage)) {
    validImages.unshift(mainImage);
  }

  return validImages.slice(0, 5);
}

// GET: Load single product
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: "Invalid product ID",
        },
        {
          status: 400,
        }
      );
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json(
        {
          error: "Product nahi mila",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET Single Product Error:", error);

    return NextResponse.json(
      {
        error: "Product load nahi hua",
      },
      {
        status: 500,
      }
    );
  }
}

// PUT: Update product
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: "Invalid product ID",
        },
        {
          status: 400,
        }
      );
    }

    const body: ProductRequestBody = await request.json();

    const currentProduct = await Product.findById(id);

    if (!currentProduct) {
      return NextResponse.json(
        {
          error: "Product nahi mila",
        },
        {
          status: 404,
        }
      );
    }

    const name = normalizeText(body.name);
    const sku = normalizeText(body.sku).toUpperCase();
    const brand = normalizeText(body.brand);
    const category = normalizeText(body.category);
    const supplier = normalizeText(body.supplier);
    const description = normalizeText(body.description);
    const status = normalizeText(body.status) || "Active";

    const costPrice = Number(body.costPrice);
    const sellingPrice = Number(body.sellingPrice);
    const stock = Number(body.stock);

    const images = normalizeImages(body);
    const mainImage = images[0] || "";

    if (!name) {
      return NextResponse.json(
        {
          error: "Product name required hai",
        },
        {
          status: 400,
        }
      );
    }

    if (!sku) {
      return NextResponse.json(
        {
          error: "Product Code / SKU required hai",
        },
        {
          status: 400,
        }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          error: "Category required hai",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(costPrice) ||
      !Number.isFinite(sellingPrice) ||
      !Number.isFinite(stock)
    ) {
      return NextResponse.json(
        {
          error: "Price aur stock valid number hona chahiye",
        },
        {
          status: 400,
        }
      );
    }

    if (costPrice < 0 || sellingPrice < 0 || stock < 0) {
      return NextResponse.json(
        {
          error: "Price aur stock negative nahi ho sakte",
        },
        {
          status: 400,
        }
      );
    }

    if (sellingPrice < costPrice) {
      return NextResponse.json(
        {
          error: "Selling price cost price se kam nahi ho sakti",
        },
        {
          status: 400,
        }
      );
    }

    if (images.length === 0) {
      return NextResponse.json(
        {
          error: "Kam se kam ek product image required hai",
        },
        {
          status: 400,
        }
      );
    }

    const duplicateSku = await Product.findOne({
      sku: {
        $regex: `^${sku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
      _id: {
        $ne: id,
      },
    }).lean();

    if (duplicateSku) {
      return NextResponse.json(
        {
          error:
            "Ye Product Code / SKU kisi aur product me available hai",
        },
        {
          status: 409,
        }
      );
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          sku,
          brand,
          category,
          supplier,
          costPrice,
          sellingPrice,
          stock,
          image: mainImage,
          images,
          description,
          status,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Product successfully update ho gaya",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("PUT Product Error:", error);

    if (
      error instanceof Error &&
      error.message.includes("duplicate key")
    ) {
      return NextResponse.json(
        {
          error: "Ye Product Code / SKU pehle se available hai",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Product update nahi hua",
      },
      {
        status: 500,
      }
    );
  }
}

// DELETE: Permanently delete product
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: "Invalid product ID",
        },
        {
          status: 400,
        }
      );
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        {
          error: "Product nahi mila",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product successfully delete ho gaya",
      deletedProductId: id,
    });
  } catch (error) {
    console.error("DELETE Product Error:", error);

    return NextResponse.json(
      {
        error: "Product delete nahi hua",
      },
      {
        status: 500,
      }
    );
  }
}