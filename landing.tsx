import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, MessageSquare, Mic, Camera, User, Lock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/local/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        toast({
          title: "Login successful",
          description: "Welcome to Petro Plus AI!",
        });
        window.location.href = '/ai-assistant';
      } else {
        const error = await response.json();
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center overflow-hidden">
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
                <span className="text-gray-600 font-bold text-xs" style={{display: 'none'}}>P+</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Petro Plus AI</h1>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = "/api/login"} 
                size="lg"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Login
              </Button>
              <Button 
                onClick={() => window.location.href = "/api/login"} 
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Expert Knowledge
            <span className="text-green-600 block">When You Need It Most</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered assistance, visual diagnostics, and mobile-first design to improve technician productivity and service quality.
          </p>
          <div className="flex justify-center items-center space-x-6 mb-8">
            <div className="flex items-center space-x-2 text-gray-700">
              <Mic className="h-6 w-6 text-green-600" />
              <span>"Reset Wayne Ovation Error 25"</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Camera className="h-6 w-6 text-green-600" />
              <span>"Submersible pump not building pressure"</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <MessageSquare className="h-6 w-6 text-green-600" />
              <span>"How to calibrate Gilbarco Encore meter"</span>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = "/api/login"} 
            size="lg" 
            className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700 text-white"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Test Login Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🚀 Field Testing Access
            </h2>
            <div className="bg-green-100 border-l-4 border-green-500 p-4 max-w-2xl mx-auto mb-4">
              <p className="text-lg font-semibold text-green-800">
                Ready for field testing! Use these demo accounts:
              </p>
            </div>
            <p className="text-lg text-gray-600">
              No Replit account needed - just use the credentials below
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Test Credentials */}
            <Card className="bg-white border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Demo Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-800 mb-2 text-lg">👷 Field Technician</h4>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-lg font-mono text-gray-900 mb-1"><strong>Username:</strong> tech1</p>
                    <p className="text-lg font-mono text-gray-900 mb-1"><strong>Password:</strong> test123</p>
                  </div>
                  <p className="text-sm text-green-700 mt-2">✅ AI Assistant • Work Orders • Mobile Features</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2 text-lg">👨‍💼 Manager</h4>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-lg font-mono text-gray-900 mb-1"><strong>Username:</strong> manager1</p>
                    <p className="text-lg font-mono text-gray-900 mb-1"><strong>Password:</strong> test123</p>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">✅ Dashboard • Reports • Team Management</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-2">👷 Backup Technician</h4>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-lg font-mono text-gray-900 mb-1"><strong>Username:</strong> tech2</p>
                    <p className="text-lg font-mono text-gray-900 mb-1"><strong>Password:</strong> test123</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">✅ Secondary access for testing</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Login Form */}
            <Card className="bg-white border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Login
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLocalLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter username (e.g., tech1)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full"
                      data-testid="input-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full"
                      data-testid="input-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In to Test'}
                  </Button>
                </form>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center mb-3">
                    Or use Replit OAuth:
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = "/api/login"}
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    data-testid="button-replit-login"
                  >
                    Login with Replit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
