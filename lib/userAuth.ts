import {
  JWTPayload,
  SignJWT,
  jwtVerify,
} from "jose";

export const USER_SESSION_COOKIE_NAME =
  "dianakart_user_session";

export const USER_SESSION_DURATION =
  60 * 60 * 24 * 7;

export interface UserSession extends JWTPayload {
  userId: string;
  email: string;
  role: "customer";
}

function getUserAuthSecret(): Uint8Array {
  const secret =
    process.env.USER_AUTH_SECRET ||
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "USER_AUTH_SECRET or AUTH_SECRET is not defined in .env.local"
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createUserToken({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<string> {
  return new SignJWT({
    userId,
    email,
    role: "customer",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getUserAuthSecret());
}

export async function verifyUserToken(
  token?: string
): Promise<UserSession | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getUserAuthSecret(),
      {
        algorithms: ["HS256"],
      }
    );

    if (
      payload.role !== "customer" ||
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return payload as UserSession;
  } catch {
    return null;
  }
}