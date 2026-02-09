import { useState, useEffect } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/useVoice";

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  onCancel: () => void;
}

export default function VoiceInput({ onTranscript, onCancel }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const { transcript, listening, startListening, stopListening, resetTranscript } = useVoice();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [transcript, onTranscript, resetTranscript]);

  const handleStartListening = () => {
    setIsListening(true);
    startListening();
  };

  const handleStopListening = () => {
    setIsListening(false);
    stopListening();
  };

  const handleCancel = () => {
    if (listening) {
      stopListening();
    }
    setIsListening(false);
    resetTranscript();
    onCancel();
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-gray-50 rounded-lg">
      {/* Voice Animation */}
      <div className="relative">
        <Button
          size="lg"
          className={`w-20 h-20 rounded-full transition-all duration-300 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-primary hover:bg-primary-dark'
          }`}
          onClick={isListening ? handleStopListening : handleStartListening}
        >
          {isListening ? (
            <MicOff className="h-8 w-8 text-white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </Button>
        
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-30"></div>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">
          {isListening ? "Listening..." : "Tap to speak"}
        </p>
        <p className="text-sm text-gray-600">
          {isListening 
            ? "Speak clearly and tap stop when finished" 
            : "Ask any question about gas station maintenance"
          }
        </p>
      </div>

      {/* Live Transcript */}
      {transcript && (
        <div className="w-full max-w-sm">
          <div className="bg-white border rounded-lg p-3">
            <p className="text-sm text-gray-700">{transcript}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="px-6"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        
        {transcript && !isListening && (
          <Button
            onClick={() => onTranscript(transcript)}
            className="px-6"
          >
            Send Message
          </Button>
        )}
      </div>

      {/* Browser Support Message */}
      {!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window) && (
        <div className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded">
          Voice input is not supported in this browser
        </div>
      )}
    </div>
  );
}
