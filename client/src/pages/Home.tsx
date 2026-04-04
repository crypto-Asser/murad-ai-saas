import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLoginUrl } from '@/const';
import { useLocation } from 'wouter';
import { Zap, BarChart3, Users, MessageSquare } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">Murad AI</div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/admin/dashboard')}
                      className="text-white hover:bg-slate-700"
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/admin/users')}
                      className="text-white hover:bg-slate-700"
                    >
                      Users
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => logout()}
                  className="text-white border-slate-600 hover:bg-slate-700"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Murad AI SaaS Platform
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Production-grade AI Telegram bot with advanced analytics and management dashboard
          </p>
          {!isAuthenticated && (
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-purple-600 hover:bg-purple-700 text-lg px-8"
            >
              Get Started
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Zap className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Fully async architecture for maximum performance
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Real-time Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Monitor bot performance and user engagement
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Users className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Complete control over system users and roles
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">AI Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Powered by Groq's fastest AI models
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">100%</div>
            <p className="text-slate-300">Async/Await</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">Production</div>
            <p className="text-slate-300">Ready</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">Scalable</div>
            <p className="text-slate-300">Architecture</p>
          </div>
        </div>

        {/* Tech Stack */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Tech Stack</CardTitle>
            <CardDescription>Built with modern technologies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-slate-300 font-semibold">Backend</p>
                <p className="text-slate-400 text-sm">Express + tRPC</p>
              </div>
              <div className="text-center">
                <p className="text-slate-300 font-semibold">Frontend</p>
                <p className="text-slate-400 text-sm">React 19 + Tailwind</p>
              </div>
              <div className="text-center">
                <p className="text-slate-300 font-semibold">Database</p>
                <p className="text-slate-400 text-sm">MySQL + Drizzle ORM</p>
              </div>
              <div className="text-center">
                <p className="text-slate-300 font-semibold">Bot</p>
                <p className="text-slate-400 text-sm">Telegraf + Groq API</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-400">
          <p>Murad AI SaaS Platform © 2026. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
