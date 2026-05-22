"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { HistoryItem } from "@/lib/types";

interface HistoryContextType {
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, "timestamp">) => void;
  clearHistory: () => void;
  removeFromHistory: (animeId: string, episode: number) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

const STORAGE_KEY = "animeflv-history";

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // localStorage not available
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch {
        // localStorage not available
      }
    }
  }, [history, loaded]);

  const addToHistory = (item: Omit<HistoryItem, "timestamp">) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (h) => !(h.animeId === item.animeId && h.episode === item.episode)
      );
      return [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 100);
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const removeFromHistory = (animeId: string, episode: number) => {
    setHistory((prev) =>
      prev.filter(
        (h) => !(h.animeId === animeId && h.episode === episode)
      )
    );
  };

  return (
    <HistoryContext.Provider
      value={{ history, addToHistory, clearHistory, removeFromHistory }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}
