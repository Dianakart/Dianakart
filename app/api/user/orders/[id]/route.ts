import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";

import {
  USER_SESSION_COOKIE_NAME,
  verifyUserToken,
} from "@/lib/userAuth";

import Order from "@/models/Order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(
      USER_SESSION_COOKIE_NAME
    )?.value;

    const session = await verifyUserToken(
      token
    );

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login to view this order.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

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

    const order = await Order.findOne({
      _id: id,
      userId: session.userId,
    }).lean();

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
      "CUSTOMER SINGLE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load order details.",
      },
      {
        status: 500,
      }
    );
  }
}