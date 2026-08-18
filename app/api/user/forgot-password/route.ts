import { hash } from "bcryptjs";
import { randomInt } from "crypto";

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

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

function generateOtp() {
  return randomInt(100000, 1000000).toString();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendPasswordResetOtp({
  email,
  name,
  otp,
}: {
  email: string;
  name: string;
  otp: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;

  const senderEmail =
    process.env.BREVO_SENDER_EMAIL ||
    "noreply@dianakart.in";

  const senderName =
    process.env.BREVO_SENDER_NAME ||
    "DianaKart";

  if (!apiKey) {
    throw new Error(
      "BREVO_API_KEY is not configured."
    );
  }

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email,
            name,
          },
        ],
        subject:
          "DianaKart password reset code",
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <body style="margin:0;padding:0;background:#f7f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
              <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
                <div style="padding:28px;text-align:center;background:linear-gradient(135deg,#db2777,#9333ea);color:#ffffff;">
                  <h1 style="margin:0;font-size:28px;">DianaKart</h1>
                  <p style="margin:8px 0 0;font-size:14px;">Password Reset</p>
                </div>
                <div style="padding:32px;text-align:center;">
                  <h2 style="margin:0 0 12px;font-size:22px;">Hi ${escapeHtml(name)},</h2>
                  <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.7;">
                    Use this verification code to reset your DianaKart password.
                  </p>
                  <div style="margin:28px auto;padding:18px 20px;max-width:260px;border-radius:14px;background:#fdf2f8;border:1px solid #fbcfe8;font-size:34px;font-weight:700;letter-spacing:8px;color:#be185d;">
                    ${otp}
                  </div>
                  <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.7;">
                    This code is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
                  </p>
                  <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
                    If you did not request a password reset, you can ignore this email.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "BREVO PASSWORD RESET OTP ERROR:",
      response.status,
      errorText
    );

    throw new Error(
      "Unable to send password reset code."
    );
  }
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
        { status: 400 }
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
        { status: 400 }
      );
    }

    await connectDB();

    const user =
      await User.findOne({
        email,
      }).select(
        "+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpLastSentAt +passwordResetOtpAttempts"
      );

    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, a password reset code has been sent.",
        email,
      });
    }

    if (user.passwordResetOtpLastSentAt) {
      const elapsedSeconds =
        Math.floor(
          (Date.now() -
            user.passwordResetOtpLastSentAt.getTime()) /
            1000
        );

      if (
        elapsedSeconds <
        RESEND_COOLDOWN_SECONDS
      ) {
        const retryAfter =
          RESEND_COOLDOWN_SECONDS -
          elapsedSeconds;

        return NextResponse.json(
          {
            success: false,
            message:
              `Please wait ${retryAfter} seconds before requesting another code.`,
            retryAfter,
          },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp();
    const otpHash =
      await hash(otp, 12);

    user.passwordResetOtpHash =
      otpHash;

    user.passwordResetOtpExpires =
      new Date(
        Date.now() +
          OTP_EXPIRY_MINUTES *
            60 *
            1000
      );

    user.passwordResetOtpLastSentAt =
      new Date();

    user.passwordResetOtpAttempts =
      0;

    user.passwordResetToken =
      "";

    user.passwordResetExpires =
      null;

    await user.save();

    try {
      await sendPasswordResetOtp({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (emailError) {
      user.passwordResetOtpHash =
        "";
      user.passwordResetOtpExpires =
        null;
      user.passwordResetOtpLastSentAt =
        null;
      user.passwordResetOtpAttempts =
        0;

      await user.save();

      console.error(
        "PASSWORD RESET OTP SEND ERROR:",
        emailError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to send the password reset code. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Password reset code sent to your email.",
      email: user.email,
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
      { status: 500 }
    );
  }
}