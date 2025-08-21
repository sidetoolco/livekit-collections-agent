'use client';

import { useEffect, useState, useRef } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  AudioConference,
  useParticipants,
  useTracks,
  ControlBar,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { MicrophoneIcon, PhoneXMarkIcon } from '@heroicons/react/24/solid';

interface CollectionsCallProps {
  accountData: any;
  onCallEnd: () => void;
}

export default function CollectionsCall({ accountData, onCallEnd }: CollectionsCallProps) {
  const [token, setToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Start call automatically
    startCall();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCall = async () => {
    setIsConnecting(true);
    
    try {
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: `collections-${accountData.accountNumber}`,
          username: accountData.customerName,
          metadata: {
            accountNumber: accountData.accountNumber,
            balance: accountData.balance,
            pastDue: accountData.pastDue,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setIsConnected(true);
        
        // Start timer
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDisconnect = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsConnected(false);
    onCallEnd();
  };

  if (!token) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center">
          <div className="animate-pulse">
            <MicrophoneIcon className="h-16 w-16 text-blue-500" />
          </div>
          <p className="mt-4 text-lg font-medium">
            {isConnecting ? 'Connecting to AI Assistant...' : 'Preparing call...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">AI Collections Assistant</h2>
            <p className="text-sm opacity-90">Secure & Confidential</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono">{formatDuration(callDuration)}</p>
            <p className="text-xs opacity-75">Call Duration</p>
          </div>
        </div>
      </div>

      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        onDisconnected={handleDisconnect}
        className="h-[400px]"
      >
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Call Status</h3>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Connected - AI Assistant Active</span>
            </div>
          </div>

          <CallTranscript />

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
            >
              <PhoneXMarkIcon className="h-5 w-5" />
              End Call
            </button>
          </div>
        </div>

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function CallTranscript() {
  const [transcript, setTranscript] = useState<Array<{speaker: string, text: string}>>([
    { speaker: 'AI Assistant', text: 'Hello, this is Sarah from the Financial Recovery Department. I see you have an outstanding balance. How can I help you today?' }
  ]);

  // In production, this would connect to real-time transcription
  useEffect(() => {
    // Simulated transcript updates
    const timer = setTimeout(() => {
      setTranscript(prev => [...prev, {
        speaker: 'You',
        text: 'I\'d like to discuss payment options for my account.'
      }]);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white border rounded-lg p-4 h-48 overflow-y-auto">
      <h3 className="font-medium text-gray-700 mb-2">Conversation</h3>
      <div className="space-y-2">
        {transcript.map((entry, idx) => (
          <div key={idx} className={`text-sm ${entry.speaker === 'You' ? 'text-blue-600' : 'text-gray-700'}`}>
            <span className="font-medium">{entry.speaker}:</span> {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}