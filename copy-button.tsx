import { useState } from 'react';
import { Copy, Check, Share } from 'lucide-react';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import { LogExportService } from '@/services/logExportService';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'default';
}

export function CopyButton({ text, className = '', size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const success = await LogExportService.copyToClipboard(text);
    
    if (success) {
      setCopied(true);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: "Copy Failed",
        description: "Unable to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      className={`h-6 px-2 text-xs ${className}`}
      onClick={handleCopy}
      data-testid="button-copy"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
    </Button>
  );
}

interface ShareButtonProps {
  text: string;
  title?: string;
  className?: string;
  size?: 'sm' | 'default';
}

export function ShareButton({ text, title = 'Field Service Info', className = '', size = 'sm' }: ShareButtonProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
          // Fallback to copy
          const success = await LogExportService.copyToClipboard(text);
          if (success) {
            toast({
              title: "Copied",
              description: "Text copied to clipboard (share not available)",
            });
          }
        }
      }
    } else {
      // Fallback to copy if share is not available
      const success = await LogExportService.copyToClipboard(text);
      if (success) {
        toast({
          title: "Copied",
          description: "Text copied to clipboard (share not available)",
        });
      } else {
        toast({
          title: "Share Failed",
          description: "Unable to share or copy text",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      className={`h-6 px-2 text-xs ${className}`}
      onClick={handleShare}
      data-testid="button-share"
    >
      <Share className="w-3 h-3" />
      <span className="ml-1">Share</span>
    </Button>
  );
}