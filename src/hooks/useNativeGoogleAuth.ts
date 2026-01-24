import { supabase } from "@/integrations/supabase/client";
import { validateRedirectUrl } from "@/utils/secureRedirect";

export function useNativeGoogleAuth() {
  const signIn = async (redirectParam?: string | null) => {
    const redirect = validateRedirectUrl(redirectParam || null);

    // Works for Web + iOS/Android (opens system browser, returns via deep link)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/oauth-redirect?redirect=${encodeURIComponent(
          redirect
        )}`,
        skipBrowserRedirect: true,
      } as any,
    });

    if (error) throw error;
  };

  return { signIn };
}
