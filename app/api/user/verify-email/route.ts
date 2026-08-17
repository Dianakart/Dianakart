import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import {
  createUserToken,
  USER_SESSION_COOKIE_NAME,
  USER_SESSION_DURATION,
} from "@/lib/userAuth";
import User from "@/models/User";

export const runtime = "nodejs";

interface VerifyEmailRequestBody {
  email?: string;
  otp?: string;
}

const MAX_OTP_ATTEMPTS = 5;

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as VerifyEmailRequestBody;

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

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Verification code must be 6 digits.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const user =
      await User.findOne({
        email,
      }).select(
        "+emailOtpHash +emailOtpExpires +emailOtpLastSentAt +emailOtpAttempts"
      );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No account found with this email.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      user.emailVerified &&
      user.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This email is already verified. Please login.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !user.emailOtpHash ||
      !user.emailOtpExpires
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No active verification code found. Please request a new OTP.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      user.emailOtpAttempts >=
      MAX_OTP_ATTEMPTS
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many incorrect attempts. Please request a new OTP.",
        },
        {
          status: 429,
        }
      );
    }

    if (
      user.emailOtpExpires.getTime() <
      Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Verification code has expired. Please request a new OTP.",
        },
        {
          status: 400,
        }
      );
    }

    const isOtpValid =
      await compare(
        otp,
        user.emailOtpHash
      );

    if (!isOtpValid) {
      user.emailOtpAttempts += 1;

      await user.save();

      const attemptsLeft =
        MAX_OTP_ATTEMPTS -
        user.emailOtpAttempts;

      return NextResponse.json(
        {
          success: false,
          message:
            attemptsLeft > 0
              ? `Incorrect verification code. ${attemptsLeft} attempt${
                  attemptsLeft === 1
                    ? ""
                    : "s"
                } remaining.`
              : "Too many incorrect attempts. Please request a new OTP.",
        },
        {
          status:
            attemptsLeft > 0
              ? 400
              : 429,
        }
      );
    }

    user.emailVerified = true;
    user.isActive = true;

    user.emailOtpHash = "";
    user.emailOtpExpires = null;
    user.emailOtpLastSentAt = null;
    user.emailOtpAttempts = 0;

    await user.save();

    const token =
      await createUserToken({
        userId:
          user._id.toString(),
        email:
          user.email,
      });

    const response =
      NextResponse.json(
        {
          success: true,
          message:
            "Email verified successfully.",
          user: {
            id:
              user._id.toString(),
            name:
              user.name,
            email:
              user.email,
            phone:
              user.phone,
          },
        },
        {
          status: 200,
        }
      );

    response.cookies.set({
      name:
        USER_SESSION_COOKIE_NAME,
      value:
        token,
      httpOnly:
        true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite:
        "lax",
      path:
        "/",
      maxAge:
        USER_SESSION_DURATION,
    });

    return response;
  } catch (error) {
    console.error(
      "VERIFY EMAIL API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify email. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}