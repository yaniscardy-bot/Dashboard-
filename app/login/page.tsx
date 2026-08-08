"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus("idle");
      toast.error("Échec de l'envoi", { description: mapSupabaseError(error) });
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-xl">Habit Tracker</CardTitle>
            <CardDescription>Connexion par lien magique — aucun mot de passe.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {status === "sent" ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="flex flex-col items-center gap-3 py-6 text-center"
                >
                  <MailCheck className="size-10 text-primary" />
                  <p className="text-sm text-foreground">
                    Lien envoyé à <strong>{email}</strong>. Ouvrez-le depuis cet appareil pour vous connecter.
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setStatus("idle")}>
                    Utiliser une autre adresse
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoFocus
                      autoComplete="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={status === "sending"}>
                    {status === "sending" ? "Envoi…" : "Recevoir le lien magique"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
