import { compare } from "bcryptjs";
import crypto from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";

interface VerifyResetOtpBody {
  email?: string;
  otp?: string;
}

const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_MINUTES = 15;

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as VerifyResetOtpBody;

    const email = String(
      body.email || ""
    )
      .trim()
      .toLowerCase();

    const otp = String(
      body.otp || ""
    )
      .replace(/\D/g, "")
      .trim();

    if (!email || !otp) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email and verification code are required.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Verification code must be 6 digits.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user =
      await User.findOne({
        email,
      }).select(
        "+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpAttempts"
      );

    if (
      !user ||
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpires
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid or expired password reset code.",
        },
        { status: 400 }
      );
    }

    if (
      user.passwordResetOtpAttempts >=
      MAX_OTP_ATTEMPTS
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many incorrect attempts. Please request a new code.",
        },
        { status: 429 }
      );
    }

    if (
      user.passwordResetOtpExpires.getTime() <
      Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password reset code has expired. Please request a new code.",
        },
        { status: 400 }
      );
    }

    const isOtpValid =
      await compare(
        otp,
        user.passwordResetOtpHash
      );

    if (!isOtpValid) {
      user.passwordResetOtpAttempts += 1;

      await user.save();

      const attemptsLeft =
        MAX_OTP_ATTEMPTS -
        user.passwordResetOtpAttempts;

      return NextResponse.json(
        {
          success: false,
          message:
            attemptsLeft > 0
              ? `Incorrect verification code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`
              : "Too many incorrect attempts. Please request a new code.",
        },
        {
          status:
            attemptsLeft > 0
              ? 400
              : 429,
        }
      );
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
          RESET_TOKEN_MINUTES *
            60 *
            1000
      );

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
        "Verification successful.",
      resetToken,
    });
  } catch (error) {
    console.error(
      "VERIFY RESET OTP API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify the code. Please try again.",
      },
      { status: 500 }
    );
  }
}