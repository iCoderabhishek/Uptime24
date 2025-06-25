"use client";

// import { API_URL } from "@/config";
// import { useAuth } from "@clerk/nextjs";
// import axios from "axios";
// import { useEffect, useState } from "react";

// interface Website {
//   id: String;
//   url: String;
//   ticks: {
//     id: String;
//     createdAt: String;
//     status: String;
//     latency: Number;
//   };
// }

// export async function useWebsites() {
//   const [websites, setWebsites] = useState<Website[]>([]);
//   const { getToken } = useAuth();
//   const token = await getToken();
//   async function refreshWebsites() {
//     const response = await axios.get(`${API_URL}/api/v1/websites`, {
//       headers: {
//         Authorization: token,
//       },
//     });
//   }

//   useEffect(() => {
//     refreshWebsites();

//     const interval = setInterval(
//       () => {
//         refreshWebsites();
//       },
//       1000 * 60 * 1
//     );

//     return () => clearInterval(interval);
//   }, []);
//   return websites;
// }

import { API_URL } from "@/config";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useEffect, useState } from "react";

interface Tick {
  id: string;
  createdAt: string;
  status: "up" | "down";
  latency: number;
}

interface Website {
  id: string;
  url: string;
  name?: string;
  ticks: Tick[];
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

// Aggregate ticks into 3-minute windows
function aggregateTicksTo3MinuteWindows(
  ticks: Tick[]
): { timestamp: string; status: "up" | "down" }[] {
  if (!ticks.length) return [];

  const windows: { timestamp: string; status: "up" | "down" }[] = [];
  const now = new Date();

  // Create 10 windows of 3 minutes each (30 minutes total)
  for (let i = 9; i >= 0; i--) {
    const windowStart = new Date(now.getTime() - i * 3 * 60 * 1000);
    const windowEnd = new Date(windowStart.getTime() + 3 * 60 * 1000);

    // Find ticks in this window
    const windowTicks = ticks.filter((tick) => {
      const tickTime = new Date(tick.createdAt);
      return tickTime >= windowStart && tickTime < windowEnd;
    });

    // Determine window status (down if any tick is down, up otherwise)
    const hasDownTick = windowTicks.some((tick) => tick.status === "down");
    const status = hasDownTick ? "down" : "up";

    windows.push({
      timestamp: windowStart.toISOString(),
      status,
    });
  }

  return windows;
}

// Process raw website data into dashboard format
function processWebsiteData(websites: Website[]): ProcessedWebsite[] {
  return websites.map((website) => {
    const recentTicks = website.ticks.slice(-100); // Last 100 ticks for analysis
    const uptimeHistory = aggregateTicksTo3MinuteWindows(recentTicks);

    // Calculate uptime percentage
    const upTicks = recentTicks.filter((tick) => tick.status === "up").length;
    const uptime =
      recentTicks.length > 0 ? (upTicks / recentTicks.length) * 100 : 0;

    // Calculate average response time (excluding down ticks)
    const upTicksWithLatency = recentTicks.filter(
      (tick) => tick.status === "up" && tick.latency > 0
    );
    const avgResponseTime =
      upTicksWithLatency.length > 0
        ? upTicksWithLatency.reduce((sum, tick) => sum + tick.latency, 0) /
          upTicksWithLatency.length
        : 0;

    // Determine current status
    const lastTick = recentTicks[recentTicks.length - 1];
    let status: "up" | "down" | "degraded" = "up";

    if (!lastTick || lastTick.status === "down") {
      status = "down";
    } else if (avgResponseTime > 1000 || uptime < 98) {
      status = "degraded";
    }

    return {
      id: website.id,
      name: website.name || extractDomainName(website.url),
      url: website.url,
      status,
      uptime: Math.round(uptime * 100) / 100,
      responseTime: Math.round(avgResponseTime),
      lastChecked: lastTick?.createdAt || new Date().toISOString(),
      uptimeHistory,
    };
  });
}

// Extract domain name from URL for display
function extractDomainName(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace("www.", "");
  } catch {
    return url;
  }
}

export function useWebsites() {
  const [websites, setWebsites] = useState<ProcessedWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const refreshWebsites = async () => {
    try {
      setError(null);
      const token = await getToken();

      const response = await axios.get(`${API_URL}/api/v1/websites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const rawWebsites: Website[] = response.data;
      const processedWebsites = processWebsiteData(rawWebsites);
      setWebsites(processedWebsites);
    } catch (err) {
      console.error("Failed to fetch websites:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch websites");
    } finally {
      setLoading(false);
    }
  };

  const addWebsite = async (url: string, name?: string) => {
    try {
      const token = await getToken();

      await axios.post(
        `${API_URL}/api/v1/websites`,
        {
          url,
          name,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Refresh the list after adding
      await refreshWebsites();
      return true;
    } catch (err) {
      console.error("Failed to add website:", err);
      setError(err instanceof Error ? err.message : "Failed to add website");
      return false;
    }
  };

  useEffect(() => {
    refreshWebsites();

    const interval = setInterval(
      () => {
        refreshWebsites();
      },
      1000 * 60 * 1
    ); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  return {
    websites,
    loading,
    error,
    refreshWebsites,
    addWebsite,
  };
}
