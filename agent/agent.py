"""
Voice Assistant Agent - Main Entry Point

This agent handles real-time voice conversations using:
- Deepgram Nova-3 for Speech-to-Text
- Google Gemini 2.0 Flash for LLM responses
- Deepgram Aura for Text-to-Speech
- Mem0 + Qdrant for memory management
"""

import asyncio
import logging
import os

from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, JobProcess, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, google, silero

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-assistant")


def prewarm(proc: JobProcess):
    """Prewarm the agent by loading models."""
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    """Main entry point for the voice assistant agent."""

    # Get user metadata from room (contains user_id, preferences, etc.)
    user_data = ctx.room.metadata or "{}"
    logger.info(f"Starting agent for room: {ctx.room.name}")

    # Initialize the voice assistant pipeline
    initial_ctx = llm.ChatContext().append(
        role="system",
        text="""You are a helpful, friendly voice assistant.

Your personality traits:
- Warm and conversational
- Concise in responses (keep answers brief for voice)
- Helpful and knowledgeable
- You can use tools to search the web or get weather information

When responding:
- Keep responses under 2-3 sentences for natural conversation
- Ask clarifying questions when needed
- Be natural and conversational""",
    )

    # Connect to the room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for a participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")

    # Initialize voice assistant with Deepgram STT/TTS and Gemini LLM
    assistant = VoiceAssistant(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(
            model="nova-2",
            language="en",
        ),
        llm=google.LLM(
            model="gemini-2.0-flash-exp",
            temperature=0.7,
        ),
        tts=deepgram.TTS(
            model="aura-asteria-en",  # Default voice, can be customized per user
        ),
        chat_ctx=initial_ctx,
    )

    # Start the assistant
    assistant.start(ctx.room, participant)

    # Initial greeting
    await assistant.say("Hello! I'm your voice assistant. How can I help you today?")

    logger.info("Voice assistant started successfully")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
