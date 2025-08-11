import { NextRequest, NextResponse } from 'next/server';
import SupabaseManager from '@/lib/supabase';

// GET - Get recent messages for a room
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName') || 'Global Shiddy Board';
    const limit = parseInt(searchParams.get('limit') || '100');

    const messages = await SupabaseManager.getRecentMessages(roomName, limit);

    return NextResponse.json({
      success: true,
      messages,
      roomName
    });

  } catch (error) {
    console.error('Error in ShiddyChat messages GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Save a new message (text, drawing, or both)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sessionId, 
      username, 
      userColor, 
      roomName = 'Global Shiddy Board',
      messageText,
      drawingData 
    } = body;

    // Validation
    if (!sessionId || !username) {
      return NextResponse.json(
        { error: 'Session ID and username are required' },
        { status: 400 }
      );
    }

    if (!messageText && !drawingData) {
      return NextResponse.json(
        { error: 'Either message text or drawing data is required' },
        { status: 400 }
      );
    }

    // Save message to database
    const result = await SupabaseManager.saveMessage(
      sessionId,
      username,
      userColor || '#000080',
      roomName,
      messageText,
      drawingData
    );

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error in ShiddyChat messages POST:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}
