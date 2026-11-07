import { NextResponse, type NextRequest } from "next/server";
import { VIEW_COOKIE } from "@/lib/view";

/** /view?mode=simple|full — remember the choice on this device and go there. */
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode") === "full" ? "full" : "simple";
  const res = NextResponse.redirect(new URL(mode === "full" ? "/" : "/ahmed", request.url), { status: 303 });
  res.cookies.set(VIEW_COOKIE, mode, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true });
  return res;
}
