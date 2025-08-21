import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('room');
    
    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Initialize LiveKit Room Service
    const roomService = new RoomServiceClient(
      process.env.NEXT_PUBLIC_LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    try {
      // Get room info
      const rooms = await roomService.listRooms([roomName]);
      const room = rooms[0];
      
      if (!room) {
        throw new Error('Room not found');
      }
      
      const participants = await roomService.listParticipants(roomName);
      
      // Parse metadata
      const metadata = room.metadata ? JSON.parse(room.metadata) : {};
      
      // Determine call status
      let status = 'unknown';
      if (participants.length > 1) {
        status = 'connected';
      } else if (participants.length === 1) {
        status = 'waiting';
      } else if (room.creationTime) {
        status = 'initiating';
      }
      
      return NextResponse.json({
        status,
        room: {
          name: room.name,
          sid: room.sid,
          createdAt: room.creationTime,
          participantCount: participants.length,
        },
        metadata,
        participants: participants.map(p => ({
          identity: p.identity,
          name: p.name,
          joinedAt: p.joinedAt,
        })),
      });
    } catch (error) {
      // Room might not exist yet or call ended
      return NextResponse.json({
        status: 'not_found',
        message: 'Call not found or has ended',
      });
    }
  } catch (error) {
    console.error('Error getting call status:', error);
    return NextResponse.json(
      { error: 'Failed to get call status' },
      { status: 500 }
    );
  }
}