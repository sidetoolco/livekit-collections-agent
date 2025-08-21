import asyncio
import logging
from typing import Annotated, Optional, Dict, Any
from datetime import datetime, timedelta
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli, llm, stt, tts, vad
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import openai, silero, deepgram
import json
import os

logger = logging.getLogger("collections-agent")
logger.setLevel(logging.INFO)


class CollectionsAssistant(agents.llm.FunctionContext):
    """Collections-specific functions for debt recovery and payment processing"""
    
    def __init__(self):
        super().__init__()
        # In production, this would connect to your database
        self.mock_db = {
            "accounts": {},
            "payment_plans": {},
            "transactions": []
        }
    
    @agents.llm.ai_callable()
    async def verify_account(
        self,
        account_number: Annotated[str, agents.llm.TypeInfo(description="Account number or last 4 digits of SSN")],
        date_of_birth: Annotated[str, agents.llm.TypeInfo(description="Date of birth in MM/DD/YYYY format")],
    ) -> str:
        """Verify customer identity and retrieve account information"""
        # Mock verification - replace with actual database lookup
        return json.dumps({
            "verified": True,
            "account_number": account_number,
            "balance": 2500.00,
            "past_due": 450.00,
            "days_overdue": 45,
            "last_payment_date": "2024-06-15",
            "minimum_payment": 150.00
        })
    
    @agents.llm.ai_callable()
    async def get_payment_options(
        self,
        balance: Annotated[float, agents.llm.TypeInfo(description="Current balance owed")],
        monthly_income: Annotated[Optional[float], agents.llm.TypeInfo(description="Customer's monthly income if provided")] = None,
    ) -> str:
        """Generate payment plan options based on balance and customer situation"""
        options = []
        
        # Full payment option
        options.append({
            "type": "full_payment",
            "amount": balance,
            "description": "Pay in full today with 10% discount",
            "discount": balance * 0.10,
            "final_amount": balance * 0.90
        })
        
        # Payment plan options
        for months in [3, 6, 12]:
            monthly_payment = balance / months
            options.append({
                "type": "payment_plan",
                "months": months,
                "monthly_payment": round(monthly_payment, 2),
                "total_amount": balance,
                "description": f"{months}-month payment plan"
            })
        
        # Settlement option
        options.append({
            "type": "settlement",
            "amount": balance * 0.60,
            "description": "One-time settlement offer",
            "savings": balance * 0.40
        })
        
        return json.dumps(options)
    
    @agents.llm.ai_callable()
    async def process_payment(
        self,
        amount: Annotated[float, agents.llm.TypeInfo(description="Payment amount")],
        payment_method: Annotated[str, agents.llm.TypeInfo(description="Payment method: card, ach, or phone")],
        payment_details: Annotated[Dict[str, str], agents.llm.TypeInfo(description="Payment details like card number or account info")],
    ) -> str:
        """Process a payment or set up a payment arrangement"""
        # Mock payment processing - integrate with actual payment gateway
        transaction_id = f"TXN-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        result = {
            "success": True,
            "transaction_id": transaction_id,
            "amount": amount,
            "method": payment_method,
            "processed_at": datetime.now().isoformat(),
            "confirmation_number": f"CONF-{hash(transaction_id) % 1000000:06d}"
        }
        
        # Log transaction
        self.mock_db["transactions"].append(result)
        
        return json.dumps(result)
    
    @agents.llm.ai_callable()
    async def setup_payment_plan(
        self,
        total_amount: Annotated[float, agents.llm.TypeInfo(description="Total amount owed")],
        months: Annotated[int, agents.llm.TypeInfo(description="Number of months for payment plan")],
        first_payment_date: Annotated[str, agents.llm.TypeInfo(description="First payment date in MM/DD/YYYY format")],
        auto_pay: Annotated[bool, agents.llm.TypeInfo(description="Whether to set up autopay")] = False,
    ) -> str:
        """Set up a payment plan arrangement"""
        monthly_payment = round(total_amount / months, 2)
        plan_id = f"PLAN-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        payment_plan = {
            "plan_id": plan_id,
            "total_amount": total_amount,
            "months": months,
            "monthly_payment": monthly_payment,
            "first_payment_date": first_payment_date,
            "auto_pay": auto_pay,
            "status": "active",
            "created_at": datetime.now().isoformat()
        }
        
        self.mock_db["payment_plans"][plan_id] = payment_plan
        
        return json.dumps(payment_plan)
    
    @agents.llm.ai_callable()
    async def send_payment_confirmation(
        self,
        email: Annotated[str, agents.llm.TypeInfo(description="Customer email address")],
        phone: Annotated[Optional[str], agents.llm.TypeInfo(description="Customer phone number for SMS")] = None,
        confirmation_details: Annotated[Dict[str, Any], agents.llm.TypeInfo(description="Payment or plan details to confirm")] = None,
    ) -> str:
        """Send payment confirmation via email and/or SMS"""
        # Mock sending - integrate with actual email/SMS service
        return json.dumps({
            "email_sent": True if email else False,
            "sms_sent": True if phone else False,
            "timestamp": datetime.now().isoformat()
        })
    
    @agents.llm.ai_callable()
    async def check_eligibility_for_hardship(
        self,
        income: Annotated[float, agents.llm.TypeInfo(description="Monthly income")],
        expenses: Annotated[float, agents.llm.TypeInfo(description="Monthly expenses")],
        hardship_reason: Annotated[str, agents.llm.TypeInfo(description="Reason for financial hardship")],
    ) -> str:
        """Check if customer qualifies for hardship program"""
        debt_to_income = (expenses / income) if income > 0 else 1.0
        
        eligible = debt_to_income > 0.8 or "medical" in hardship_reason.lower() or "unemployment" in hardship_reason.lower()
        
        return json.dumps({
            "eligible": eligible,
            "debt_to_income_ratio": debt_to_income,
            "recommended_program": "hardship_payment_plan" if eligible else "standard_payment_plan",
            "discount_available": 0.25 if eligible else 0.10
        })


async def entrypoint(ctx: JobContext):
    """Main entry point for the collections agent"""
    
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    
    participant = await ctx.wait_for_participant()
    logger.info(f"Customer {participant.identity} connected")
    
    # Collections-specific system prompt
    initial_ctx = llm.ChatContext()
    initial_ctx.messages.append(
        llm.ChatMessage.create(
            role="system",
            text="""You are a professional and empathetic collections agent for a financial services company. 
            Your primary goals are to:
            1. Help customers resolve their outstanding balances
            2. Offer flexible payment solutions that work for their situation
            3. Maintain a respectful and understanding tone
            4. Ensure compliance with FDCPA regulations
            
            Key behaviors:
            - Always verify the customer's identity before discussing account details
            - Be empathetic to financial hardships
            - Clearly explain all payment options available
            - Never use threatening language or make false statements
            - Document all payment arrangements accurately
            - Provide confirmation numbers for all transactions
            
            Compliance requirements:
            - Identify yourself and the company at the beginning
            - State that this is an attempt to collect a debt
            - Inform that any information obtained will be used for that purpose
            - Respect requests to cease communication
            - Only call between 8 AM and 9 PM local time
            
            Start by introducing yourself and asking to verify their identity."""
        )
    )
    
    # Configure the voice assistant
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=deepgram.STT(
            model="nova-2",
            language="en",
            smart_format=True,  # Better formatting for numbers and dates
        ),
        llm=openai.LLM(
            model="gpt-4o-mini",
            temperature=0.3,  # Lower temperature for more consistent responses
        ),
        tts=openai.TTS(
            model="tts-1",
            voice="nova",  # Professional, calm voice
            speed=0.95,  # Slightly slower for clarity
        ),
        chat_ctx=initial_ctx,
        fnc_ctx=CollectionsAssistant(),
        interrupt_min_words=2,
        preemptive_synthesis=True,  # Start synthesizing while user is speaking
    )
    
    assistant.start(ctx.room, participant)
    
    # Track call metrics
    call_start = datetime.now()
    payment_collected = False
    arrangement_made = False
    
    @assistant.on("function_calls_finished")
    def on_function_calls_finished(called_functions: list[agents.llm.CalledFunction]):
        nonlocal payment_collected, arrangement_made
        
        for func in called_functions:
            logger.info(f"Function: {func.function_info.name}, Result: {func.result}")
            
            # Track successful outcomes
            if func.function_info.name == "process_payment":
                result = json.loads(func.result)
                if result.get("success"):
                    payment_collected = True
                    logger.info(f"Payment collected: ${result.get('amount')}")
            
            elif func.function_info.name == "setup_payment_plan":
                arrangement_made = True
                logger.info("Payment arrangement established")
    
    @assistant.on("user_speech_committed")
    def on_user_speech_committed(msg: llm.ChatMessage):
        logger.info(f"Customer: {msg.content}")
    
    @assistant.on("agent_speech_committed")
    def on_agent_speech_committed(msg: llm.ChatMessage):
        logger.info(f"Agent: {msg.content}")
    
    @assistant.on("metrics_collected")
    def on_metrics_collected(metrics: agents.metrics.AssistantMetrics):
        logger.info(f"Metrics - TTF: {metrics.ttf:.2f}s, Processing: {metrics.processing_time:.2f}s")
    
    # Initial greeting with compliance statement
    await assistant.say(
        "Hello, this is Sarah from the Financial Recovery Department. "
        "This is an attempt to collect a debt, and any information obtained will be used for that purpose. "
        "May I please verify your identity by confirming the last four digits of your social security number and your date of birth?",
        allow_interruptions=True
    )
    
    # Handle session end
    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant: rtc.RemoteParticipant):
        call_duration = (datetime.now() - call_start).total_seconds()
        logger.info(f"Call ended - Duration: {call_duration:.0f}s, Payment: {payment_collected}, Arrangement: {arrangement_made}")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=os.getenv("LIVEKIT_API_KEY"),
            api_secret=os.getenv("LIVEKIT_API_SECRET"),
            ws_url=os.getenv("LIVEKIT_URL"),
        )
    )