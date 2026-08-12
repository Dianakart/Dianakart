import { NextResponse } from "next/server";

import {
  USER_SESSION_COOKIE_NAME,
} from "@/lib/userAuth";

export const runtime = "nodejs";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logout successful.",
    });

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
  } catch (error) {
    console.error("CUSTOMER LOGOUT API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to logout.",
      },
      { status: 500 }
    );
  }
}