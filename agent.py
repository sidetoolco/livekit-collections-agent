import asyncio
import logging
from typing import Annotated
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli, llm, stt, tts, vad
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import openai, silero, deepgram

logger = logging.getLogger("voice-assistant")
logger.setLevel(logging.INFO)


class AssistantFunction(agents.llm.FunctionContext):
    """Define custom functions that the assistant can call"""
    
    @agents.llm.ai_callable()
    async def get_weather(
        self,
        location: Annotated[str, agents.llm.TypeInfo(description="The location to get weather for")],
    ):
        """Get the current weather for a location"""
        # This is a mock function - replace with actual weather API
        return f"The weather in {location} is sunny and 72°F"
    
    @agents.llm.ai_callable()
    async def schedule_appointment(
        self,
        date: Annotated[str, agents.llm.TypeInfo(description="The date for the appointment")],
        time: Annotated[str, agents.llm.TypeInfo(description="The time for the appointment")],
        description: Annotated[str, agents.llm.TypeInfo(description="Description of the appointment")],
    ):
        """Schedule an appointment"""
        return f"Appointment scheduled for {date} at {time}: {description}"


async def entrypoint(ctx: JobContext):
    """Main entry point for the agent"""
    
    # Initialize the room and participant
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    
    # Wait for the first participant to connect
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant {participant.identity} connected")
    
    # Configure the LLM with system prompt
    initial_ctx = llm.ChatContext()
    initial_ctx.messages.append(
        llm.ChatMessage.create(
            role="system",
            text="""You are a helpful AI assistant powered by LiveKit. 
            You can help with various tasks including:
            - Answering questions
            - Providing information
            - Scheduling appointments
            - Getting weather updates
            - Having natural conversations
            
            Be friendly, concise, and helpful. Always maintain a professional tone."""
        )
    )
    
    # Set up the voice assistant with plugins
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),  # Voice Activity Detection
        stt=deepgram.STT(
            model="nova-2",
            language="en",
        ),  # Speech-to-Text
        llm=openai.LLM(
            model="gpt-4o-mini",
            temperature=0.7,
        ),  # Language Model
        tts=openai.TTS(
            model="tts-1",
            voice="alloy",
            speed=1.0,
        ),  # Text-to-Speech
        chat_ctx=initial_ctx,
        fnc_ctx=AssistantFunction(),  # Custom functions
        interrupt_min_words=2,  # Allow interruption after 2 words
    )
    
    # Start the assistant for the participant
    assistant.start(ctx.room, participant)
    
    # Handle function calls from the assistant
    @assistant.on("function_calls_finished")
    def on_function_calls_finished(called_functions: list[agents.llm.CalledFunction]):
        """Log when functions are called"""
        for func in called_functions:
            logger.info(f"Function called: {func.function_info.name} with result: {func.result}")
    
    # Log user transcriptions
    @assistant.on("user_speech_committed")
    def on_user_speech_committed(msg: llm.ChatMessage):
        """Log what the user said"""
        logger.info(f"User: {msg.content}")
    
    # Log assistant responses
    @assistant.on("agent_speech_committed")
    def on_agent_speech_committed(msg: llm.ChatMessage):
        """Log what the assistant said"""
        logger.info(f"Assistant: {msg.content}")
    
    # Handle metrics
    @assistant.on("metrics_collected")
    def on_metrics_collected(metrics: agents.metrics.AssistantMetrics):
        """Log performance metrics"""
        logger.info(f"Metrics - TTF: {metrics.ttf:.2f}s, Processing: {metrics.processing_time:.2f}s")
    
    # Say hello when the assistant is ready
    await assistant.say("Hello! I'm your AI assistant. How can I help you today?", allow_interruptions=True)


if __name__ == "__main__":
    # Run the agent
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=None,  # Will use LIVEKIT_API_KEY env var
            api_secret=None,  # Will use LIVEKIT_API_SECRET env var
            ws_url=None,  # Will use LIVEKIT_URL env var
        )
    )