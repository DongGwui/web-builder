import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 기본적으로 모든 요청을 허용
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
}; 