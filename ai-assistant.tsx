import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, Send, Bot, User, Upload, Volume2, VolumeX, Play, Pause, Camera, Download, FileText, Plus, Scan, Settings, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useVoice } from "@/hooks/useVoice";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { CopyButton, ShareButton } from "@/components/ui/copy-button";
import { CameraOCR } from "@/components/ui/camera-ocr";
import { LogExportService, ConversationLog } from "@/services/logExportService";

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [autoPlayResponses, setAutoPlayResponses] = useState(false);
  const [showCameraOCR, setShowCameraOCR] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const voice = useVoice();

  const { data: conversations } = useQuery({
    queryKey: ["/api/conversations"],
    retry: false,
  });

  const currentConversation = Array.isArray(conversations) 
    ? conversations.find((c: any) => c.id === conversationId)
    : null;
  const messages = currentConversation?.messages || [];

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; conversationId?: string }) => {
      if (!data.conversationId) {
        // Create new conversation
        const conversationResponse = await apiRequest("POST", "/api/conversations", {
          messages: [],
          context: { equipment: { type: 'fuel_dispenser' } },
        });
        const conversation = await conversationResponse.json();
        setConversationId(conversation.id);
        data.conversationId = conversation.id;
      }
      
      const response = await apiRequest("POST", `/api/conversations/${data.conversationId}/messages`, {
        message: data.message,
      });
      return await response.json();
    },
    onSuccess: async (data) => {
      setMessage("");
      
      // Refresh conversations to get updated messages
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      // Auto-play AI response if enabled (disabled by default)
      if (autoPlayResponses && data.response) {
        try {
          await voice.playResponse(data.response);
        } catch (error) {
          console.error('Error playing AI response:', error);
        }
      }
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate({
      message: message.trim(),
      conversationId: conversationId || undefined,
    });
  };

  const handleVoiceRecording = async () => {
    if (voice.isRecording) {
      const transcript = await voice.stopRecording();
      if (transcript) {
        setMessage(transcript);
        // Automatically send the transcribed message
        sendMessageMutation.mutate({
          message: transcript,
          conversationId: conversationId || undefined,
        });
      }
    } else {
      await voice.startRecording();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/media/upload', formData);
      const result = await response.json();
      
      const imagePrompt = `I'm sharing an image of gas station equipment. Please analyze it and tell me what you see, any potential issues, and maintenance recommendations.`;
      
      sendMessageMutation.mutate({
        message: `${imagePrompt}\n\n[Image uploaded: ${file.name}]`,
        conversationId: conversationId || undefined,
      });
      
      toast({
        title: "Image Uploaded",
        description: "Image uploaded successfully for analysis",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
    
    // Reset the input
    event.target.value = '';
  };

  const handleBarcodeScanned = (barcode: string) => {
    const barcodeMessage = `I scanned this barcode: ${barcode}. Can you help me identify what equipment or part this is? Please provide:
1. Equipment/part identification
2. Common maintenance issues
3. Replacement procedures if applicable
4. Safety considerations
5. Where to order replacement parts`;
    
    sendMessageMutation.mutate({
      message: barcodeMessage,
      conversationId: conversationId || undefined,
    });
    
    setShowBarcodeScanner(false);
    
    toast({
      title: "Barcode Scanned",
      description: "Looking up equipment information...",
    });
  };

  const handleCameraOCRText = (text: string) => {
    setMessage(prev => prev + (prev ? ' ' : '') + text);
  };

  const exportConversationPDF = async () => {
    if (!currentConversation || messages.length === 0) {
      toast({
        title: "No Conversation",
        description: "No conversation to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const log: ConversationLog = {
        id: currentConversation.id,
        timestamp: new Date(currentConversation.createdAt),
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt || new Date()),
        })),
        user: user ? {
          firstName: (user as any).firstName || 'Field',
          lastName: (user as any).lastName || 'Technician',
          businessName: (user as any).businessName || 'Gas Station Service',
        } : undefined,
        workOrder: {
          id: 'manual',
          equipmentType: 'Gas Station Equipment',
          priority: 'standard',
        },
      };

      const pdfBlob = await LogExportService.exportToPDF(log);
      const filename = `field-service-log-${new Date().toISOString().split('T')[0]}.pdf`;
      await LogExportService.downloadFile(pdfBlob, filename);
      
      toast({
        title: "Export Complete",
        description: "Conversation log downloaded as PDF",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export conversation log",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const shareConversation = async () => {
    if (!currentConversation || messages.length === 0) return;

    const log: ConversationLog = {
      id: currentConversation.id,
      timestamp: new Date(),
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(),
      })),
      user: user as any,
    };

    const summary = LogExportService.generateSummary(log);
    const shared = await LogExportService.shareLog(log);
    
    if (!shared) {
      // Fallback to copy
      const copied = await LogExportService.copyToClipboard(summary);
      if (copied) {
        toast({
          title: "Copied",
          description: "Service report copied to clipboard",
        });
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full" style={{background: 'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)'}}>
      {/* Petro Plus Header */}
      <div className="p-4 border-b border-slate-600 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center overflow-hidden">
              <img 
                src="/petro-plus-logo.jpeg" 
                alt="Petro Plus Logo" 
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextEl) nextEl.style.display = 'block';
                }}
              />
              <span className="text-slate-400 font-bold text-sm" style={{display: 'none'}}>P+</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Petro Plus AI</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Expert Assistant Ready</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportConversationPDF}
              disabled={isExporting || messages.length === 0}
              className="hidden sm:flex text-gray-300 hover:bg-gray-700 border-gray-600"
            >
              {isExporting ? <Settings className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="ml-1">Export</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoPlayResponses(!autoPlayResponses)}
              className="flex items-center text-gray-300 hover:bg-gray-700 border-gray-600"
            >
              {autoPlayResponses ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline ml-1">Audio</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6">
            {/* Large Interactive Orb */}
            <div className="mb-8">
              <button
                onClick={handleVoiceRecording}
                disabled={voice.isTranscribing || sendMessageMutation.isPending}
                className={`w-40 h-40 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  voice.isRecording 
                    ? 'bg-red-500 shadow-2xl shadow-red-500/50 animate-pulse' 
                    : 'bg-gray-800/60 backdrop-blur-md border-4 border-gray-600 shadow-2xl hover:bg-gray-700/70'
                } flex items-center justify-center group relative overflow-hidden`}
                data-testid="orb-voice-button"
              >
                {voice.isRecording ? (
                  <div className="flex flex-col items-center">
                    <MicOff className="w-12 h-12 text-white mb-2" />
                    <span className="text-white text-sm font-medium">Listening...</span>
                  </div>
                ) : voice.isTranscribing ? (
                  <div className="flex flex-col items-center">
                    <Settings className="w-12 h-12 text-white animate-spin mb-2" />
                    <span className="text-white text-sm font-medium">Processing...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* Background Logo - Full Size */}
                    <img 
                      src="/petro-plus-logo.jpeg" 
                      alt="Petro Plus Logo" 
                      className="absolute inset-0 w-full h-full object-cover rounded-full opacity-80"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {/* Overlay Content */}
                    <div className="relative z-10 flex flex-col items-center bg-black/50 rounded-full w-full h-full justify-center backdrop-blur-sm">
                      <Mic className="w-8 h-8 text-white drop-shadow-lg group-hover:text-green-300 transition-colors" />
                    </div>
                  </div>
                )}
              </button>
              {/* Bottom Text Below Orb */}
              <div className="mt-4 text-center">
                <span className="text-white text-xs font-medium hover:text-green-300 transition-colors drop-shadow-lg">Tap to speak</span>
              </div>
            </div>
            
            {/* Welcome Message */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Petro Plus Expert Assistant</h3>
              <p className="text-gray-300 text-lg px-4 max-w-md">
                Expert petroleum guidance at your fingertips.
              </p>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm flex items-center"
                data-testid="button-upload-image"
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload Image
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowBarcodeScanner(true)}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm flex items-center"
                data-testid="button-scan-barcode"
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                Scan Barcode
              </Button>
            </div>
            
            {/* Hidden file input for image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((msg: any, index: number) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                    msg.role === 'user' 
                      ? 'bg-gray-700 border-2 border-gray-600 ml-2' 
                      : 'bg-gray-800 border-2 border-gray-700 mr-2'
                  }`}>
                    {msg.role === 'user' ? 
                      <User className="w-4 h-4 text-white" /> : 
                      <>
                        <img 
                          src="/petro-plus-logo.jpeg" 
                          alt="Petro Plus Logo" 
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextEl) nextEl.style.display = 'block';
                          }}
                        />
                        <span className="text-gray-400 font-bold text-xs" style={{display: 'none'}}>P+</span>
                      </>
                    }
                  </div>
                  <div className={`rounded-2xl px-4 py-3 backdrop-blur-sm ${
                    msg.role === 'user' 
                      ? 'bg-gray-700/80 border border-gray-600 text-white' 
                      : 'bg-gray-800/95 border border-gray-700 text-gray-100 shadow-lg'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center flex-wrap mt-3 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-3 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
                          onClick={() => voice.playResponse(msg.content)}
                          disabled={voice.isPlaying}
                          data-testid="button-play-response"
                        >
                          {voice.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span className="ml-1">Play</span>
                        </Button>
                        <CopyButton text={msg.content} className="bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600" />
                        <ShareButton text={msg.content} title="Petro Plus Technical Answer" className="bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Loading indicator */}
        {sendMessageMutation.isPending && (
          <div className="flex justify-start">
            <div className="flex">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 mr-2">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="rounded-lg px-4 py-2 bg-white border shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recording Status */}
      {(voice.isRecording || voice.isTranscribing) && (
        <div className="p-3 bg-gray-800/30 border-t border-gray-700">
          <div className="flex items-center justify-center space-x-2">
            {voice.isRecording && (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-200">Recording...</span>
                <div className="w-20 h-2 bg-gray-600 rounded overflow-hidden">
                  <div 
                    className="h-full bg-green-400 transition-all duration-100"
                    style={{ width: `${voice.audioLevel * 100}%` }}
                  />
                </div>
              </>
            )}
            {voice.isTranscribing && (
              <>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-200">Converting speech to text...</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="p-4 border-t border-green-500/30 bg-black/20 backdrop-blur-sm">
        {/* Text Input Row */}
        <div className="flex space-x-3 items-center max-w-2xl mx-auto">
          {/* Audio Recording Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceRecording}
            disabled={sendMessageMutation.isPending || voice.isTranscribing}
            className={`flex-shrink-0 border ${voice.isRecording 
              ? 'bg-red-500/20 border-red-500/40 text-red-200 hover:bg-red-400/30' 
              : 'bg-green-800/20 border-green-500/40 text-green-200 hover:bg-green-700/30'
            }`}
            data-testid="button-audio"
          >
            {voice.isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          {/* Message Input */}
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your question about equipment or maintenance..."
              className="w-full text-sm bg-gray-800/90 border-green-500/40 text-green-100 placeholder-green-300/70 rounded-full pl-4 pr-12 py-3 focus:bg-gray-700 focus:ring-2 focus:ring-green-400"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={sendMessageMutation.isPending || voice.isRecording}
              data-testid="input-message"
            />
            
            {/* Send Button - Inside Input */}
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending || voice.isRecording}
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Export Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={exportConversationPDF}
            disabled={isExporting || messages.length === 0}
            className="flex-shrink-0 bg-green-800/20 border border-green-500/40 text-green-200 hover:bg-green-700/30"
          >
            {isExporting ? <Settings className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>
        </div>
        
        <div className="text-xs text-green-200/80 mt-3 text-center">
          Tap the orb above to speak or type your question below
        </div>
      </div>

      {/* Camera OCR Modal */}
      <CameraOCR
        isOpen={showCameraOCR}
        onClose={() => setShowCameraOCR(false)}
        onTextRecognized={handleCameraOCRText}
        mode="errorCode"
      />
      
      {/* Barcode Scanner Modal */}
      <CameraOCR
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onTextRecognized={handleBarcodeScanned}
        mode="barcode"
      />

      {/* Floating Action Button - Mobile Only */}
      {messages.length > 3 && (
        <div className="fixed bottom-20 right-4 z-40 sm:hidden">
          <Button
            size="icon"
            className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 shadow-lg"
            onClick={() => setShowFAB(!showFAB)}
            data-testid="button-fab"
          >
            <Plus className={`w-5 h-5 transition-transform ${showFAB ? 'rotate-45' : ''}`} />
          </Button>
          
          {showFAB && (
            <div className="absolute bottom-16 right-0 space-y-2">
              <Button
                size="icon"
                className="w-10 h-10 rounded-full bg-white border shadow-md hover:bg-gray-50"
                onClick={() => {
                  setShowCameraOCR(true);
                  setShowFAB(false);
                }}
              >
                <Scan className="w-4 h-4 text-gray-700" />
              </Button>
              <Button
                size="icon"
                className="w-10 h-10 rounded-full bg-white border shadow-md hover:bg-gray-50"
                onClick={() => {
                  handleVoiceRecording();
                  setShowFAB(false);
                }}
              >
                <Mic className="w-4 h-4 text-gray-700" />
              </Button>
              <Button
                size="icon"
                className="w-10 h-10 rounded-full bg-white border shadow-md hover:bg-gray-50"
                onClick={() => {
                  exportConversationPDF();
                  setShowFAB(false);
                }}
                disabled={messages.length === 0}
              >
                <Download className="w-4 h-4 text-gray-700" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}