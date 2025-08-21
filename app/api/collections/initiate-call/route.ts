import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, customerName, amountOwed, accountNumber, daysOverdue } = await request.json();

    // Validate required fields
    if (!phoneNumber || !customerName || !amountOwed) {
      return NextResponse.json(
        { error: 'Phone number, customer name, and amount are required' },
        { status: 400 }
      );
    }

    // Initialize LiveKit Room Service
    const roomService = new RoomServiceClient(
      process.env.NEXT_PUBLIC_LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    // Create a unique room for this call
    const roomName = `call-${Date.now()}-${phoneNumber}`;
    const callId = `CALL-${Date.now()}`;

    // Create room with metadata
    await roomService.createRoom({
      name: roomName,
      metadata: JSON.stringify({
        callId,
        phoneNumber,
        customerName,
        amountOwed,
        accountNumber: accountNumber || `ACC-${Date.now()}`,
        daysOverdue: daysOverdue || 30,
        callType: 'outbound_collection',
        initiatedAt: new Date().toISOString(),
      }),
    });

    // In production, this would trigger:
    // 1. SIP call to the phone number via LiveKit SIP bridge
    // 2. Agent joins the room automatically
    // 3. Call recording starts
    
    // For now, we'll simulate the call initiation
    const callData = {
      callId,
      roomName,
      phoneNumber,
      customerName,
      amountOwed,
      accountNumber: accountNumber || `ACC-${Date.now()}`,
      status: 'initiating',
      message: 'Call is being connected. Agent will join automatically.',
    };

    // In production, you would:
    // 1. Use Twilio/LiveKit SIP to make the actual phone call
    // 2. Bridge the PSTN call to the LiveKit room
    // 3. Have the agent join the room programmatically

    // Log call initiation
    console.log('Initiating collection call:', callData);

    return NextResponse.json(callData);
  } catch (error) {
    console.error('Error initiating call:', error);
    return NextResponse.json(
      { error: 'Failed to initiate call' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}