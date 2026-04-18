
The user is asking two things:
1. Add the Google Play ownership verification file and give full VS Code command sequence
2. Whether the missing verification is the reason the app crashes (notifications close app, contribution points don't work)

Answer to #2: NO. The `adi-registration.properties` file is purely a Google Play ownership proof — it has zero runtime effect. Crashes on notifications and broken contribution points are unrelated bugs (likely permission handling, plugin init, or RPC errors).

Plan is simple: 1 file + command list.
