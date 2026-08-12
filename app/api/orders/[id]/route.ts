import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";

import {
  SESSION_COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/auth";

import Order, {
  OrderStatus,
} from "@/models/Order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateOrderBody {
  status?: unknown;
}

async function getAdminSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    SESSION_COOKIE_NAME
  )?.value;

  return verifyAdminToken(token);
}

/* ========================================
   GET SINGLE ORDER - ADMIN
======================================== */

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order ID.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const order =
      await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "GET SINGLE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load order.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ========================================
   PATCH ORDER STATUS - ADMIN
======================================== */

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order ID.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      (await request.json()) as UpdateOrderBody;

    const allowedStatuses: OrderStatus[] =
      [
        "Pending",
        "Confirmed",
        "Completed",
      ];

    const status =
      typeof body.status ===
      "string"
        ? body.status.trim()
        : "";

    if (
      !allowedStatuses.includes(
        status as OrderStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order status.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const order =
      await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    order.status =
      status as OrderStatus;

    await order.save();

    return NextResponse.json({
      success: true,
      message:
        "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update order status.",
      },
      {
        status: 500,
      }
    );
  }
}