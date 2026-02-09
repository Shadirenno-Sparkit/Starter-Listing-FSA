import { useState, useEffect } from "react";
import { Zap, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ARLabel {
  id: string;
  label: string;
  position: { top: string; left: string };
  status: "info" | "warning" | "error" | "success";
}

interface AROverlayProps {
  labels: ARLabel[];
  isAnalyzing?: boolean;
  analysisResult?: any;
}

export default function AROverlay({ labels, isAnalyzing = false, analysisResult }: AROverlayProps) {
  const [scanningProgress, setScanningProgress] = useState(0);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setScanningProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 40);

      return () => clearInterval(interval);
    } else {
      setScanningProgress(0);
    }
  }, [isAnalyzing]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "warning":
        return <AlertTriangle className="h-3 w-3" />;
      case "error":
        return <AlertTriangle className="h-3 w-3" />;
      case "success":
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "warning":
        return "bg-amber-500";
      case "error":
        return "bg-red-500";
      case "success":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="ar-overlay">
      {/* Scanning Animation */}
      {isAnalyzing && (
        <>
          <div className="scanning-line" style={{ top: `${scanningProgress}%` }} />
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
            <Badge className="bg-blue-500 text-white animate-pulse">
              <Zap className="h-3 w-3 mr-1" />
              Analyzing Equipment... {scanningProgress}%
            </Badge>
          </div>
        </>
      )}

      {/* AR Labels */}
      {!isAnalyzing && labels.map((label) => (
        <div
          key={label.id}
          className={`ar-label status-${label.status}`}
          style={{
            top: label.position.top,
            left: label.position.left,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(label.status)}`} />
            <span className="text-sm font-medium">{label.label}</span>
            {getStatusIcon(label.status)}
          </div>
        </div>
      ))}

      {/* Equipment Recognition Results */}
      {analysisResult && !isAnalyzing && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Equipment Identified</h3>
              <Badge className="bg-green-500 text-white text-xs">
                {Math.round(analysisResult.confidence * 100)}% Match
              </Badge>
            </div>
            <p className="text-xs text-gray-300 mb-2">{analysisResult.equipmentType}: {analysisResult.model}</p>
            
            {analysisResult.issues && analysisResult.issues.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-red-400">Issues Detected:</p>
                {analysisResult.issues.slice(0, 2).map((issue: string, index: number) => (
                  <p key={index} className="text-xs text-red-300">• {issue}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AR Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(37, 99, 235, 0.2)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Corner Brackets */}
      <div className="absolute inset-4 pointer-events-none">
        {/* Top Left */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
        {/* Top Right */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
        {/* Bottom Left */}
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
        {/* Bottom Right */}
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
      </div>

      {/* Center Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-8 h-8 border-2 border-blue-500 rounded-full bg-blue-500/20 flex items-center justify-center">
          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
