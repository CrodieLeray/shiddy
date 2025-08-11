import { NextRequest, NextResponse } from 'next/server';
import DatabaseManager from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

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

    // This would normally get user from database
    // For now, return basic session info
    return NextResponse.json({
      sessionId,
      needsUsername: true
    });

  } catch (error) {
    console.error('Error in user GET:', error);
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

    const user = await DatabaseManager.getOrCreateUser(
      sessionId,
      username,
      userColor || '#000080'
    );

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error in user POST:', error);
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

    await DatabaseManager.updateUsername(sessionId, username);

    return NextResponse.json({
      success: true,
      username
    });

  } catch (error) {
    console.error('Error in user PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
