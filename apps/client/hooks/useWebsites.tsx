"use client";

import { API_URL } from "@/config";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useEffect, useState } from "react";

interface Tick {
  id: string;
  websiteId: string;
  validatorId: string;
  createdAt: string;
  status: "Good" | "Bad";
  latency: number;
}

interface Website {
  id: string;
  url: string;
  userId: string;
  disabled: boolean;
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

function aggregateTicksTo3MinuteWindows(
  ticks: Tick[]
): { timestamp: string; status: "up" | "down" }[] {
  if (!ticks.length) return [];

  const windows: { timestamp: string; status: "up" | "down" }[] = [];
  const now = new Date();

  for (let i = 9; i >= 0; i--) {
    const windowStart = new Date(now.getTime() - i * 3 * 60 * 1000);
    const windowEnd = new Date(windowStart.getTime() + 3 * 60 * 1000);

    const windowTicks = ticks.filter((tick) => {
      const tickTime = new Date(tick.createdAt);
      return tickTime >= windowStart && tickTime < windowEnd;
    });

    const hasDownTick = windowTicks.some((tick) => tick.status === "Bad");
    const status = hasDownTick ? "down" : "up";

    windows.push({
      timestamp: windowStart.toISOString(),
      status,
    });
  }

  return windows;
}

function processWebsiteData(websites: Website[]): ProcessedWebsite[] {
  return websites.map((website) => {
    const recentTicks = website.ticks.slice(-100);
    const uptimeHistory = aggregateTicksTo3MinuteWindows(recentTicks);

    const upTicks = recentTicks.filter((tick) => tick.status === "Good").length;
    const uptime =
      recentTicks.length > 0 ? (upTicks / recentTicks.length) * 100 : 0;

    const upTicksWithLatency = recentTicks.filter(
      (tick) => tick.status === "Good" && tick.latency > 0
    );
    const avgResponseTime =
      upTicksWithLatency.length > 0
        ? upTicksWithLatency.reduce((sum, tick) => sum + tick.latency, 0) /
          upTicksWithLatency.length
        : 0;

    const lastTick = recentTicks[recentTicks.length - 1];
    let status: "up" | "down" | "degraded" = "up";

    if (!lastTick || lastTick.status === "Bad") {
      status = "down";
    } else if (avgResponseTime > 1000 || uptime < 98) {
      status = "degraded";
    }

    return {
      id: website.id,
      name: extractDomainName(website.url),
      url: website.url,
      status,
      uptime: Math.round(uptime * 100) / 100,
      responseTime: Math.round(avgResponseTime),
      lastChecked: lastTick?.createdAt || new Date().toISOString(),
      uptimeHistory,
    };
  });
}

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
        `${API_URL}/api/v1/website`,
        { url },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

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

    const interval = setInterval(refreshWebsites, 1000 * 60 * 1);

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