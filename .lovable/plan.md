

## Plan: Show Shopify eSIM orders on My eSIMs page

### Problem
When you buy an eSIM through Shopify, the order data never reaches your database. The "My eSIMs" page reads from the `orders` and `orders_pii` tables, which the old Stripe/Airalo flow populated — but Make + eSIM Access doesn't write there.

### Solution
Create a webhook endpoint that Make calls after provisioning an eSIM. This saves the order details to the database so they appear on both the website and app "My eSIMs" pages.

### Steps

**1. Create `shopify-order-webhook` edge function**
- Accepts POST from Make with: customer email, package name, data amount, validity, price, and eSIM details (ICCID, QR code, sharing link, etc.)
- Secured with a shared secret (webhook signing key) to prevent unauthorized calls
- Looks up `user_id` by matching customer email to `profiles` table
- Inserts into `orders` table (order metadata) and `orders_pii` table (sensitive eSIM details)
- Also inserts into `esim_usage` table for usage tracking
- Tracks affiliate commission by matching email to `affiliate_referrals`

**2. Add webhook secret**
- Request a `SHOPIFY_WEBHOOK_SECRET` secret from you — a random string you'll also paste into Make's HTTP module headers for authentication

**3. Configure Make scenario**
- After eSIM Access provisions the eSIM, add an HTTP module in Make that calls:
  `https://gzhmbiopiciugriatsdb.supabase.co/functions/v1/shopify-order-webhook`
- Pass all relevant fields (email, package info, eSIM details) as JSON body
- Include the webhook secret in the `x-webhook-secret` header

**4. Update Orders page (website + app)**
- Minor adjustments: remove references to old Airalo-specific fields (`airlo_order_id`, `airlo_request_id`)
- Ensure the new orders display correctly with Shopify data
- Add an app "My eSIMs" screen or link to orders from the app navigation

### What you'll need to do in Make
After I build the webhook, you'll add one HTTP POST module at the end of your Make scenario that sends the eSIM details to the webhook URL. I'll give you the exact payload format.

