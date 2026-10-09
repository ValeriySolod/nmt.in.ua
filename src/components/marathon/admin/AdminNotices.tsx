"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import css from "../marathon.module.css";

const HideSavedContext = createContext<() => void>(() => {});

export function useHideSaved(): () => void {
  return useContext(HideSavedContext);
}

export function AdminNotices({
  saved,
  savedText,
  error,
  children,
}: {
  saved: boolean;
  savedText: string;
  error: string | null;
  children: ReactNode;
}) {
  const [showSaved, setShowSaved] = useState(saved);
  return (
    <HideSavedContext.Provider value={() => setShowSaved(false)}>
      <div className={css.stack}>
        {showSaved ? (
          <p className={css.alert} role="status">
            {savedText}
          </p>
        ) : null}
        {error ? (
          <p className={css.alertError} role="alert">
            {error}
          </p>
        ) : null}
        {children}
      </div>
    </HideSavedContext.Provider>
  );
}
