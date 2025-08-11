import { NextRequest, NextResponse } from 'next/server';
import SupabaseManager from '@/lib/supabase';

// GET - Get room statistics (active users, etc.)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName') || 'Global Shiddy Board';

    const activeUsersCount = await SupabaseManager.getActiveUsersCount();

    return NextResponse.json({
      success: true,
      stats: {
        activeUsers: activeUsersCount,
        roomName
      }
    });

  } catch (error) {
    console.error('Error in stats GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
