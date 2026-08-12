import crypto from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";

interface ForgotPasswordBody {
  email?: string;
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as ForgotPasswordBody;

    const email = String(
      body.email || ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter your email address.",
        },
        {
          status: 400,
        }
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const user = await User.findOne({
      email,
    });

    // Same response even if account does not exist
    // so the API does not reveal registered emails.
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, password reset instructions have been created.",
      });
    }

    const resetToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    const hashedToken =
      crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    user.passwordResetToken =
      hashedToken;

    user.passwordResetExpires =
      new Date(
        Date.now() +
          15 * 60 * 1000
      );

    await user.save();

    const resetUrl =
      `http://localhost:3000/reset-password?token=${resetToken}`;

    console.log(
      "\n===================================="
    );

    console.log(
      "DIANAKART PASSWORD RESET LINK:"
    );

    console.log(resetUrl);

    console.log(
      "Valid for 15 minutes."
    );

    console.log(
      "====================================\n"
    );

    return NextResponse.json({
      success: true,
      message:
        "Password reset link generated. Check the VS Code terminal.",
    });
  } catch (error) {
    console.error(
      "FORGOT PASSWORD API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to process password reset. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}