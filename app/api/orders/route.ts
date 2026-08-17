import mongoose from "mongoose";
import { cookies } from "next/headers";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { connectDB } from "@/lib/mongodb";

import {
  SESSION_COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/auth";

import {
  USER_SESSION_COOKIE_NAME,
  verifyUserToken,
} from "@/lib/userAuth";

import Order, {
  IOrderItem,
} from "@/models/Order";

import Product from "@/models/Product";

export const runtime = "nodejs";

function generateOrderId() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  const random = Math.floor(
    100000 +
      Math.random() * 900000
  );

  return `DK${year}${month}${day}${random}`;
}

async function getAdminSession() {
  const cookieStore =
    await cookies();

  const token = cookieStore.get(
    SESSION_COOKIE_NAME
  )?.value;

  return verifyAdminToken(token);
}

async function getCustomerSession() {
  const cookieStore =
    await cookies();

  const token = cookieStore.get(
    USER_SESSION_COOKIE_NAME
  )?.value;

  return verifyUserToken(token);
}

interface CreateOrderBody {
  customerName?: unknown;
  phone?: unknown;
  email?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  pinCode?: unknown;
  paymentMethod?: unknown;
  items?: unknown;
}

interface RawOrderItem {
  productId?: unknown;
  name?: unknown;
  image?: unknown;
  price?: unknown;
  quantity?: unknown;
  size?: unknown;
}

/* ========================================
   GET - ADMIN: LOAD ALL ORDERS
   SKU is enriched from Product DB for
   legacy orders that were saved earlier.
======================================== */

export async function GET() {
  try {
    const adminSession =
      await getAdminSession();

    if (!adminSession) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin login required.",
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const orders =
      await Order.find({})
        .sort({
          createdAt: -1,
        })
        .lean();

    const productIds = Array.from(
      new Set(
        orders.flatMap((order) =>
          order.items
            .map((item) =>
              String(
                item.productId || ""
              ).trim()
            )
            .filter((id) =>
              mongoose.Types.ObjectId.isValid(
                id
              )
            )
        )
      )
    );

    const products =
      productIds.length > 0
        ? await Product.find({
            _id: {
              $in: productIds,
            },
          })
            .select("_id sku")
            .lean()
        : [];

    const skuByProductId =
      new Map<string, string>(
        products.map(
          (product) => [
            String(product._id),
            String(
              product.sku || ""
            ).trim(),
          ]
        )
      );

    const ordersWithSku =
      orders.map((order) => ({
        ...order,

        items: order.items.map(
          (item) => ({
            ...item,

            sku:
              String(
                item.sku || ""
              ).trim() ||
              skuByProductId.get(
                String(
                  item.productId
                )
              ) ||
              "",
          })
        ),
      }));

    return NextResponse.json({
      success: true,
      orders: ordersWithSku,
    });
  } catch (error) {
    console.error(
      "GET ORDERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch orders.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ========================================
   POST - CUSTOMER: PLACE ORDER
   Customer does NOT send SKU.
   Backend reads SKU directly from Product DB.
======================================== */

export async function POST(
  request: NextRequest
) {
  try {
    const customerSession =
      await getCustomerSession();

    if (!customerSession) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login before placing an order.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as CreateOrderBody;

    const customerName =
      typeof body.customerName ===
      "string"
        ? body.customerName.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone
            .replace(/\D/g, "")
            .trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    const city =
      typeof body.city === "string"
        ? body.city.trim()
        : "";

    const state =
      typeof body.state === "string"
        ? body.state.trim()
        : "";

    const pinCode =
      typeof body.pinCode === "string"
        ? body.pinCode
            .replace(/\D/g, "")
            .trim()
        : "";

    if (
      !customerName ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pinCode
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please fill all required delivery details.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[6-9]\d{9}$/.test(
        phone
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid 10-digit mobile number.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^\d{6}$/.test(
        pinCode
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid 6-digit PIN code.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(
        body.items
      ) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cart is empty.",
        },
        {
          status: 400,
        }
      );
    }

    const parsedItems =
      body.items
        .filter(
          (
            item: unknown
          ): item is RawOrderItem =>
            typeof item ===
              "object" &&
            item !== null
        )
        .map(
          (
            item: RawOrderItem
          ) => ({
            productId:
              String(
                item.productId ||
                  ""
              ).trim(),

            name:
              String(
                item.name || ""
              ).trim(),

            image:
              String(
                item.image || ""
              ).trim(),

            price:
              Number(
                item.price
              ),

            quantity:
              Number(
                item.quantity
              ),

            size:
              typeof item.size ===
              "string"
                ? item.size.trim()
                : "",
          })
        )
        .filter(
          (item) =>
            item.productId.length >
              0 &&
            item.name.length > 0 &&
            Number.isFinite(
              item.price
            ) &&
            item.price >= 0 &&
            Number.isInteger(
              item.quantity
            ) &&
            item.quantity > 0
        );

    if (
      parsedItems.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid products found in cart.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const validProductIds =
      Array.from(
        new Set(
          parsedItems
            .map(
              (item) =>
                item.productId
            )
            .filter((id) =>
              mongoose.Types.ObjectId.isValid(
                id
              )
            )
        )
      );

    const products =
      validProductIds.length > 0
        ? await Product.find({
            _id: {
              $in: validProductIds,
            },
          })
            .select("_id sku")
            .lean()
        : [];

    const skuByProductId =
      new Map<string, string>(
        products.map(
          (product) => [
            String(product._id),
            String(
              product.sku || ""
            ).trim(),
          ]
        )
      );

    const items: IOrderItem[] =
      parsedItems.map(
        (item) => ({
          ...item,

          sku:
            skuByProductId.get(
              item.productId
            ) || "",
        })
      );

    const totalItems =
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          item.quantity,
        0
      );

    const totalAmount =
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          item.price *
            item.quantity,
        0
      );

    const order =
      await Order.create({
        orderId:
          generateOrderId(),

        userId:
          customerSession.userId,

        customerName,

        phone,

        email:
          email ||
          customerSession.email,

        address,
        city,
        state,
        pinCode,

        items,

        totalItems,
        totalAmount,

        paymentMethod:
          "COD",

        status:
          "Pending",
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Order Placed Successfully",

        order,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while placing the order.",
      },
      {
        status: 500,
      }
    );
  }
}