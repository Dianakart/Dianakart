import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import type {
  ProductVariant,
} from "@/models/Product";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface ProductRequestBody {
  name?: unknown;
  sku?: unknown;
  brand?: unknown;
  category?: unknown;
  supplier?: unknown;
  costPrice?: unknown;
  sellingPrice?: unknown;
  image?: unknown;
  images?: unknown;
  variants?: unknown;
  description?: unknown;
  status?: unknown;
}

interface RawVariant {
  color?: unknown;
  sizes?: unknown;
}

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeImages(
  body: ProductRequestBody
) {
  const validImages = Array.isArray(
    body.images
  )
    ? body.images
        .filter(
          (
            image: unknown
          ): image is string =>
            typeof image === "string" &&
            image.trim().length > 0
        )
        .map((image) =>
          image.trim()
        )
        .slice(0, 5)
    : [];

  const mainImage =
    normalizeText(body.image);

  if (
    validImages.length === 0 &&
    mainImage
  ) {
    return [mainImage];
  }

  if (
    mainImage &&
    !validImages.includes(
      mainImage
    )
  ) {
    validImages.unshift(
      mainImage
    );
  }

  return validImages.slice(
    0,
    5
  );
}

function normalizeVariants(
  variantsValue: unknown
): ProductVariant[] {
  if (
    !Array.isArray(
      variantsValue
    )
  ) {
    return [];
  }

  return variantsValue
    .filter(
      (
        variant: unknown
      ): variant is RawVariant =>
        typeof variant ===
          "object" &&
        variant !== null
    )
    .map(
      (
        variant
      ): ProductVariant => {
        const color =
          normalizeText(
            variant.color
          );

        const sizes = Array.isArray(
          variant.sizes
        )
          ? variant.sizes
              .filter(
                (
                  size: unknown
                ): size is string =>
                  typeof size ===
                    "string" &&
                  size.trim()
                    .length > 0
              )
              .map((size) =>
                size.trim()
              )
          : [];

        return {
          color,
          sizes: [
            ...new Set(
              sizes
            ),
          ],
        };
      }
    )
    .filter(
      (variant) =>
        variant.color.length >
          0 ||
        variant.sizes.length >
          0
    );
}

// GET: Load single product
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid product ID",
        },
        {
          status: 400,
        }
      );
    }

    const product =
      await Product.findById(
        id
      )
        .select("-stock")
        .lean();

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      product
    );
  } catch (error) {
    console.error(
      "GET Single Product Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load product",
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

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid product ID",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      (await request.json()) as ProductRequestBody;

    const currentProduct =
      await Product.findById(
        id
      );

    if (!currentProduct) {
      return NextResponse.json(
        {
          error:
            "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    const name =
      normalizeText(
        body.name
      );

    const sku =
      normalizeText(
        body.sku
      ).toUpperCase();

    const brand =
      normalizeText(
        body.brand
      );

    const category =
      normalizeText(
        body.category
      );

    const supplier =
      normalizeText(
        body.supplier
      );

    const description =
      normalizeText(
        body.description
      );

    const status =
      body.status ===
      "Inactive"
        ? "Inactive"
        : "Active";

    const costPrice =
      Number(
        body.costPrice
      );

    const sellingPrice =
      Number(
        body.sellingPrice
      );

    const images =
      normalizeImages(
        body
      );

    const mainImage =
      images[0] || "";

    const variants =
      normalizeVariants(
        body.variants
      );

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Product name is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!sku) {
      return NextResponse.json(
        {
          error:
            "Product Code / SKU is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          error:
            "Category is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        costPrice
      ) ||
      !Number.isFinite(
        sellingPrice
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Prices must be valid numbers",
        },
        {
          status: 400,
        }
      );
    }

    if (
      costPrice < 0 ||
      sellingPrice < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Prices cannot be negative",
        },
        {
          status: 400,
        }
      );
    }

    if (
      sellingPrice <
      costPrice
    ) {
      return NextResponse.json(
        {
          error:
            "Selling price cannot be lower than cost price",
        },
        {
          status: 400,
        }
      );
    }

    if (
      images.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "At least one product image is required",
        },
        {
          status: 400,
        }
      );
    }

    const escapedSku =
      sku.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const duplicateSku =
      await Product.findOne({
        sku: {
          $regex:
            `^${escapedSku}$`,
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
            "This Product Code / SKU already exists",
        },
        {
          status: 409,
        }
      );
    }

    const updatedProduct =
      await Product.findByIdAndUpdate(
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
            image:
              mainImage,
            images,
            variants,
            description,
            status,
          },

          // Removes legacy stock field
          // from this product when edited.
          $unset: {
            stock: "",
          },
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .select("-stock")
        .lean();

    return NextResponse.json({
      success: true,
      message:
        "Product updated successfully",
      product:
        updatedProduct,
    });
  } catch (error) {
    console.error(
      "PUT Product Error:",
      error
    );

    if (
      error instanceof
        Error &&
      error.message.includes(
        "duplicate key"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This Product Code / SKU already exists",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to update product",
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

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid product ID",
        },
        {
          status: 400,
        }
      );
    }

    const deletedProduct =
      await Product.findByIdAndDelete(
        id
      );

    if (!deletedProduct) {
      return NextResponse.json(
        {
          error:
            "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Product deleted successfully",
      deletedProductId:
        id,
    });
  } catch (error) {
    console.error(
      "DELETE Product Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete product",
      },
      {
        status: 500,
      }
    );
  }
}