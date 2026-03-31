import { Shield, Trash2, AlertTriangle, CheckCircle, Clock, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const DeleteAccount = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Delete Your Account — Nomiqa"
        description="Learn how to permanently delete your Nomiqa account and all associated data. GDPR compliant."
      />
      <Navbar />

      <main className="container max-w-3xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
            <Trash2 className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Delete Your Nomiqa Account</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            You have the right to permanently delete your account and all associated data at any time.
          </p>
        </div>

        {/* Steps */}
        <Card className="mb-8 border-border">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              How to Delete Your Account
            </h2>
            <ol className="space-y-6">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">1</span>
                <div>
                  <p className="font-medium">Open the Nomiqa app</p>
                  <p className="text-sm text-muted-foreground">Log in with the account you wish to delete.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">2</span>
                <div>
                  <p className="font-medium">Go to Profile → Settings</p>
                  <p className="text-sm text-muted-foreground">Navigate to your profile page and tap the settings icon.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">3</span>
                <div>
                  <p className="font-medium">Scroll down and tap "Delete Account"</p>
                  <p className="text-sm text-muted-foreground">You will be asked to type <strong className="text-destructive">DELETE</strong> to confirm.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">4</span>
                <div>
                  <p className="font-medium">Confirm deletion</p>
                  <p className="text-sm text-muted-foreground">Your account and all data will be permanently removed immediately.</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Alternative: Email request */}
        <Card className="mb-8 border-border">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Can't Access the App?
            </h2>
            <p className="text-muted-foreground mb-3">
              If you are unable to log in or access the app, you can request account deletion by emailing us:
            </p>
            <a 
              href="mailto:privacy@nomiqa.com?subject=Account%20Deletion%20Request"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              privacy@nomiqa.com
            </a>
            <p className="text-xs text-muted-foreground mt-2">
              Please send the request from the email address associated with your Nomiqa account. We will process your request within 72 hours.
            </p>
          </CardContent>
        </Card>

        {/* What gets deleted */}
        <Card className="mb-8 border-border">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              What Gets Deleted
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-destructive mb-2">Permanently Deleted Immediately</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Your profile (username, email, country)</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> All earned points and rewards</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Referral history and commissions</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Contribution sessions and signal data</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Daily check-in and challenge progress</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Speed test results</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Notification preferences</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Wallet address associations</li>
                </ul>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-medium text-amber-600 mb-2">Anonymized (PII Removed)</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> Order records — email and name are removed; transaction records are retained in anonymized form for legal/financial compliance</li>
                </ul>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Retention Period
                </h3>
                <p className="text-sm text-muted-foreground">
                  Account deletion is <strong>immediate and permanent</strong>. There is no recovery period. Anonymized order records may be retained for up to 7 years for tax and legal compliance, as required by applicable law.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GDPR Notice */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Your Rights Under GDPR
            </h2>
            <p className="text-sm text-muted-foreground">
              As a user in the European Union, you have the right to erasure ("right to be forgotten") under Article 17 of the GDPR. Nomiqa processes deletion requests immediately upon confirmation. For questions about your data rights, contact us at{" "}
              <a href="mailto:privacy@nomiqa.com" className="text-primary hover:underline">privacy@nomiqa.com</a>.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default DeleteAccount;
