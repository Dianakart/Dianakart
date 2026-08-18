import crypto from "crypto";
import { hash } from "bcryptjs";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";

interface ResetPasswordBody {
  token?: string;
  password?: string;
  confirmPassword?: string;
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as ResetPasswordBody;

    const token = String(
      body.token || ""
    ).trim();

    const password = String(
      body.password || ""
    );

    const confirmPassword = String(
      body.confirmPassword || ""
    );

    if (
      !token ||
      !password ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Reset token and password fields are required.",
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

    if (
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least one letter and one number.",
        },
        { status: 400 }
      );
    }

    if (
      password !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    const hashedToken =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    await connectDB();

    const user =
      await User.findOne({
        passwordResetToken:
          hashedToken,

        passwordResetExpires: {
          $gt: new Date(),
        },
      }).select("+password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This password reset session is invalid or has expired.",
        },
        { status: 400 }
      );
    }

    const hashedPassword =
      await hash(
        password,
        12
      );

    user.password =
      hashedPassword;

    user.passwordResetToken =
      "";

    user.passwordResetExpires =
      null;

    user.passwordResetOtpHash =
      "";

    user.passwordResetOtpExpires =
      null;

    user.passwordResetOtpLastSentAt =
      null;

    user.passwordResetOtpAttempts =
      0;

    await user.save();

    return NextResponse.json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to reset password. Please try again.",
      },
      { status: 500 }
    );
  }
}