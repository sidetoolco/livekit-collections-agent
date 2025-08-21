# Collections Agent Deployment Guide

## Overview
This is a complete collections platform with:
- **AI Voice Agent**: LiveKit-powered collections agent with natural conversation
- **Web Portal**: Next.js frontend for self-service payments
- **Vercel Deployment**: Scalable web hosting
- **LiveKit Cloud**: Agent hosting and orchestration

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Vercel Web    │────▶│  LiveKit Cloud   │────▶│  Python Agent   │
│   (Next.js)     │     │   (WebRTC)       │     │  (Collections)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                                 │
        ▼                                                 ▼
┌─────────────────┐                          ┌─────────────────┐
│   Payment API   │                          │   AI Services   │
│  (Stripe/etc)   │                          │ (OpenAI/Deepgram)│
└─────────────────┘                          └─────────────────┘
```

## Step 1: Deploy Agent to LiveKit Cloud

### Prerequisites
- LiveKit Cloud account
- OpenAI API key
- Deepgram API key

### Deploy Agent

1. **Install dependencies locally**:
```bash
cd livekit-agent
pip install -r requirements.txt
```

2. **Configure environment**:
```bash
# Update .env with your actual credentials
LIVEKIT_URL=wss://sidetool-lavdxo0f.livekit.cloud
LIVEKIT_API_KEY=APIondoXCavRYQd
LIVEKIT_API_SECRET=your_actual_secret
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
```

3. **Test agent locally**:
```bash
python agent_collections.py dev
```

4. **Deploy to LiveKit Cloud**:
```bash
# Authenticate
lk cloud auth

# Deploy agent
lk agent deploy \
  --name collections-agent \
  --entrypoint agent_collections:entrypoint \
  --requirements requirements.txt

# Monitor deployment
lk agent logs collections-agent --follow
```

## Step 2: Deploy Web App to Vercel

### Prerequisites
- Vercel account
- GitHub repository

### Setup

1. **Push code to GitHub**:
```bash
git init
git add .
git commit -m "Initial collections platform"
git remote add origin your-repo-url
git push -u origin main
```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the `livekit-agent` directory as root

3. **Configure Environment Variables** in Vercel Dashboard:
```
NEXT_PUBLIC_LIVEKIT_URL=wss://sidetool-lavdxo0f.livekit.cloud
LIVEKIT_API_KEY=APIondoXCavRYQd
LIVEKIT_API_SECRET=your_secret
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
STRIPE_PUBLISHABLE_KEY=pk_...  # Optional
STRIPE_SECRET_KEY=sk_...       # Optional
```

4. **Deploy**:
```bash
vercel --prod
```

## Step 3: Configure Production Database

Replace mock data with real database:

### Option A: Supabase (Recommended)
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
```

### Option B: Prisma with PostgreSQL
```bash
npm install prisma @prisma/client
npx prisma init
```

## Step 4: Payment Integration

### Stripe Setup
1. Create Stripe account
2. Get API keys from dashboard
3. Update environment variables
4. Test webhook endpoints

### Payment Processing
```typescript
// app/api/payments/process/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { amount, paymentMethodId } = await req.json();
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    payment_method: paymentMethodId,
    confirm: true,
  });
  
  return Response.json({ success: true, paymentIntent });
}
```

## Step 5: Monitoring & Analytics

### LiveKit Cloud Dashboard
- View active sessions
- Monitor agent performance
- Check error logs
- Track usage metrics

### Vercel Analytics
```bash
npm install @vercel/analytics
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Testing

### Test Accounts
- SSN: 1234 (John Doe - $2,500 balance)
- SSN: 5678 (Jane Smith - $1,200 balance)
- DOB: Any valid date

### Test Payment Cards
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Requires Auth: 4000 0025 0000 3155

## Security Considerations

1. **API Keys**: Never commit to repository
2. **CORS**: Configure allowed origins
3. **Rate Limiting**: Implement on API routes
4. **PCI Compliance**: Use Stripe Elements
5. **FDCPA Compliance**: Built into agent prompts

## Deployment Commands

### Quick Deploy
```bash
# Deploy agent
lk agent deploy --name collections-agent

# Deploy web app
vercel --prod

# View logs
lk agent logs collections-agent --tail 100
vercel logs
```

### Rollback
```bash
# Rollback agent
lk agent rollback collections-agent

# Rollback Vercel
vercel rollback
```

## Costs

### LiveKit Cloud
- $0.01 per agent session minute
- Includes hosting, scaling, monitoring

### Vercel
- Free tier: 100GB bandwidth
- Pro: $20/month for team features

### AI Services
- OpenAI: ~$0.002 per minute (GPT-4o-mini)
- Deepgram: ~$0.0043 per minute

### Total Cost per Minute
~$0.02 per active collection call

## Support

- LiveKit Discord: [livekit.io/discord](https://livekit.io/discord)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- GitHub Issues: Your repository

## Next Steps

1. **Add Authentication**: Implement proper user auth
2. **Enhance Analytics**: Add conversion tracking
3. **A/B Testing**: Test different agent personalities
4. **Multi-language**: Add Spanish support
5. **SMS Integration**: Add text messaging channel
6. **Email Campaigns**: Automated follow-ups
7. **Compliance Reporting**: FDCPA audit logs