import { NextResponse } from 'next/server';

// Google OAuth is not yet configured. This route is a stub so the build
// doesn't fail. Re-enable NextAuth here once GOOGLE_CLIENT_ID and
// GOOGLE_CLIENT_SECRET are available.
export async function GET() {
  return NextResponse.json({ error: 'OAuth not configured' }, { status: 503 });
}
export async function POST() {
  return NextResponse.json({ error: 'OAuth not configured' }, { status: 503 });
}
