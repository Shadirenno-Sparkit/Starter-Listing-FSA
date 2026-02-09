import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex items-start space-x-3 ${isAssistant ? '' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={`flex-1 ${isAssistant ? 'max-w-none' : 'max-w-xs'}`}>
        <div
          className={`rounded-lg p-3 ${
            isAssistant
              ? 'bg-blue-50 text-gray-900'
              : 'bg-primary text-white ml-auto'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className={`text-xs text-gray-500 mt-1 ${isAssistant ? '' : 'text-right'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}
