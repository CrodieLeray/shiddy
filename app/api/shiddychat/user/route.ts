import { NextRequest, NextResponse } from 'next/server';
import SupabaseManager from '@/lib/supabase';

// GET - Get or create user session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Return basic session info
    return NextResponse.json({
      sessionId,
      needsUsername: true
    });

  } catch (error) {
    console.error('Error in ShiddyChat user GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Set/update username
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, username, userColor } = body;

    if (!sessionId || !username) {
      return NextResponse.json(
        { error: 'Session ID and username required' },
        { status: 400 }
      );
    }

    // Validate username
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters' },
        { status: 400 }
      );
    }

    const user = await SupabaseManager.getOrCreateUser(
      sessionId,
      username,
      userColor || '#000080'
    );

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error in ShiddyChat user POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update username only
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, username } = body;

    if (!sessionId || !username) {
      return NextResponse.json(
        { error: 'Session ID and username required' },
        { status: 400 }
      );
    }

    await SupabaseManager.updateUsername(sessionId, username);

    return NextResponse.json({
      success: true,
      username
    });

  } catch (error) {
    console.error('Error in ShiddyChat user PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
