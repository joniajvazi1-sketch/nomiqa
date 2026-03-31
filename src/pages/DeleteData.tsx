import { Shield, Database, AlertTriangle, CheckCircle, Clock, Mail, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const DeleteData = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Delete Your Data — Nomiqa"
        description="Request deletion of your collected data without deleting your Nomiqa account. GDPR compliant."
      />
      <Navbar />

      <main className="container max-w-3xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-6">
            <Database className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Delete Your Data</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            You can request deletion of your collected contribution data while keeping your Nomiqa account active.
          </p>
        </div>

        {/* Steps */}
        <Card className="mb-8 border-border">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              How to Delete Your Data
            </h2>
            <ol className="space-y-6">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">1</span>
                <div>
                  <p className="font-medium">Open the Nomiqa app</p>
                  <p className="text-sm text-muted-foreground">Log in with your account.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">2</span>
                <div>
                  <p className="font-medium">Go to Profile → Privacy Controls</p>
                  <p className="text-sm text-muted-foreground">Navigate to your profile page and open the Privacy Controls section.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">3</span>
                <div>
                  <p className="font-medium">Tap "Request Data Deletion"</p>
                  <p className="text-sm text-muted-foreground">Confirm the deletion in the dialog that appears.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">4</span>
                <div>
                  <p className="font-medium">Data is anonymized within 24 hours</p>
                  <p className="text-sm text-muted-foreground">Your contribution data will be anonymized. Your account, points, and referral history remain intact.</p>
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
              Request via Email
            </h2>
            <p className="text-muted-foreground mb-3">
              You can also request data deletion by emailing us:
            </p>
            <a 
              href="mailto:privacy@nomiqa.com?subject=Data%20Deletion%20Request"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              privacy@nomiqa.com
            </a>
            <p className="text-xs text-muted-foreground mt-2">
              Please send the request from the email address associated with your Nomiqa account. We will process your request within 72 hours.
            </p>
          </CardContent>
        </Card>

        {/* What gets deleted vs kept */}
        <Card className="mb-8 border-border">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              What Gets Deleted vs. Kept
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-destructive mb-2">Deleted (Anonymized)</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Signal logs and network measurements</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Location and contribution data</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Contribution session history</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Coverage confirmations</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Speed test results</li>
                  <li className="flex items-start gap-2"><Trash2 className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> Connection event logs</li>
                </ul>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-medium text-green-600 mb-2">Kept (Account Remains Active)</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Your account and profile</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Points and rewards balance</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Referral history</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Order history</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Daily check-in streak</li>
                </ul>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Retention Period
                </h3>
                <p className="text-sm text-muted-foreground">
                  Data deletion requests are processed within <strong>24 hours</strong>. Contribution data is anonymized (user association removed) rather than hard-deleted, ensuring aggregated network quality data remains available while your personal association is permanently severed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automatic retention */}
        <Card className="mb-8 border-border">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Automatic Data Retention
            </h2>
            <p className="text-sm text-muted-foreground">
              Even without a deletion request, Nomiqa automatically deletes raw signal logs and location data after <strong>60 days</strong>. Order PII (personal information in order records) is automatically purged after <strong>120 days</strong>. These automated processes run daily to ensure data minimization.
            </p>
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
              Under Article 17 of the GDPR, you have the right to request erasure of your personal data. Nomiqa fully supports this right. For full account deletion, visit our{" "}
              <a href="/delete-account" className="text-primary hover:underline">account deletion page</a>. For questions, contact{" "}
              <a href="mailto:privacy@nomiqa.com" className="text-primary hover:underline">privacy@nomiqa.com</a>.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default DeleteData;
