import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, AlertTriangle, CheckCircle2, Wrench, Shield, Package, Settings } from "lucide-react";

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  equipmentType: string;
  location: any;
  scheduledDate: string;
  notes: string;
}

interface ChecklistItem {
  id: string;
  type: string;
  name: string;
  description: string;
  quantity: number;
  critical: boolean;
  spare: boolean;
  inventoryStatus: string;
  completed: boolean;
  completedAt: string | null;
  notes: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function WorkOrdersPage() {
  const { toast } = useToast();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<string | null>(null);
  
  // Fetch work orders
  const { data: workOrders = [], isLoading: workOrdersLoading } = useQuery({
    queryKey: ['/api/work-orders'],
    queryFn: () => apiRequest('/api/work-orders')
  });
  
  // Fetch notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: () => apiRequest('/api/notifications')
  });
  
  // Fetch checklist for selected work order
  const { data: checklistItems = [], refetch: refetchChecklist } = useQuery({
    queryKey: ['/api/work-orders', selectedWorkOrder, 'checklist'],
    queryFn: () => apiRequest(`/api/work-orders/${selectedWorkOrder}/checklist`),
    enabled: !!selectedWorkOrder
  });
  
  // Create mock work order mutation
  const createMockWorkOrder = useMutation({
    mutationFn: () => apiRequest('/api/work-orders/mock', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "Work Order Created",
        description: "Mock work order has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create work order",
        variant: "destructive",
      });
    }
  });
  
  // Generate checklist mutation
  const generateChecklist = useMutation({
    mutationFn: (workOrderId: string) => 
      apiRequest(`/api/work-orders/${workOrderId}/checklist/generate`, { method: 'POST' }),
    onSuccess: (data) => {
      toast({
        title: "Checklist Generated",
        description: "Pre-departure checklist is ready for review",
      });
      refetchChecklist();
      refetchNotifications();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate checklist",
        variant: "destructive",
      });
    }
  });
  
  // Update checklist item mutation
  const updateChecklistItem = useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string, updates: any }) =>
      apiRequest(`/api/checklist-items/${itemId}`, { 
        method: 'PATCH',
        body: JSON.stringify(updates)
      }),
    onSuccess: () => {
      refetchChecklist();
    }
  });
  
  // Mark notification read mutation
  const markNotificationRead = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      refetchNotifications();
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'emergency': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'part': return <Package className="w-4 h-4" />;
      case 'tool': return <Wrench className="w-4 h-4" />;
      case 'safety': return <Shield className="w-4 h-4" />;
      case 'preflight_check': return <Settings className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const handleChecklistItemToggle = (item: ChecklistItem) => {
    updateChecklistItem.mutate({
      itemId: item.id,
      updates: { completed: !item.completed }
    });
  };

  const unreadNotifications = notifications.filter((n: Notification) => !n.read);

  return (
    <div className="container mx-auto py-6 px-4" data-testid="work-orders-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Work Orders</h1>
          <p className="text-muted-foreground" data-testid="page-description">
            Manage your field service assignments and pre-departure checklists
          </p>
        </div>
        <Button 
          onClick={() => createMockWorkOrder.mutate()}
          disabled={createMockWorkOrder.isPending}
          data-testid="button-create-mock"
        >
          Create Mock Work Order
        </Button>
      </div>

      {/* Notifications */}
      {unreadNotifications.length > 0 && (
        <Card className="mb-6" data-testid="notifications-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Notifications ({unreadNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unreadNotifications.map((notification: Notification) => (
                <div 
                  key={notification.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`notification-${notification.id}`}
                >
                  <div>
                    <p className="font-medium" data-testid={`notification-title-${notification.id}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`notification-message-${notification.id}`}>
                      {notification.message}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markNotificationRead.mutate(notification.id)}
                    data-testid={`button-mark-read-${notification.id}`}
                  >
                    Mark Read
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Orders List */}
        <div className="lg:col-span-1">
          <Card data-testid="work-orders-list">
            <CardHeader>
              <CardTitle>Active Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {workOrdersLoading ? (
                <div data-testid="loading-work-orders">Loading...</div>
              ) : workOrders.length === 0 ? (
                <p className="text-muted-foreground" data-testid="no-work-orders">
                  No work orders available. Create a mock work order to get started.
                </p>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {workOrders.map((workOrder: WorkOrder) => (
                      <Card
                        key={workOrder.id}
                        className={`cursor-pointer transition-colors ${
                          selectedWorkOrder === workOrder.id ? 'border-primary' : ''
                        }`}
                        onClick={() => setSelectedWorkOrder(workOrder.id)}
                        data-testid={`work-order-card-${workOrder.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold" data-testid={`work-order-title-${workOrder.id}`}>
                                {workOrder.title}
                              </h3>
                              <p className="text-sm text-muted-foreground" data-testid={`work-order-description-${workOrder.id}`}>
                                {workOrder.description}
                              </p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${getPriorityColor(workOrder.priority)}`} />
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(workOrder.status)} data-testid={`status-${workOrder.id}`}>
                              {workOrder.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" data-testid={`equipment-${workOrder.id}`}>
                              {workOrder.equipmentType}
                            </Badge>
                          </div>
                          
                          {workOrder.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span data-testid={`location-${workOrder.id}`}>
                                {workOrder.location.address || workOrder.location.city}
                              </span>
                            </div>
                          )}
                          
                          {workOrder.scheduledDate && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              <span data-testid={`scheduled-${workOrder.id}`}>
                                {new Date(workOrder.scheduledDate).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Work Order Details & Checklist */}
        <div className="lg:col-span-2">
          {selectedWorkOrder ? (
            <Card data-testid="work-order-details">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pre-Departure Checklist</CardTitle>
                  <Button
                    onClick={() => generateChecklist.mutate(selectedWorkOrder)}
                    disabled={generateChecklist.isPending}
                    data-testid="button-generate-checklist"
                  >
                    {generateChecklist.isPending ? 'Generating...' : 'Generate Checklist'}
                  </Button>
                </div>
                <CardDescription>
                  Review and check off items before departing for the job site
                </CardDescription>
              </CardHeader>
              <CardContent>
                {checklistItems.length === 0 ? (
                  <div className="text-center py-8" data-testid="no-checklist">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No checklist generated yet. Click "Generate Checklist" to create one based on the work order details.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-6">
                      {/* Group items by type */}
                      {['part', 'tool', 'safety', 'preflight_check'].map(type => {
                        const items = checklistItems.filter((item: ChecklistItem) => item.type === type);
                        if (items.length === 0) return null;
                        
                        return (
                          <div key={type} data-testid={`checklist-section-${type}`}>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                              {getTypeIcon(type)}
                              {type.replace('_', ' ').toUpperCase()}
                            </h3>
                            <div className="space-y-3">
                              {items.map((item: ChecklistItem) => (
                                <div
                                  key={item.id}
                                  className="flex items-start gap-3 p-3 border rounded-lg"
                                  data-testid={`checklist-item-${item.id}`}
                                >
                                  <Checkbox
                                    checked={item.completed}
                                    onCheckedChange={() => handleChecklistItemToggle(item)}
                                    data-testid={`checkbox-${item.id}`}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                        {item.name}
                                      </span>
                                      {item.critical && (
                                        <Badge variant="destructive" size="sm">CRITICAL</Badge>
                                      )}
                                      {item.spare && (
                                        <Badge variant="secondary" size="sm">SPARE</Badge>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {item.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm">
                                      {item.quantity > 1 && (
                                        <span>Qty: {item.quantity}</span>
                                      )}
                                      {item.inventoryStatus && (
                                        <Badge variant="outline">
                                          {item.inventoryStatus}
                                        </Badge>
                                      )}
                                      {item.completedAt && (
                                        <span className="text-green-600">
                                          ✓ {new Date(item.completedAt).toLocaleTimeString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <Separator className="my-4" />
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="select-work-order">
              <CardContent className="py-12">
                <div className="text-center">
                  <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a work order from the list to view its details and manage the pre-departure checklist.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}