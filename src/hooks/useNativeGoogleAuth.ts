import { supabase } from "@/integrations/supabase/client";
import { validateRedirectUrl } from "@/utils/secureRedirect";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

// Use production domain for OAuth redirects on native platforms
const getOAuthRedirectBase = () => {
  if (Capacitor.isNativePlatform()) {
    // Native apps must redirect to web domain, not capacitor://localhost
    return "https://nomiqa.lovable.app";
  }
  return window.location.origin;
};

export function useNativeGoogleAuth() {
  const signIn = async (redirectParam?: string | null) => {
    const redirect = validateRedirectUrl(redirectParam || null);
    const redirectBase = getOAuthRedirectBase();

    // Get the OAuth URL from Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${redirectBase}/app/oauth-redirect?redirect=${encodeURIComponent(
          redirect
        )}`,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    // On native platforms, open the OAuth URL in system browser
    if (Capacitor.isNativePlatform() && data?.url) {
      await Browser.open({ url: data.url });
    } else if (data?.url) {
      // Web fallback
      window.location.href = data.url;
    }
  };

  return { signIn };
}
