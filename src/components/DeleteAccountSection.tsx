import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";

export function DeleteAccountSection() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-user");
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Account deleted successfully. All your data has been removed.");
      navigate(localizedPath("/", language));
    } catch (err: any) {
      console.error("Delete account error:", err);
      toast.error(err?.message || "Failed to delete account. Please try again or contact support.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Delete Your Account
          </DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. All your data, points, referrals, and order history will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
            <AlertDescription className="text-sm">
              <strong>Warning:</strong> This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Your profile and account data</li>
                <li>All earned points and rewards</li>
                <li>Referral history and commissions</li>
                <li>Contribution data and sessions</li>
                <li>Order history (PII will be anonymized)</li>
              </ul>
            </AlertDescription>
          </Alert>
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Type <strong className="text-red-400">DELETE</strong> to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="font-mono"
            />
          </div>
          <Button
            variant="destructive"
            className="w-full"
            disabled={confirmText !== "DELETE" || deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting account...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Permanently Delete Account
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
