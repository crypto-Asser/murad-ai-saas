import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Activity, Users, MessageSquare, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // API calls
  const statsQuery = trpc.admin.getStats.useQuery(undefined, {
    refetchInterval: refreshInterval
  });

  const systemStatusQuery = trpc.admin.getSystemStatus.useQuery(undefined, {
    refetchInterval: refreshInterval
  });

  const logsQuery = trpc.admin.getLogs.useQuery({ limit: 20 });
  const errorsQuery = trpc.admin.getErrors.useQuery({ limit: 10 });
  const errorStatsQuery = trpc.admin.getErrorStats.useQuery();

  const startBotMutation = trpc.admin.startBot.useMutation();
  const stopBotMutation = trpc.admin.stopBot.useMutation();

  // Check authorization
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = statsQuery.data;
  const systemStatus = systemStatusQuery.data;
  const logs = logsQuery.data || [];
  const errors = errorsQuery.data || [];
  const errorStats = errorStatsQuery.data;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Murad AI Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            System monitoring and bot management
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.telegram.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active: {stats.telegram.activeUsers}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversations}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Queue Length
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.telegram.queueLength}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {errorStats?.totalErrors || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bot-control">Bot Control</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Real-time system information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {systemStatus && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                        <p className="text-lg font-semibold">
                          {Math.floor(systemStatus.uptime / 60)} minutes
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Memory Usage</p>
                        <p className="text-lg font-semibold">
                          {Math.round(systemStatus.memory.heapUsed / 1024 / 1024)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bot Control Tab */}
          <TabsContent value="bot-control" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bot Management</CardTitle>
                <CardDescription>
                  Start or stop the Telegram bot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    onClick={() => startBotMutation.mutate()}
                    disabled={startBotMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {startBotMutation.isPending ? 'Starting...' : 'Start Bot'}
                  </Button>
                  <Button
                    onClick={() => stopBotMutation.mutate()}
                    disabled={stopBotMutation.isPending}
                    variant="destructive"
                  >
                    {stopBotMutation.isPending ? 'Stopping...' : 'Stop Bot'}
                  </Button>
                </div>

                {startBotMutation.data && (
                  <Alert>
                    <AlertDescription className="text-green-600">
                      {startBotMutation.data.message}
                    </AlertDescription>
                  </Alert>
                )}

                {stopBotMutation.data && (
                  <Alert>
                    <AlertDescription className="text-green-600">
                      {stopBotMutation.data.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Logs</CardTitle>
                <CardDescription>
                  Last 20 system logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.length > 0 ? (
                    logs.map((log, idx) => (
                      <div
                        key={idx}
                        className="text-sm p-2 bg-muted rounded border-l-4 border-blue-500"
                      >
                        <div className="flex justify-between">
                          <span className="font-mono text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-xs font-semibold">{log.level}</span>
                        </div>
                        <p className="mt-1">{log.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No logs available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Tracking</CardTitle>
                <CardDescription>
                  Recent errors and issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {errors.length > 0 ? (
                    errors.map((error, idx) => (
                      <div
                        key={idx}
                        className="text-sm p-3 bg-red-50 dark:bg-red-950 rounded border-l-4 border-red-500"
                      >
                        <div className="flex justify-between">
                          <span className="font-semibold text-red-700 dark:text-red-300">
                            {error.type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(error.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="mt-1 text-red-600 dark:text-red-400">
                          {error.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No errors</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  Detailed system metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {systemStatus && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Heap Used</p>
                        <p className="text-lg font-semibold">
                          {Math.round(systemStatus.memory.heapUsed / 1024 / 1024)} MB
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Heap Total</p>
                        <p className="text-lg font-semibold">
                          {Math.round(systemStatus.memory.heapTotal / 1024 / 1024)} MB
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Error Summary</p>
                      <div className="space-y-1">
                        {systemStatus.errors && Object.entries(systemStatus.errors.byType).map(
                          ([type, count]: [string, any]) => (
                            <div key={type} className="flex justify-between text-sm">
                              <span>{type}</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
