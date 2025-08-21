import asyncio
import logging
import os
import json
from typing import Dict, Any, Optional
from datetime import datetime
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli, llm, stt, tts, vad
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import openai, silero, deepgram

logger = logging.getLogger("outbound-collections")
logger.setLevel(logging.INFO)


class OutboundCollectionsAssistant(agents.llm.FunctionContext):
    """Functions for outbound collection calls"""
    
    def __init__(self, customer_info: Dict[str, Any]):
        super().__init__()
        self.customer_info = customer_info
        self.call_outcome = {
            "payment_secured": False,
            "arrangement_made": False,
            "callback_scheduled": False,
            "amount_collected": 0,
            "notes": []
        }
    
    @agents.llm.ai_callable()
    async def confirm_speaking_with_customer(
        self,
        confirmed: bool,
        reason: Optional[str] = None
    ) -> str:
        """Confirm we're speaking with the right person"""
        if confirmed:
            self.call_outcome["notes"].append("Identity confirmed")
            return "Identity confirmed. Proceeding with collection discussion."
        else:
            self.call_outcome["notes"].append(f"Wrong party: {reason}")
            return "Unable to confirm identity. Call will be terminated."
    
    @agents.llm.ai_callable()
    async def offer_payment_options(self) -> str:
        """Present payment options based on the amount owed"""
        amount = self.customer_info.get("amountOwed", 0)
        
        options = f"""Based on your balance of ${amount:.2f}, I can offer you several options:
        
        1. Pay in full today with a 10% discount: ${amount * 0.9:.2f}
        2. Split into 3 monthly payments of ${amount / 3:.2f}
        3. Split into 6 monthly payments of ${amount / 6:.2f}
        4. Make a partial payment today of any amount you can afford
        5. Discuss a hardship program if you're experiencing financial difficulties
        
        Which option works best for your current situation?"""
        
        self.call_outcome["notes"].append("Payment options presented")
        return options
    
    @agents.llm.ai_callable()
    async def process_payment_commitment(
        self,
        payment_type: str,
        amount: float,
        payment_date: str,
        payment_method: str = "not specified"
    ) -> str:
        """Record a payment commitment from the customer"""
        self.call_outcome["payment_secured"] = True
        self.call_outcome["amount_collected"] = amount
        self.call_outcome["notes"].append(
            f"Payment commitment: {payment_type} - ${amount} on {payment_date} via {payment_method}"
        )
        
        confirmation = f"""Perfect! I've recorded your commitment to pay ${amount:.2f} on {payment_date}.
        You'll receive a confirmation email shortly with all the details.
        Your confirmation number is: CONF-{datetime.now().strftime('%Y%m%d%H%M%S')}"""
        
        return confirmation
    
    @agents.llm.ai_callable()
    async def schedule_callback(
        self,
        date: str,
        time: str,
        reason: str
    ) -> str:
        """Schedule a callback if customer can't commit now"""
        self.call_outcome["callback_scheduled"] = True
        self.call_outcome["notes"].append(f"Callback scheduled: {date} at {time} - {reason}")
        
        return f"I've scheduled a callback for {date} at {time}. We'll discuss {reason} then."
    
    @agents.llm.ai_callable()
    async def handle_dispute(
        self,
        dispute_reason: str
    ) -> str:
        """Handle when customer disputes the debt"""
        self.call_outcome["notes"].append(f"Customer disputes: {dispute_reason}")
        
        return """I understand you're disputing this balance. I'll make a note of your concern 
        and have our disputes department review your account. You should receive a response 
        within 5 business days. Is there anything else you'd like me to note about this dispute?"""
    
    @agents.llm.ai_callable()
    async def end_call_summary(self) -> str:
        """Generate a summary of the call outcome"""
        summary = {
            "customer": self.customer_info.get("customerName"),
            "amount_owed": self.customer_info.get("amountOwed"),
            "outcome": self.call_outcome
        }
        
        logger.info(f"Call summary: {json.dumps(summary, indent=2)}")
        return json.dumps(summary)


async def entrypoint(ctx: JobContext):
    """Main entry point for outbound collection calls"""
    
    # Connect to the room
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    
    # Get customer info from room metadata
    room = ctx.room
    metadata = json.loads(room.metadata) if room.metadata else {}
    
    customer_info = {
        "phoneNumber": metadata.get("phoneNumber", "Unknown"),
        "customerName": metadata.get("customerName", "Customer"),
        "amountOwed": float(metadata.get("amountOwed", 0)),
        "paymentDueDate": metadata.get("paymentDueDate", datetime.now().strftime("%Y-%m-%d"))
    }
    
    logger.info(f"Initiating outbound call to {customer_info['phoneNumber']} for {customer_info['customerName']}")
    
    # Create system prompt based on customer info
    # Calculate days until payment due
    due_date = datetime.strptime(customer_info['paymentDueDate'], "%Y-%m-%d")
    today = datetime.now()
    days_until_due = (due_date - today).days
    
    system_prompt = f"""You are a professional debt collection agent making an outbound call.
    
    Customer Information:
    - Name: {customer_info['customerName']}
    - Amount Owed: ${customer_info['amountOwed']:.2f}
    - Payment Due Date: {customer_info['paymentDueDate']} ({days_until_due} days from now)
    
    Your objectives:
    1. Confirm you're speaking with {customer_info['customerName']}
    2. Remind them about the payment of ${customer_info['amountOwed']:.2f} due on {customer_info['paymentDueDate']}
    3. Understand their ability to make the payment on time
    4. If they can't pay by the due date, offer alternative arrangements
    5. Secure a firm commitment for payment
    6. If unable to commit, understand why and schedule follow-up
    
    Guidelines:
    - Be professional but empathetic
    - Focus on the upcoming due date
    - Never threaten or use aggressive language
    - Comply with FDCPA regulations
    - Listen to their situation before offering solutions
    - Document the outcome of the call
    
    Start the conversation by introducing yourself and confirming their identity."""
    
    initial_ctx = llm.ChatContext()
    initial_ctx.messages.append(
        llm.ChatMessage.create(role="system", text=system_prompt)
    )
    
    # Configure the voice assistant
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=deepgram.STT(
            model="nova-2",
            language="en",
            smart_format=True,
        ),
        llm=openai.LLM(
            model="gpt-4o-mini",
            temperature=0.5,
        ),
        tts=openai.TTS(
            model="tts-1",
            voice="nova",
            speed=1.0,
        ),
        chat_ctx=initial_ctx,
        fnc_ctx=OutboundCollectionsAssistant(customer_info),
        interrupt_min_words=2,
    )
    
    # Wait for participant (the person being called)
    participant = await ctx.wait_for_participant()
    logger.info(f"Call connected with {participant.identity}")
    
    # Start the assistant
    assistant.start(ctx.room, participant)
    
    # Track call metrics
    call_start = datetime.now()
    
    @assistant.on("user_speech_committed")
    def on_user_speech(msg: llm.ChatMessage):
        logger.info(f"Customer: {msg.content}")
    
    @assistant.on("agent_speech_committed")  
    def on_agent_speech(msg: llm.ChatMessage):
        logger.info(f"Agent: {msg.content}")
    
    @assistant.on("function_calls_finished")
    def on_functions_called(called_functions: list[agents.llm.CalledFunction]):
        for func in called_functions:
            logger.info(f"Function called: {func.function_info.name}")
    
    # Initial greeting
    await assistant.say(
        f"Hello, this is Sarah calling from Financial Services regarding your upcoming payment of "
        f"${customer_info['amountOwed']:.2f} due on {customer_info['paymentDueDate']}. "
        f"May I please speak with {customer_info['customerName']}?",
        allow_interruptions=True
    )
    
    # Handle call end
    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant: rtc.RemoteParticipant):
        call_duration = (datetime.now() - call_start).total_seconds()
        logger.info(f"Call ended - Duration: {call_duration:.0f}s")
        
        # Generate final summary
        assistant.fnc_ctx.end_call_summary()


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=os.getenv("LIVEKIT_API_KEY"),
            api_secret=os.getenv("LIVEKIT_API_SECRET"),
            ws_url=os.getenv("LIVEKIT_URL"),
        )
    )