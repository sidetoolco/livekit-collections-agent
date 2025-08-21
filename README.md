# LiveKit Voice Assistant Agent

A production-ready voice assistant agent for LiveKit Cloud that provides real-time conversational AI capabilities with speech recognition, natural language understanding, and text-to-speech.

## Features

- **Real-time Voice Interaction**: Low-latency voice conversations with automatic speech detection
- **Multi-Provider Support**: Uses best-in-class providers for each component:
  - **STT**: Deepgram Nova-2 for accurate speech recognition
  - **LLM**: OpenAI GPT-4 for intelligent responses
  - **TTS**: OpenAI TTS for natural-sounding voice output
  - **VAD**: Silero for voice activity detection
- **Custom Functions**: Extensible with custom functions (weather, scheduling, etc.)
- **Interruption Handling**: Natural conversation flow with interruption support
- **Production Ready**: Configured for deployment on LiveKit Cloud with auto-scaling

## Prerequisites

1. **LiveKit Cloud Account**: Sign up at [cloud.livekit.io](https://cloud.livekit.io)
2. **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com)
3. **Deepgram API Key**: Get from [deepgram.com](https://deepgram.com)
4. **LiveKit CLI**: Install with `brew install livekit-cli` (macOS) or see [docs](https://docs.livekit.io/home/cli/)

## Setup

### 1. Install Dependencies

```bash
cd livekit-agent
pip install -r requirements.txt
```

### 2. Configure Environment

Update the `.env` file with your credentials:

```env
LIVEKIT_URL=wss://sidetool-lavdxo0f.livekit.cloud
LIVEKIT_API_KEY=APIondoXCavRYQd
LIVEKIT_API_SECRET=your_secret_here  # Get from LiveKit Cloud dashboard

OPENAI_API_KEY=sk-...  # Your OpenAI API key
DEEPGRAM_API_KEY=...   # Your Deepgram API key
```

### 3. Test Locally

Run the agent locally to test:

```bash
python agent.py dev
```

This starts the agent in development mode. You can test it using:
- LiveKit Meet: [meet.livekit.io](https://meet.livekit.io)
- Generate a test token: `lk token create --join --room test_room --identity test_user`

## Deploy to LiveKit Cloud

### 1. Authenticate with LiveKit Cloud

```bash
lk cloud auth
```

### 2. Deploy the Agent

```bash
# Deploy the agent
lk agent deploy --file agent.yaml

# Or deploy with watch mode for auto-reload on changes
lk agent deploy --file agent.yaml --watch
```

### 3. View Logs

```bash
# Stream agent logs
lk agent logs --follow

# View recent logs
lk agent logs --tail 100
```

### 4. Manage Deployment

```bash
# List all agent deployments
lk agent list

# Get agent status
lk agent status sidetool-voice-assistant

# Scale the agent
lk agent scale sidetool-voice-assistant --min 2 --max 20

# Roll back to previous version
lk agent rollback sidetool-voice-assistant

# Delete the agent
lk agent delete sidetool-voice-assistant
```

## Testing the Deployed Agent

### Option 1: LiveKit Meet

1. Go to [meet.livekit.io](https://meet.livekit.io)
2. Click "Custom" tab
3. Generate a token:
   ```bash
   lk token create \
     --api-key APIondoXCavRYQd \
     --api-secret your_secret_here \
     --join --room test_room --identity user1 \
     --valid-for 24h
   ```
4. Paste the token and connect
5. The agent will automatically join and greet you

### Option 2: CLI Testing

```bash
# Join as a test participant with demo video
lk room join \
  --url wss://sidetool-lavdxo0f.livekit.cloud \
  --api-key APIondoXCavRYQd \
  --api-secret your_secret_here \
  --room test_room \
  --identity cli_user \
  --publish-demo
```

## Customization

### Add Custom Functions

Edit `agent.py` to add new functions in the `AssistantFunction` class:

```python
@agents.llm.ai_callable()
async def your_custom_function(
    self,
    param: Annotated[str, agents.llm.TypeInfo(description="Parameter description")],
):
    """Function description for the LLM"""
    # Your implementation here
    return f"Result: {param}"
```

### Modify System Prompt

Update the system prompt in `agent.py` to customize the assistant's personality and capabilities:

```python
initial_ctx.messages.append(
    llm.ChatMessage.create(
        role="system",
        text="Your custom system prompt here..."
    )
)
```

### Change Voice Settings

Modify TTS settings in `agent.py`:

```python
tts=openai.TTS(
    model="tts-1-hd",  # or "tts-1" for lower latency
    voice="nova",       # Options: alloy, echo, fable, onyx, nova, shimmer
    speed=1.2,          # 0.25 to 4.0
)
```

## Monitoring

### LiveKit Cloud Dashboard

Monitor your agent at: [cloud.livekit.io/projects](https://cloud.livekit.io/projects)

- View active sessions
- Monitor resource usage
- Check quality metrics
- Review session analytics

### Metrics Available

- **Session Start Latency**: Time to first response
- **TTF (Time to First byte)**: Response generation speed
- **Processing Time**: Total processing duration
- **Session Duration**: Length of conversations
- **Resource Usage**: CPU and memory consumption

## Pricing

LiveKit Cloud charges $0.01 per agent session minute. This includes:
- Hosting across global data centers
- Unlimited data transfer
- Auto-scaling
- Monitoring and analytics

## Troubleshooting

### Common Issues

1. **Agent not responding**: Check API keys in `.env` file
2. **High latency**: Ensure you're using the nearest LiveKit region
3. **Connection issues**: Verify firewall allows WebSocket connections
4. **Audio quality**: Check network bandwidth and latency

### Debug Mode

Run locally with debug logging:

```bash
LOG_LEVEL=DEBUG python agent.py dev
```

## Resources

- [LiveKit Documentation](https://docs.livekit.io)
- [LiveKit Agents Framework](https://docs.livekit.io/agents)
- [LiveKit Cloud Dashboard](https://cloud.livekit.io)
- [LiveKit Community Slack](https://livekit.io/slack)

## License

This agent is provided as a template for your LiveKit Cloud deployment.