import jsPDF from 'jspdf';

export interface ConversationLog {
  id: string;
  timestamp: Date;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  workOrder?: {
    id: string;
    equipmentType: string;
    priority: string;
    description?: string;
  };
  user?: {
    firstName: string;
    lastName: string;
    businessName: string;
  };
  summary?: string;
}

export class LogExportService {
  static generateSummary(log: ConversationLog): string {
    const userMessages = log.messages.filter(m => m.role === 'user');
    const assistantMessages = log.messages.filter(m => m.role === 'assistant');
    
    const issues = userMessages
      .map(m => m.content)
      .filter(content => content.length > 10)
      .slice(0, 3);
    
    const solutions = assistantMessages
      .map(m => m.content)
      .filter(content => content.includes('part') || content.includes('check') || content.includes('replace'))
      .slice(0, 3);

    return `FIELD SERVICE REPORT

Date: ${log.timestamp.toLocaleDateString()}
Technician: ${log.user?.firstName} ${log.user?.lastName}
Company: ${log.user?.businessName}

EQUIPMENT:
${log.workOrder?.equipmentType || 'General Equipment'}
Priority: ${log.workOrder?.priority || 'Standard'}

ISSUES REPORTED:
${issues.map((issue, i) => `${i + 1}. ${issue.substring(0, 100)}...`).join('\n')}

ACTIONS TAKEN:
${solutions.map((solution, i) => `${i + 1}. ${solution.substring(0, 150)}...`).join('\n')}

Total Messages: ${log.messages.length}
Session Duration: ~${Math.ceil(log.messages.length * 2)} minutes
`;
  }

  static async exportToPDF(log: ConversationLog): Promise<Blob> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Field Service AI Assistant Log', margin, yPosition);
    yPosition += 15;

    // Basic info
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${log.timestamp.toLocaleDateString()} ${log.timestamp.toLocaleTimeString()}`, margin, yPosition);
    yPosition += 8;
    
    if (log.user) {
      pdf.text(`Technician: ${log.user.firstName} ${log.user.lastName}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Company: ${log.user.businessName}`, margin, yPosition);
      yPosition += 8;
    }

    if (log.workOrder) {
      pdf.text(`Equipment: ${log.workOrder.equipmentType}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Priority: ${log.workOrder.priority}`, margin, yPosition);
      yPosition += 15;
    }

    // Messages
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Conversation Log:', margin, yPosition);
    yPosition += 15;

    log.messages.forEach((message, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      const role = message.role === 'user' ? 'TECHNICIAN' : 'AI ASSISTANT';
      pdf.text(`${role} [${message.timestamp.toLocaleTimeString()}]:`, margin, yPosition);
      yPosition += 8;

      // Split text to fit page width
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(message.content, maxWidth);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 6;
      });
      
      yPosition += 8; // Extra space between messages
    });

    return pdf.output('blob');
  }

  static async exportToJSON(log: ConversationLog): Promise<Blob> {
    const exportData = {
      ...log,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  static async downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async shareLog(log: ConversationLog): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    try {
      const summary = this.generateSummary(log);
      
      await navigator.share({
        title: 'Field Service Report',
        text: summary,
      });
      
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  }

  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        return false;
      }
    }
  }
}