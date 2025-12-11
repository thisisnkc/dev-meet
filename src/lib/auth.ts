import jwt from "jsonwebtoken";
import { GetServerSidePropsContext } from "next";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthTokenPayload extends AuthUser {
  iat: number;
  exp: number;
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded user payload or null if invalid
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const secret = process.env.MEET_SECRET;
    if (!secret) {
      console.error("MEET_SECRET is not defined");
      return null;
    }

    const decoded = jwt.verify(token, secret) as AuthTokenPayload;
    return {
      id: decoded.id,
      email: decoded.email,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Extract token from request cookies or Authorization header
 * @param req - Next.js request object
 * @returns Token string or null
 */
export function extractToken(
  req: GetServerSidePropsContext["req"]
): string | null {
  // Check cookies first (recommended approach)
  const cookieToken = req.cookies?.token;
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Get authenticated user from request
 * Checks cookies and Authorization header for valid JWT token
 * @param req - Next.js request object
 * @returns Authenticated user or null
 */
export function getAuthUser(
  req: GetServerSidePropsContext["req"]
): AuthUser | null {
  const token = extractToken(req);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Require authentication for a page
 * Returns redirect object if not authenticated
 * @param context - GetServerSideProps context
 * @returns Object with user if authenticated, or redirect if not
 */
export function requireAuth(context: GetServerSidePropsContext): {
  user: AuthUser | null;
  redirect?: {
    destination: string;
    permanent: boolean;
  };
} {
  const user = getAuthUser(context.req);

  if (!user) {
    // Include current URL as redirect query param
    const currentUrl = context.resolvedUrl;
    return {
      user: null,
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(currentUrl)}`,
        permanent: false,
      },
    };
  }

  return { user };
}
