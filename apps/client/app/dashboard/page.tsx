"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bell,
  Settings,
  Shield,
  Users,
  ChevronLeft,
  ChevronDown,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Moon,
  Sun,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTheme } from "@/components/ThemeProvider";
import { formatDistanceToNow, format } from "date-fns";
import { useWebsites } from "@/hooks/useWebsites";
import { AddWebsiteModal } from "@/components/AddWebsiteModal";

const sidebarItems = [
  { icon: Activity, label: "Dashboard", active: true },
  { icon: BarChart3, label: "Analytics", active: false },
  { icon: Bell, label: "Incidents", active: false },
  { icon: Shield, label: "Status Pages", active: false },
  { icon: Users, label: "Team", active: false },
  { icon: Settings, label: "Settings", active: false },
];

interface StatusIndicatorProps {
  status: "up" | "down" | "degraded";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

function StatusIndicator({
  status,
  size = "md",
  showIcon = false,
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const statusConfig = {
    up: { color: "bg-green-500", icon: CheckCircle, label: "Up" },
    down: { color: "bg-red-500", icon: XCircle, label: "Down" },
    degraded: { color: "bg-yellow-500", icon: AlertCircle, label: "Degraded" },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (showIcon) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center space-x-1"
      >
        <Icon
          className={cn(
            iconSizeClasses[size],
            status === "up"
              ? "text-green-500"
              : status === "down"
                ? "text-red-500"
                : "text-yellow-500"
          )}
        />
        <span className="text-sm font-medium">{config.label}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("rounded-full", sizeClasses[size], config.color)}
    />
  );
}

interface UptimeChartProps {
  data: { timestamp: string; status: "up" | "down" }[];
}

function UptimeChart({ data }: UptimeChartProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          Last 30 minutes (3-minute windows)
        </h4>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <StatusIndicator status="up" size="sm" />
            <span>Up</span>
          </div>
          <div className="flex items-center space-x-1">
            <StatusIndicator status="down" size="sm" />
            <span>Down</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        {data.map((record, index) => (
          <motion.div
            key={record.timestamp}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center space-y-1 group relative"
          >
            <div
              className={`w-6 h-12 rounded-sm transition-all duration-200 ${
                record.status === "up"
                  ? "bg-green-500 hover:bg-green-400"
                  : "bg-red-500 hover:bg-red-400"
              }`}
            />

            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover border border-border rounded-md px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="text-foreground font-medium">
                {record.status === "up" ? "Up" : "Down"}
              </div>
              <div className="text-muted-foreground">
                {format(new Date(record.timestamp), "HH:mm")}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>30 min ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

interface ProcessedWebsite {
  id: string;
  name: string;
  url: string;
  status: "up" | "down" | "degraded";
  uptime: number;
  responseTime: number;
  lastChecked: string;
  uptimeHistory: { timestamp: string; status: "up" | "down" }[];
}

interface WebsiteCardProps {
  website: ProcessedWebsite;
}

function WebsiteCard({ website }: WebsiteCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "down":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "degraded":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardContent className="p-6 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <StatusIndicator status={website.status} size="lg" />

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-foreground">
                        {website.name}
                      </h3>
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {website.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor(website.status)}
                      >
                        {website.uptime}% uptime
                      </Badge>
                      {website.status !== "down" && (
                        <Badge variant="outline">
                          {website.responseTime}ms
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(website.lastChecked), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-6 pb-6 border-t border-border/50">
              <div className="pt-6">
                <UptimeChart data={website.uptimeHistory} />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 rounded-lg">
        <div className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 rounded-lg"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-muted rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-32" />
                  <div className="h-3 bg-muted rounded animate-pulse w-48" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="space-y-2">
                  <div className="h-6 bg-muted rounded animate-pulse w-20" />
                  <div className="h-4 bg-muted rounded animate-pulse w-16" />
                </div>
                <div className="w-4 h-4 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-destructive/20">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <div className="flex-1">
            <h3 className="font-medium text-foreground">
              Failed to load websites
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button onClick={onRetry} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { websites, loading, error, refreshWebsites, addWebsite } =
    useWebsites();

  useEffect(() => {
    setMounted(true);
  }, []);

  const sidebarWidth = isCollapsed ? 64 : 240;

  const handleAddWebsite = async (url: string, name?: string) => {
    return await addWebsite(url, name);
  };

  if (!mounted) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-60 bg-card border-r border-border" />
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <motion.div
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-card border-r border-border flex flex-col flex-shrink-0"
        style={{ width: sidebarWidth }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between min-h-[73px]">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">
                  Better Uptime
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center space-x-2 ml-auto">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-9 h-9 rounded-lg"
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.div>
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isCollapsed ? "justify-center" : "space-x-3",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "space-x-3"
            )}
          >
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-muted-foreground">
                JD
              </span>
            </div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  key="user-info"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-foreground truncate">
                    John Doe
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    john@example.com
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor your services and track uptime performance
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Website
              </Button>
            </motion.div>
          </div>

          {loading && <LoadingState />}

          {error && !loading && (
            <ErrorState error={error} onRetry={refreshWebsites} />
          )}

          {!loading && !error && websites.length === 0 && (
            <Card className="border-dashed border-2">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No websites yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start monitoring your first website by clicking the "Add
                  Website" button above.
                </p>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Website
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && websites.length > 0 && (
            <div className="space-y-4">
              {websites.map((website, index) => (
                <motion.div
                  key={website.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <WebsiteCard website={website} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddWebsiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddWebsite}
        isLoading={loading}
        error={error}
      />
    </div>
  );
}