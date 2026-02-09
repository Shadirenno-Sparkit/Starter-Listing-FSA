import { useState, useRef } from 'react';
import { Camera, Scan, X, Check, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { useCamera } from '@/hooks/useCamera';
import { OCRService } from '@/services/ocrService';
import { useToast } from '@/hooks/use-toast';

interface CameraOCRProps {
  onTextRecognized: (text: string) => void;
  onClose: () => void;
  isOpen: boolean;
  mode?: 'general' | 'errorCode' | 'barcode';
}

export function CameraOCR({ onTextRecognized, onClose, isOpen, mode = 'general' }: CameraOCRProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const { toast } = useToast();
  
  const camera = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      await camera.startCamera();
      // Initialize OCR worker in background
      OCRService.initializeWorker().catch(console.error);
    } catch (error) {
      console.error('Failed to start camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const captureAndProcess = async () => {
    if (!camera.stream || !camera.videoRef.current) {
      toast({
        title: "Camera Error",
        description: "No active camera stream",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Capture image from video stream
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const video = camera.videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Process with OCR
      let result;
      if (mode === 'errorCode') {
        result = await OCRService.recognizeErrorCode(imageData);
        const text = result.errorCode || result.fullText;
        setRecognizedText(text);
        setConfidence(result.confidence);
      } else if (mode === 'barcode') {
        result = await OCRService.recognizeBarcode(imageData);
        setRecognizedText(result.barcode || result.text);
        setConfidence(result.confidence);
      } else {
        result = await OCRService.recognizeText(imageData);
        setRecognizedText(result.text);
        setConfidence(result.confidence);
      }

      if (result.confidence > 30) { // Minimum confidence threshold
        toast({
          title: "Text Recognized",
          description: `Confidence: ${Math.round(result.confidence)}%`,
        });
      } else {
        toast({
          title: "Low Confidence",
          description: "Try repositioning the camera for clearer text",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('OCR processing failed:', error);
      toast({
        title: "OCR Failed",
        description: "Unable to read text from image. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const useRecognizedText = () => {
    if (recognizedText.trim()) {
      onTextRecognized(recognizedText.trim());
      onClose();
    }
  };

  const handleClose = () => {
    camera.stopCamera();
    setRecognizedText('');
    setConfidence(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {mode === 'errorCode' ? 'Scan Error Code' : mode === 'barcode' ? 'Scan Barcode' : 'Scan Text'}
            </h3>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {!camera.isActive ? (
            <div className="text-center py-8">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {mode === 'barcode' 
                  ? 'Position the camera over the barcode you want to scan'
                  : 'Position the camera over the text you want to scan'
                }
              </p>
              <Button onClick={startCamera} data-testid="button-start-camera">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={camera.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ objectFit: 'cover' }}
                  {...(camera.stream && { srcObject: camera.stream })}
                />
                
                {/* Overlay guide */}
                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                  <div className="text-white text-center text-sm">
                    {mode === 'errorCode' ? 'Position error code here' : 
                     mode === 'barcode' ? 'Position barcode here' : 'Position text here'}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex space-x-2">
                <Button
                  onClick={captureAndProcess}
                  disabled={isProcessing}
                  className="flex-1"
                  data-testid="button-scan"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Scan className="w-4 h-4 mr-2" />
                  )}
                  {isProcessing ? 'Processing...' : mode === 'barcode' ? 'Scan Barcode' : 'Scan Text'}
                </Button>
                
                <Button variant="outline" onClick={camera.switchCamera}>
                  <Camera className="w-4 h-4" />
                </Button>
              </div>

              {/* Results */}
              {recognizedText && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {mode === 'barcode' ? 'Recognized Barcode:' : 'Recognized Text:'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(confidence)}% confidence
                    </span>
                  </div>
                  <p className="text-sm border rounded px-2 py-1 bg-white font-mono">
                    {recognizedText}
                  </p>
                  <div className="flex space-x-2 mt-2">
                    <Button
                      size="sm"
                      onClick={useRecognizedText}
                      disabled={confidence < 30}
                      data-testid="button-use-text"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Use This Text
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRecognizedText('')}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {camera.error && (
                <div className="text-red-600 text-sm text-center">
                  {camera.error}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}