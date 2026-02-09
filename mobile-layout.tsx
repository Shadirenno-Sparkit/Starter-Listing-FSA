import { Settings, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import AIAssistant from "@/pages/ai-assistant";
import { useAuth } from "@/hooks/useAuth";

interface MobileLayoutProps {
  children?: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="max-w-md mx-auto shadow-2xl min-h-screen flex flex-col" style={{background: 'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)'}}>
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-slate-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6" />
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center overflow-hidden">
              <img 
                src="/petro-plus-logo.jpeg" 
                alt="Petro Plus Logo" 
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'block';
                }}
              />
              <span className="text-slate-400 font-bold text-xs" style={{display: 'none'}}>P+</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Petro Plus AI</h1>
              <p className="text-sm text-slate-300">
                {(user as any)?.firstName || 'Technician'} {(user as any)?.lastName || ''} - Tech ID: {(user as any)?.id?.slice(-3) || '001'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm">Online</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => window.location.href = "/api/logout"}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Single Tab Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-slate-600">
        <div className="flex items-center justify-center py-4">
          <MessageSquare className="h-5 w-5 text-green-300 mr-2" />
          <span className="text-lg font-semibold text-white">AI Assistant</span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <AIAssistant />
      </div>


    </div>
  );
}
