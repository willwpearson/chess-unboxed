import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: Date.now(),
      version: '1.0.0',
    },
    timestamp: Date.now(),
  });
}
