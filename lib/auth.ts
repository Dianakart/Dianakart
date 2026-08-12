import {
  JWTPayload,
  SignJWT,
  jwtVerify,
} from "jose";

export const SESSION_COOKIE_NAME =
  "dianakart_admin_session";

export interface AdminSession extends JWTPayload {
  email: string;
  role: "admin";
}

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not defined in .env.local"
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createAdminToken(
  email: string
): Promise<string> {
  return new SignJWT({
    email,
    role: "admin",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getAuthSecret());
}

export async function verifyAdminToken(
  token?: string
): Promise<AdminSession | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getAuthSecret(),
      {
        algorithms: ["HS256"],
      }
    );

    if (
      payload.role !== "admin" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return payload as AdminSession;
  } catch {
    return null;
  }
}