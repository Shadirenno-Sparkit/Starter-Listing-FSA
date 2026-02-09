import { useState, useCallback, useRef } from "react";

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      setIsActive(true);
      setError(null);
      
      console.log("Camera started successfully");
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Camera access denied or not available";
      
      if (err.name === 'NotFoundError') {
        errorMessage = "No camera found on this device";
      } else if (err.name === 'NotAllowedError') {
        errorMessage = "Camera access denied. Please allow camera permissions.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application";
      }
      
      setError(errorMessage);
      setIsActive(false);
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
    }
  }, [stream]);

  const captureImage = useCallback(async (): Promise<string | null> => {
    if (!stream || !videoRef.current) {
      console.error("No active camera stream");
      return null;
    }

    try {
      // Create a canvas to capture the current frame
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Cannot get canvas context");
      }
      
      ctx.drawImage(video, 0, 0);
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      return imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
    } catch (err) {
      console.error("Error capturing image:", err);
      setError("Failed to capture image");
      return null;
    }
  }, [stream]);

  const switchCamera = useCallback(async () => {
    if (!isActive) return;
    
    stopCamera();
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: stream?.getVideoTracks()[0].getSettings().facingMode === "environment" 
            ? "user" 
            : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error("Error switching camera:", err);
      setError("Failed to switch camera");
      // Restart with original settings if switching fails
      startCamera();
    }
  }, [stream, isActive, stopCamera, startCamera]);

  const recordVideo = useCallback(async (duration: number = 10000): Promise<Blob | null> => {
    if (!stream) {
      console.error("No active camera stream");
      return null;
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      const chunks: BlobPart[] = [];
      
      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
        
        mediaRecorder.onerror = (event) => {
          reject(new Error("Recording failed"));
        };
        
        mediaRecorder.start();
        
        // Stop recording after specified duration
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }, duration);
      });
    } catch (err) {
      console.error("Error recording video:", err);
      setError("Failed to record video");
      return null;
    }
  }, [stream]);

  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (err) {
      console.error("Error getting camera devices:", err);
      return [];
    }
  }, []);

  return {
    stream,
    error,
    isActive,
    videoRef,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
    recordVideo,
    getDevices,
  };
}
