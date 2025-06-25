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

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * Sidebar navigation items configuration
 * Each item has an icon, label, and active state
 */
const sidebarItems = [
  { icon: Activity, label: "Dashboard", active: true },
  { icon: BarChart3, label: "Analytics", active: false },
  { icon: Bell, label: "Incidents", active: false },
  { icon: Shield, label: "Status Pages", active: false },
  { icon: Users, label: "Team", active: false },
  { icon: Settings, label: "Settings", active: false },
];

// ============================================================================
// STATUS INDICATOR COMPONENT
// ============================================================================

/**
 * StatusIndicator - Displays website status with visual indicators
 *
 * Features:
 * - Three status types: up (green), down (red), degraded (yellow)
 * - Multiple sizes: sm, md, lg
 * - Two display modes: dot indicator or icon with label
 * - Smooth animations on mount
 *
 * @param status - Current website status
 * @param size - Size variant for the indicator
 * @param showIcon - Whether to show icon with label or just dot
 */
function StatusIndicator({
  status,
  size = "md",
  showIcon = false,
}: {
  status: "up" | "down" | "degraded";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}) {
  // Size configurations for dot indicators
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  // Size configurations for icon indicators
  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  // Status configuration mapping
  const statusConfig = {
    up: { color: "bg-green-500", icon: CheckCircle, label: "Up" },
    down: { color: "bg-red-500", icon: XCircle, label: "Down" },
    degraded: { color: "bg-yellow-500", icon: AlertCircle, label: "Degraded" },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // Render icon with label variant
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

  // Render simple dot indicator
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("rounded-full", sizeClasses[size], config.color)}
    />
  );
}

// ============================================================================
// UPTIME CHART COMPONENT
// ============================================================================

/**
 * UptimeChart - Displays historical uptime data as a bar chart
 *
 * Features:
 * - Shows last 30 minutes of data in 3-minute windows
 * - Interactive bars with hover tooltips
 * - Color-coded status (green=up, red=down)
 * - Staggered animation on mount
 * - Time labels for context
 *
 * @param data - Array of uptime records with timestamp and status
 */
function UptimeChart({
  data,
}: {
  data: { timestamp: string; status: "up" | "down" }[];
}) {
  return (
    <div className="space-y-4">
      {/* Chart Header with Legend */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          Last 30 minutes (3-minute windows)
        </h4>
        {/* Status Legend */}
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

      {/* Chart Bars Container */}
      <div className="flex items-center space-x-1">
        {data.map((record, index) => (
          <motion.div
            key={record.timestamp}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }} // Staggered animation
            className="flex flex-col items-center space-y-1 group relative"
          >
            {/* Status Bar */}
            <div
              className={`w-6 h-12 rounded-sm transition-all duration-200 ${
                record.status === "up"
                  ? "bg-green-500 hover:bg-green-400"
                  : "bg-red-500 hover:bg-red-400"
              }`}
            />

            {/* Hover Tooltip */}
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

      {/* Time Range Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>30 min ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

// ============================================================================
// WEBSITE CARD COMPONENT
// ============================================================================

/**
 * WebsiteCard - Individual website monitoring card
 *
 * Features:
 * - Collapsible design with uptime chart
 * - Status indicator with color coding
 * - Uptime percentage and response time badges
 * - External link to website
 * - Last checked timestamp
 * - Smooth hover animations
 *
 * @param website - Website data object with status, metrics, and history
 */
function WebsiteCard({ website }: { website: any }) {
  // State for controlling card expansion
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Returns appropriate CSS classes for status badge styling
   * @param status - Website status string
   * @returns CSS class string for badge styling
   */
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
      whileHover={{ scale: 1.01 }} // Subtle hover scale effect
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* Main Card Content - Always Visible */}
          <CollapsibleTrigger asChild>
            <CardContent className="p-6 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                {/* Left Section: Status & Website Info */}
                <div className="flex items-center space-x-4">
                  <StatusIndicator status={website.status} size="lg" />

                  <div className="space-y-1">
                    {/* Website Name & External Link */}
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-foreground">
                        {website.name}
                      </h3>
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()} // Prevent card expansion
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {/* Website URL */}
                    <p className="text-sm text-muted-foreground">
                      {website.url}
                    </p>
                  </div>
                </div>

                {/* Right Section: Metrics & Expand Button */}
                <div className="flex items-center space-x-4">
                  {/* Metrics Display */}
                  <div className="text-right space-y-1">
                    {/* Status Badges */}
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor(website.status)}
                      >
                        {website.uptime}% uptime
                      </Badge>
                      {/* Only show response time if website is not down */}
                      {website.status !== "down" && (
                        <Badge variant="outline">
                          {website.responseTime}ms
                        </Badge>
                      )}
                    </div>
                    {/* Last Checked Timestamp */}
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(website.lastChecked), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Expand/Collapse Chevron */}
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

          {/* Expandable Content - Uptime Chart */}
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

// ============================================================================
// THEME TOGGLE COMPONENT
// ============================================================================

/**
 * ThemeToggle - Dark/Light theme switcher button
 *
 * Features:
 * - Smooth icon transitions between sun/moon
 * - Prevents hydration issues with mounted state
 * - Accessible with screen reader support
 */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show placeholder during SSR to prevent hydration issues
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
      onClick={() => setTheme(theme === "dark" ? "dark" : "light")}
      className="w-9 h-9 rounded-lg"
    >
      {/* Sun icon - visible in light mode */}
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      {/* Moon icon - visible in dark mode */}
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

/**
 * LoadingState - Skeleton loading animation for website cards
 *
 * Features:
 * - Mimics the structure of actual website cards
 * - Pulse animations for visual feedback
 * - Multiple skeleton cards for realistic loading state
 */
function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left side skeleton */}
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-muted rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-32" />
                  <div className="h-3 bg-muted rounded animate-pulse w-48" />
                </div>
              </div>
              {/* Right side skeleton */}
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

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

/**
 * ErrorState - Error display with retry functionality
 *
 * Features:
 * - Clear error message display
 * - Retry button for user action
 * - Warning icon for visual emphasis
 * - Destructive color scheme for error indication
 *
 * @param error - Error message to display
 * @param onRetry - Callback function for retry action
 */
function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
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

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

/**
 * Dashboard Page - Main monitoring dashboard interface
 *
 * Architecture:
 * - Responsive sidebar with collapsible navigation
 * - Main content area with website monitoring cards
 * - Modal for adding new websites
 * - Loading, error, and empty states
 *
 * Features:
 * - Real-time website monitoring data
 * - Animated sidebar collapse/expand
 * - Theme switching capability
 * - Add website functionality
 * - Responsive design
 */
export default function DashboardPage() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Client-side mounting state (prevents hydration issues)
  const [mounted, setMounted] = useState(false);

  // Add website modal visibility state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Website data and operations from custom hook
  const { websites, loading, error, refreshWebsites, addWebsite } =
    useWebsites();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Set mounted state after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Calculate sidebar width based on collapse state
  const sidebarWidth = isCollapsed ? 64 : 240;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles adding a new website
   * @param url - Website URL to monitor
   * @param name - Optional display name for the website
   * @returns Promise<boolean> - Success status
   */
  const handleAddWebsite = async (url: string, name?: string) => {
    return await addWebsite(url, name);
  };

  // ============================================================================
  // RENDER GUARDS
  // ============================================================================

  // Show loading skeleton during SSR/initial mount
  if (!mounted) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-60 bg-card border-r border-border" />
        <div className="flex-1" />
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="flex h-screen bg-background">
      {/* ========================================================================
          SIDEBAR SECTION
          ======================================================================== */}
      <motion.div
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-card border-r border-border flex flex-col flex-shrink-0"
        style={{ width: sidebarWidth }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between min-h-[73px]">
          {/* Brand Logo & Name (hidden when collapsed) */}
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

          {/* Header Controls */}
          <div className="flex items-center space-x-2 ml-auto">
            <ThemeToggle />
            {/* Sidebar Collapse Toggle */}
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

        {/* Sidebar Navigation */}
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
                {/* Navigation Label (hidden when collapsed) */}
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

        {/* Sidebar Footer - User Info */}
        <div className="p-4 border-t border-border">
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "space-x-3"
            )}
          >
            {/* User Avatar */}
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-muted-foreground">
                JD
              </span>
            </div>
            {/* User Info (hidden when collapsed) */}
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

      {/* ========================================================================
          MAIN CONTENT SECTION
          ======================================================================== */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor your services and track uptime performance
              </p>
            </div>

            {/* Add Website Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Website
              </Button>
            </motion.div>
          </div>

          {/* ====================================================================
              CONTENT STATES - Loading, Error, Empty, Success
              ==================================================================== */}

          {/* Loading State */}
          {loading && <LoadingState />}

          {/* Error State */}
          {error && !loading && (
            <ErrorState error={error} onRetry={refreshWebsites} />
          )}

          {/* Empty State - No Websites */}
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

          {/* Success State - Website Cards */}
          {!loading && !error && websites.length > 0 && (
            <div className="space-y-4">
              {websites.map((website, index) => (
                <motion.div
                  key={website.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }} // Staggered animation
                >
                  <WebsiteCard website={website} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================
          MODAL SECTION
          ======================================================================== */}

      {/* Add Website Modal */}
      <AddWebsiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddWebsite}
      />
    </div>
  );
}
