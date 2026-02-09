import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GraduationCap, CheckCircle, Play, Star, Clock, Trophy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

const trainingModules = [
  {
    id: "safety-basics",
    title: "Safety Fundamentals",
    description: "Essential safety procedures for gas station work",
    duration: "45 min",
    difficulty: "Beginner",
    progress: 100,
    status: "completed",
    points: 150
  },
  {
    id: "pump-repair",
    title: "Fuel Pump Diagnostics",
    description: "Learn to diagnose and repair common pump issues",
    duration: "90 min", 
    difficulty: "Intermediate",
    progress: 60,
    status: "in_progress",
    points: 250
  },
  {
    id: "tank-inspection",
    title: "Underground Tank Systems",
    description: "Tank inspection and leak detection procedures",
    duration: "75 min",
    difficulty: "Advanced",
    progress: 0,
    status: "not_started",
    points: 300
  },
  {
    id: "electrical-systems",
    title: "Electrical Systems",
    description: "Electrical troubleshooting and maintenance",
    duration: "60 min",
    difficulty: "Intermediate", 
    progress: 0,
    status: "not_started",
    points: 200
  }
];

export default function Training() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const overallProgress = Math.round(
    trainingModules.reduce((acc, module) => acc + module.progress, 0) / trainingModules.length
  );

  const totalPoints = trainingModules
    .filter(m => m.status === "completed")
    .reduce((acc, m) => acc + m.points, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800"><Play className="h-3 w-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline">Start Training</Badge>;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "text-green-600";
      case "Intermediate": return "text-yellow-600";
      case "Advanced": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const startModule = (moduleId: string) => {
    toast({
      title: "Module Started",
      description: "Opening training module...",
    });
    // Here you would navigate to the actual training content
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Training Center</h1>
        <p className="text-gray-600">Master gas station maintenance skills</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
              </div>
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <Progress value={overallProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Points Earned</p>
                <p className="text-2xl font-bold text-yellow-600">{totalPoints}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4">Available Modules</h2>
        
        {trainingModules.map((module) => (
          <Card key={module.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{module.title}</h3>
                    {getStatusBadge(module.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{module.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm ${getDifficultyColor(module.difficulty)}`}>
                        {module.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Trophy className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{module.points} pts</span>
                    </div>
                  </div>

                  {module.progress > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-900">{module.progress}%</span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => startModule(module.id)}
                  className="ml-4"
                  variant={module.status === "completed" ? "outline" : "default"}
                >
                  {module.status === "completed" ? "Review" : 
                   module.status === "in_progress" ? "Continue" : "Start"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievement Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Recent Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Trophy className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Safety Expert</p>
                <p className="text-xs text-gray-600">Completed all safety training modules</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Star className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Quick Learner</p>
                <p className="text-xs text-gray-600">Completed first module in record time</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}