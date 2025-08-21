# Outbound Collections Agent

A simple, powerful interface for initiating AI-powered collection calls. No authentication required - just enter the customer details and start the call.

## Features

- **Simple Interface**: Just enter phone number, name, and amount owed
- **Outbound Calling**: Agent calls the customer directly
- **FDCPA Compliant**: Professional, empathetic collection approach
- **Real-time Tracking**: Monitor call status and outcomes
- **No Login Required**: Direct access to collection tools

## How It Works

1. **Enter Customer Details**:
   - Phone number
   - Customer name  
   - Amount owed
   - Days overdue (optional)

2. **Initiate Call**:
   - Click "Start Collection Call"
   - Agent automatically calls the customer
   - Call is recorded and monitored

3. **Agent Conversation**:
   - Confirms identity
   - Discusses outstanding balance
   - Offers payment options
   - Attempts to secure payment commitment
   - Documents call outcome

## Quick Start

### 1. Set Environment Variables

```env
NEXT_PUBLIC_LIVEKIT_URL=[your-livekit-url]
LIVEKIT_API_KEY=[your-api-key]
LIVEKIT_API_SECRET=[your-api-secret]
OPENAI_API_KEY=[your-openai-key]
DEEPGRAM_API_KEY=[your-deepgram-key]

# For actual phone calls (optional)
TWILIO_ACCOUNT_SID=[your-twilio-sid]
TWILIO_AUTH_TOKEN=[your-twilio-token]
TWILIO_PHONE_NUMBER=[your-twilio-number]
```

### 2. Install Dependencies

```bash
npm install
pip install -r requirements.txt
```

### 3. Run the Web Interface

```bash
npm run dev
# Visit http://localhost:3000
```

### 4. Run the Agent

```bash
python agent_outbound.py dev
```

## Production Deployment

### Deploy to Vercel

```bash
vercel --prod
```

### Deploy Agent to LiveKit Cloud

```bash
lk agent deploy --name outbound-collections --entrypoint agent_outbound:entrypoint
```

## SIP Integration (For Real Phone Calls)

To make actual phone calls, you need to configure LiveKit SIP:

### Option 1: LiveKit SIP (Recommended)

1. Enable SIP in LiveKit Cloud
2. Configure SIP trunk with your provider
3. Update the initiate-call API to use SIP

### Option 2: Twilio Integration

```typescript
// app/api/collections/initiate-call/route.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Create call
const call = await client.calls.create({
  to: phoneNumber,
  from: process.env.TWILIO_PHONE_NUMBER,
  url: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/twiml`,
  statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/status`,
});
```

## API Endpoints

### POST /api/collections/initiate-call
Initiates an outbound collection call.

**Request:**
```json
{
  "phoneNumber": "5551234567",
  "customerName": "John Doe",
  "amountOwed": 2500.00,
  "daysOverdue": 45
}
```

**Response:**
```json
{
  "callId": "CALL-1234567890",
  "roomName": "call-1234567890-5551234567",
  "status": "initiating"
}
```

### GET /api/collections/status?room=call-xxx
Gets the status of an active call.

## Agent Conversation Flow

1. **Introduction & Verification**
   - "Hello, this is Sarah calling from Financial Services..."
   - Confirms identity

2. **Balance Discussion**
   - States outstanding balance
   - Explains days overdue

3. **Payment Options**
   - Pay in full with discount
   - Payment plans (3, 6, 12 months)
   - Partial payment
   - Hardship programs

4. **Commitment**
   - Secures payment promise
   - Provides confirmation number
   - Schedules follow-up if needed

5. **Documentation**
   - Records call outcome
   - Notes payment commitments
   - Logs disputes or issues

## Compliance

The agent follows FDCPA guidelines:
- No threats or harassment
- Professional language only
- Proper identification
- Accurate information
- Respects cease communication requests

## Monitoring

View real-time metrics:
- Call duration
- Connection status
- Agent responses
- Customer commitments
- Call outcomes

## Cost

- LiveKit Cloud: $0.01/minute
- OpenAI: ~$0.002/minute
- Deepgram: ~$0.004/minute
- Twilio (if used): ~$0.013/minute
- **Total: ~$0.03/minute**

## Security

- All calls are encrypted
- No customer data stored locally
- PCI compliant for payment processing
- HIPAA compliant infrastructure available

## Support

For issues or questions:
- LiveKit Discord: [livekit.io/discord](https://livekit.io/discord)
- GitHub Issues: [Create an issue](https://github.com/sidetoolco/livekit-collections-agent/issues)