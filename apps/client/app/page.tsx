"use client";
import LandingPage from "@/components/LandingPage";
import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";

export default function Home() {
  return (
    <ThemeProvider>
      <LandingPage />
    </ThemeProvider>
  );
}
