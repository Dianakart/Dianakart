import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import {
  USER_SESSION_COOKIE_NAME,
  verifyUserToken,
} from "@/lib/userAuth";

import Order from "@/models/Order";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(
      USER_SESSION_COOKIE_NAME
    )?.value;

    const session =
      await verifyUserToken(token);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login to view your orders.",
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const orders = await Order.find({
      userId: session.userId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "CUSTOMER ORDERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load your orders.",
      },
      {
        status: 500,
      }
    );
  }
}