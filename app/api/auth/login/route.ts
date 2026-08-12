import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createAdminToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export const runtime = "nodejs";

interface LoginRequestBody {
  email?: string;
  password?: string;
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as LoginRequestBody;

    const email = String(
      body.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      body.password || ""
    );

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    const adminEmail = String(
      process.env.ADMIN_EMAIL || ""
    )
      .trim()
      .toLowerCase();

    const passwordHashBase64 =
      String(
        process.env.ADMIN_PASSWORD_HASH_B64 ||
          ""
      ).trim();

    const passwordHash =
      passwordHashBase64
        ? Buffer.from(
            passwordHashBase64,
            "base64"
          ).toString("utf8")
        : "";

    const authSecret =
      String(
        process.env.AUTH_SECRET || ""
      ).trim();

    if (
      !adminEmail ||
      !passwordHash ||
      !authSecret
    ) {
      console.error(
        "Missing admin authentication environment variables."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Admin authentication is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const passwordMatches =
      await compare(
        password,
        passwordHash
      );

    if (
      email !== adminEmail ||
      !passwordMatches
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      await createAdminToken(
        adminEmail
      );

    const cookieStore =
      await cookies();

    cookieStore.set({
      name:
        SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge:
        60 * 60 * 8,
    });

    return NextResponse.json({
      success: true,
      message:
        "Login successful.",
    });
  } catch (error) {
    console.error(
      "ADMIN LOGIN API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Login API error. Check the terminal.",
      },
      {
        status: 500,
      }
    );
  }
}