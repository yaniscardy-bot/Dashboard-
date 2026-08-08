"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Échec de la déconnexion", { description: mapSupabaseError(error) });
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" className="justify-start gap-2 px-2" onClick={handleLogout}>
      <LogOut className="size-3.5" />
      Se déconnecter
    </Button>
  );
}
