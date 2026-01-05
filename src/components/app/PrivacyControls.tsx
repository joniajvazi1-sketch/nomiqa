import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  MapPin, 
  Smartphone, 
  Eye, 
  Trash2, 
  ExternalLink,
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PRIVACY_PREFS_KEY = 'nomiqa_privacy_prefs';

interface PrivacyPreferences {
  collectInBackground: boolean;
  shareExactLocation: boolean;
  includeDeviceInfo: boolean;
}

const defaultPrefs: PrivacyPreferences = {
  collectInBackground: true,
  shareExactLocation: true,
  includeDeviceInfo: true
};

export const PrivacyControls: React.FC = () => {
  const { toast } = useToast();
  const { lightTap, success, warning } = useHaptics();
  const [prefs, setPrefs] = useState<PrivacyPreferences>(defaultPrefs);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem(PRIVACY_PREFS_KEY);
    if (saved) {
      try {
        setPrefs(JSON.parse(saved));
      } catch {
        // Use defaults
      }
    }
  }, []);

  const savePrefs = (newPrefs: PrivacyPreferences) => {
    setPrefs(newPrefs);
    localStorage.setItem(PRIVACY_PREFS_KEY, JSON.stringify(newPrefs));
  };

  const handleToggle = (key: keyof PrivacyPreferences) => {
    lightTap();
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    savePrefs(newPrefs);
    toast({ 
      title: 'Preference saved',
      description: `${key === 'collectInBackground' ? 'Background collection' : 
                     key === 'shareExactLocation' ? 'Location precision' : 
                     'Device info'} ${newPrefs[key] ? 'enabled' : 'disabled'}`
    });
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the request_data_deletion function
      const { error } = await supabase.rpc('request_data_deletion', {
        requesting_user_id: user.id
      });

      if (error) throw error;

      warning(); // Haptic feedback
      toast({
        title: 'Data deletion requested',
        description: 'Your data will be anonymized within 24 hours.'
      });
      setDeleteConfirmOpen(false);
    } catch (error: any) {
      console.error('Error requesting data deletion:', error);
      toast({
        title: 'Failed to request deletion',
        description: error.message || 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Privacy Overview */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/20 mt-0.5">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Your Privacy Matters</h3>
              <p className="text-xs text-muted-foreground">
                Control how your data is collected and used. All network data is anonymized before being shared.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Toggles */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0 divide-y divide-border/50">
          {/* Background Collection */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Background Collection</p>
                <p className="text-xs text-muted-foreground">
                  Collect network data when app is in background
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.collectInBackground}
              onCheckedChange={() => handleToggle('collectInBackground')}
            />
          </div>

          {/* Location Precision */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Exact Location</p>
                <p className="text-xs text-muted-foreground">
                  {prefs.shareExactLocation ? 'Precise GPS coordinates' : 'Approximate location only'}
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.shareExactLocation}
              onCheckedChange={() => handleToggle('shareExactLocation')}
            />
          </div>

          {/* Device Info */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Device Information</p>
                <p className="text-xs text-muted-foreground">
                  Include device model and OS in logs
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.includeDeviceInfo}
              onCheckedChange={() => handleToggle('includeDeviceInfo')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Retention Info */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Data Retention</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              Location data is automatically deleted after 90 days
            </p>
            <p className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              Personal information is never sold to third parties
            </p>
            <p className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              Network data is aggregated and anonymized before sharing
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Policy Link */}
      <Button 
        variant="outline" 
        className="w-full justify-between"
        onClick={() => {
          lightTap();
          window.open('/privacy', '_blank');
        }}
      >
        <span className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          View Privacy Policy
        </span>
        <ExternalLink className="w-4 h-4" />
      </Button>

      {/* Delete Data Section */}
      <Card className="bg-red-500/5 border-red-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-full bg-red-500/20 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-1">Delete My Data</h4>
              <p className="text-xs text-muted-foreground">
                Request deletion of all your collected data. This action cannot be undone.
              </p>
            </div>
          </div>
          
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => lightTap()}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Request Data Deletion
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your contribution data, session history, 
                  and signal logs. Your points and earnings will be preserved but 
                  disassociated from your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteData}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};
