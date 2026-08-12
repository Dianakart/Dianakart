import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import {
  createUserToken,
  USER_SESSION_COOKIE_NAME,
  USER_SESSION_DURATION,
} from "@/lib/userAuth";
import User from "@/models/User";

export const runtime = "nodejs";

interface RegisterRequestBody {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterRequestBody;

    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body.phone || "")
      .replace(/\D/g, "")
      .trim();
    const password = String(body.password || "");
    const confirmPassword = String(
      body.confirmPassword || ""
    );

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill in all required fields.",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must be at least 2 characters.",
        },
        { status: 400 }
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    const phonePattern = /^[6-9]\d{9}$/;

    if (!phonePattern.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid 10-digit Indian phone number.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    }).lean();

    if (existingUser) {
      const message =
        existingUser.email === email
          ? "An account with this email already exists."
          : "An account with this phone number already exists.";

      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      isActive: true,
    });

    const token = await createUserToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: USER_SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: USER_SESSION_DURATION,
    });

    return response;
  } catch (error) {
    console.error("CUSTOMER REGISTER API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create account. Please try again.",
      },
      { status: 500 }
    );
  }
}