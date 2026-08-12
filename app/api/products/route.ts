import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import type {
  ProductVariant,
  ProductDocument,
} from "@/models/Product";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProductRequestBody {
  name?: unknown;
  sku?: unknown;
  brand?: unknown;
  category?: unknown;
  supplier?: unknown;
  costPrice?: unknown;
  sellingPrice?: unknown;
  stock?: unknown;
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

function getCleanString(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getCleanImages(
  imagesValue: unknown,
  mainImageValue: unknown
): {
  images: string[];
  mainImage: string;
} {
  const uploadedImages: string[] = Array.isArray(
    imagesValue
  )
    ? imagesValue
        .filter(
          (image: unknown): image is string =>
            typeof image === "string" &&
            image.trim().length > 0
        )
        .map((image: string) => image.trim())
    : [];

  const requestedMainImage =
    getCleanString(mainImageValue);

  const combinedImages: string[] =
    requestedMainImage
      ? [requestedMainImage, ...uploadedImages]
      : uploadedImages;

  const uniqueImages: string[] = [
    ...new Set<string>(combinedImages),
  ];

  const finalImages: string[] =
    uniqueImages.slice(0, 5);

  const mainImage: string =
    finalImages.length > 0
      ? finalImages[0]
      : "";

  return {
    images: finalImages,
    mainImage,
  };
}

function getCleanVariants(
  variantsValue: unknown
): ProductVariant[] {
  if (!Array.isArray(variantsValue)) {
    return [];
  }

  return variantsValue
    .filter(
      (variant: unknown): variant is RawVariant =>
        typeof variant === "object" &&
        variant !== null
    )
    .map(
      (variant: RawVariant): ProductVariant => {
        const color = getCleanString(
          variant.color
        );

        const sizes: string[] = Array.isArray(
          variant.sizes
        )
          ? variant.sizes
              .filter(
                (
                  size: unknown
                ): size is string =>
                  typeof size === "string" &&
                  size.trim().length > 0
              )
              .map((size: string) =>
                size.trim()
              )
          : [];

        return {
          color,
          sizes: [
            ...new Set<string>(sizes),
          ],
        };
      }
    )
    .filter(
      (variant: ProductVariant) =>
        variant.color.length > 0 ||
        variant.sizes.length > 0
    );
}

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({})
      .sort({
        createdAt: -1,
      })
      .lean();

    return NextResponse.json(products, {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error(
      "GET Products Error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load products",
        details:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    await connectDB();

    const body =
      (await request.json()) as ProductRequestBody;

    const name = getCleanString(body.name);

    const normalizedSku = getCleanString(
      body.sku
    ).toUpperCase();

    const brand = getCleanString(
      body.brand
    );

    const category = getCleanString(
      body.category
    );

    const supplier = getCleanString(
      body.supplier
    );

    const description = getCleanString(
      body.description
    );

    const costPrice = Number(
      body.costPrice
    );

    const sellingPrice = Number(
      body.sellingPrice
    );

    const stock = Number(body.stock);

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

    if (!normalizedSku) {
      return NextResponse.json(
        {
          error:
            "Product SKU is required",
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
            "Product category is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(costPrice) ||
      costPrice < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Valid cost price is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Valid selling price is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Valid stock quantity is required",
        },
        {
          status: 400,
        }
      );
    }

    const existingProduct =
      await Product.findOne({
        sku: normalizedSku,
      }).lean();

    if (existingProduct) {
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

    const {
      images: finalImages,
      mainImage,
    } = getCleanImages(
      body.images,
      body.image
    );

    const variants: ProductVariant[] =
      getCleanVariants(body.variants);

    const status:
      | "Active"
      | "Inactive" =
      body.status === "Inactive"
        ? "Inactive"
        : "Active";

    const productData: Omit<
  ProductDocument,
  "createdAt" | "updatedAt"
> = {
  name,
  sku: normalizedSku,
  brand,
  category,
  supplier,
  costPrice,
  sellingPrice,
  stock,
  image: mainImage,
  images: finalImages,
  variants,
  description,
  status,
};

const product = new Product(productData);

await product.save();
    return NextResponse.json(product, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "POST Product Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to save product",
        details:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      },
      {
        status: 500,
      }
    );
  }
}