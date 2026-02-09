import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, CheckCircle, MessageSquare, BookOpen, TrendingUp, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    retry: false,
  });

  if (error && isUnauthorizedError(error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = "/work-orders"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Work Orders</p>
                <p className="text-2xl font-bold text-primary">5</p>
                <p className="text-xs text-gray-500">2 urgent</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = "/ai-assistant"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Assistant</p>
                <p className="text-2xl font-bold text-blue-600">Ready</p>
                <p className="text-xs text-gray-500">GPT-4 Active</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = "/camera-ar"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Camera & AR</p>
                <p className="text-2xl font-bold text-green-600">Ready</p>
                <p className="text-xs text-gray-500">Scan equipment</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = "/training"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Training</p>
                <p className="text-2xl font-bold text-orange-600">3</p>
                <p className="text-xs text-gray-500">modules available</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50 rounded">
            <Clock className="h-5 w-5 text-blue-600" />
            <div className="text-blue-600 font-semibold">9:00 AM</div>
            <div>
              <p className="font-medium">Shell Station - Pump 3 Repair</p>
              <p className="text-sm text-gray-600">Error code E7 - Flow meter issue</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 border-l-4 border-green-500 bg-green-50 rounded">
            <MapPin className="h-5 w-5 text-green-600" />
            <div className="text-green-600 font-semibold">2:00 PM</div>
            <div>
              <p className="font-medium">Mobil Station - Tank Inspection</p>
              <p className="text-sm text-gray-600">Monthly safety check</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 border-l-4 border-orange-500 bg-orange-50 rounded">
            <BookOpen className="h-5 w-5 text-orange-600" />
            <div className="text-orange-600 font-semibold">4:30 PM</div>
            <div>
              <p className="font-medium">Training Module - Safety Procedures</p>
              <p className="text-sm text-gray-600">Due today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Work Orders Completed</span>
              <span className="font-medium text-green-600">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI Questions Asked</span>
              <span className="font-medium text-blue-600">28</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Training Progress</span>
              <span className="font-medium text-orange-600">75%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Photos Analyzed</span>
              <span className="font-medium text-purple-600">15</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}