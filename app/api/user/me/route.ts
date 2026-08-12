import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import {
  USER_SESSION_COOKIE_NAME,
  verifyUserToken,
} from "@/lib/userAuth";
import User from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(
      USER_SESSION_COOKIE_NAME
    )?.value;

    const session = await verifyUserToken(token);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not logged in.",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(
      session.userId
    )
      .select(
        "name email phone isActive createdAt updatedAt"
      )
      .lean();

    if (!user || !user.isActive) {
      const response = NextResponse.json(
        {
          success: false,
          message: "User account was not found.",
        },
        { status: 401 }
      );

      response.cookies.set({
        name: USER_SESSION_COOKIE_NAME,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });

      return response;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("CURRENT CUSTOMER API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to retrieve your account information.",
      },
      { status: 500 }
    );
  }
}