"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const noopSubscribe = () => () => {};

/** true seulement après l'hydratation client — évite le flash sun/moon dû au thème inconnu côté serveur, sans setState dans un effect. */
function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  function toggle() {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    if (typeof document.startViewTransition === "function") {
      document.startViewTransition(() => setTheme(next));
    } else {
      setTheme(next);
    }
  }

  if (!mounted) return <Button variant="ghost" size="icon" aria-hidden className="opacity-0" />;

  const isDark = resolvedTheme === "dark";

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Changer de thème">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="flex"
        >
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
