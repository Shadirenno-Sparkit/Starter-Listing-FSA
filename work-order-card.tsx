import { Clock, MapPin, AlertTriangle, Settings, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WorkOrderCardProps {
  workOrder: any;
}

export default function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/work-orders/${workOrder.id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Success",
        description: "Work order status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update work order",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", className: "bg-gray-100 text-gray-600" },
      scheduled: { label: "Scheduled", className: "bg-gray-100 text-gray-600" },
      traveling: { label: "Traveling", className: "bg-blue-100 text-blue-800" },
      in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-800" },
      paused: { label: "Paused", className: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
      finalized: { label: "Finalized", className: "bg-green-100 text-green-800" },
      canceled: { label: "Canceled", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "emergency" || priority === "high") {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getEquipmentIcon = (equipmentType: string) => {
    return <Settings className="h-4 w-4 text-blue-500" />;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isActive = ["in_progress", "traveling"].includes(workOrder.status);
  const isScheduled = workOrder.status === "scheduled";

  return (
    <Card className={`${isActive ? "border-l-4 border-l-amber-500" : isScheduled ? "border-l-4 border-l-gray-300" : ""}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusBadge(workOrder.status)}
            <div className="flex items-center space-x-1">
              {getPriorityIcon(workOrder.priority)}
              <span className="text-sm text-gray-600">Priority: {workOrder.priority}</span>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {workOrder.scheduledDate ? formatTime(workOrder.scheduledDate) : "No schedule"}
          </span>
        </div>

        {/* Title and Description */}
        <h3 className="font-semibold text-gray-900 mb-2">{workOrder.title}</h3>
        {workOrder.description && (
          <p className="text-sm text-gray-600 mb-3">{workOrder.description}</p>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-red-500" />
            <span>{workOrder.location?.address || "Location not specified"}</span>
          </div>
          
          {workOrder.equipmentType && (
            <div className="flex items-center space-x-2">
              {getEquipmentIcon(workOrder.equipmentType)}
              <span>
                {workOrder.equipmentType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                {workOrder.location?.equipment?.[0]?.model && ` - ${workOrder.location.equipment[0].model}`}
              </span>
            </div>
          )}

          {workOrder.duration && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Estimated: {workOrder.duration} minutes</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {workOrder.status === "scheduled" && (
            <Button 
              className="flex-1" 
              onClick={() => updateStatusMutation.mutate("in_progress")}
              disabled={updateStatusMutation.isPending}
            >
              <Clock className="h-4 w-4 mr-2" />
              Start Work Order
            </Button>
          )}

          {workOrder.status === "in_progress" && (
            <>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {/* Navigate to AI assistant */}}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask AI Assistant
              </Button>
              <Button 
                className="flex-1"
                onClick={() => updateStatusMutation.mutate("completed")}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            </>
          )}

          {workOrder.status === "traveling" && (
            <Button 
              className="w-full"
              onClick={() => updateStatusMutation.mutate("in_progress")}
              disabled={updateStatusMutation.isPending}
            >
              <Settings className="h-4 w-4 mr-2" />
              Arrive at Site
            </Button>
          )}

          {workOrder.status === "completed" && (
            <div className="w-full text-center py-2 text-green-600 font-medium">
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Work Order Completed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
