import { useState, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  isTranscribing: boolean;
  audioLevel: number;
}

export function useVoice() {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPlaying: false,
    isTranscribing: false,
    audioLevel: 0,
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1
    
    setState(prev => ({ ...prev, audioLevel: normalizedLevel }));
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      // Set up audio analysis for visual feedback
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setState(prev => ({ ...prev, isRecording: true }));
      updateAudioLevel();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Access",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [toast, updateAudioLevel]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      setState(prev => ({ ...prev, isRecording: false, isTranscribing: true }));
      
      // Stop audio level monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Stop all tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const result = await response.json();
          setState(prev => ({ ...prev, isTranscribing: false }));
          resolve(result.text || null);
          
        } catch (error) {
          console.error('Error transcribing audio:', error);
          setState(prev => ({ ...prev, isTranscribing: false }));
          toast({
            title: "Transcription Failed",
            description: "Unable to convert speech to text. Please try again.",
            variant: "destructive",
          });
          resolve(null);
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [toast]);

  const playResponse = useCallback(async (text: string) => {
    try {
      setState(prev => ({ ...prev, isPlaying: true }));
      
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      
      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          setState(prev => ({ ...prev, isPlaying: false }));
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = () => {
          setState(prev => ({ ...prev, isPlaying: false }));
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        
        audio.play().catch(reject);
      });
      
    } catch (error) {
      console.error('Error playing response:', error);
      setState(prev => ({ ...prev, isPlaying: false }));
      toast({
        title: "Audio Playback Failed",
        description: "Unable to play AI response. Please check your audio settings.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setState({
      isRecording: false,
      isPlaying: false,
      isTranscribing: false,
      audioLevel: 0,
    });
  }, [state.isRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    playResponse,
    cleanup,
  };
}