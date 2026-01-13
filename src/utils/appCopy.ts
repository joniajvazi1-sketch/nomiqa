/**
 * App Copy Constants
 * Centralized copy following UX blueprint guidelines:
 * - Avoid crypto jargon ("points" not "mining")
 * - Emphasize rewards not speculation
 * - Privacy reassurances throughout
 * - Friendly, supportive tone
 */

export const APP_COPY = {
  // Status Messages
  status: {
    collecting: "Collecting data… ✅",
    collectingSubtext: "You're earning as you go!",
    paused: "Paused",
    pausedCta: "Tap to resume earning",
    noGps: "No GPS signal",
    noGpsHint: "Move to an open area",
    permissionDenied: "Location permission is off",
    permissionDeniedCta: "Tap to enable",
    offline: "You're offline",
    offlineHint: "Connect to earn points",
  },

  // Permission Requests
  permissions: {
    locationTitle: "Enable Location",
    locationDescription: "We collect signal data tied to location to map network coverage. We never associate this with your identity.",
    locationReasoning: "Location helps us understand where network coverage is strong or weak.",
    
    backgroundTitle: "Keep Earning in Background",
    backgroundDescription: "Allow the app to run in the background so you can continue earning even when you close it.",
    backgroundReasoning: "Uses very little battery – typically less than 3% per day.",
    
    notificationTitle: "Stay Updated",
    notificationDescription: "Get updates on your earnings and important milestones. No spam, we promise!",
  },

  // Privacy Reassurances
  privacy: {
    dataAnonymized: "Your data is anonymized – we never store personal location trails tied to you.",
    neverSold: "Your information is never sold to third parties.",
    lowBattery: "Uses very little battery – typically less than 3% per day.",
    minimalData: "Uses only tiny bits of mobile data – comparable to sending a few messages a day.",
    yourControl: "You can turn off data collection anytime in settings.",
  },

  // Onboarding
  onboarding: {
    welcomeTitle: "Welcome to Nomiqa",
    welcomeSubtitle: "Get Rewards for Improving Mobile Networks!",
    
    slide1Title: "Turn Your Signal Into Rewards",
    slide1Description: "This app runs in the background to collect network quality data. Earn points just by carrying your phone!",
    
    slide2Title: "It's This Simple",
    slide2Description: "1. Open app  2. Connect to cellular  3. Earn automatically in the background",
    
    slide3Title: "Your Privacy Matters",
    slide3Description: "Location maps coverage, not you. Data is anonymized and never sold.",
    
    allSetTitle: "🎉 All Set!",
    allSetDescription: "The app is ready to start collecting in the background. You can turn off data collection anytime.",
  },

  // Points & Earnings
  earnings: {
    todayLabel: "Today",
    totalBalance: "Total Balance",
    betaBadge: "Points",
    betaExplanation: "Points are being tracked for future rewards. Redemption options coming soon!",
    pointsExplanation: "Points are in-app rewards that can be redeemed for mobile data, gift cards, and more.",
    earningsEstimate: "Most users earn a few dollars worth of points each month – it adds up over time!",
  },

  // Contributor Levels
  levels: {
    newcomer: "Newcomer",
    contributor: "Contributor", 
    explorer: "Explorer",
    mapper: "Mapper",
    pioneer: "Pioneer",
    levelUpPrefix: "Level Up!",
    daysRequirement: "days of activity",
    areasRequirement: "areas mapped",
  },

  // Gamification
  gamification: {
    streakTitle: "Streak",
    streakKeepGoing: "Keep it up!",
    streakLost: "Start a new streak today!",
    dailySpinReady: "Ready to spin!",
    dailySpinUsed: "Come back tomorrow",
    challengeComplete: "Challenge Complete! 🎉",
    achievementUnlocked: "Achievement Unlocked!",
  },

  // Referrals
  referral: {
    inviteTitle: "Invite Friends",
    inviteDescription: "Help expand the network – invite friends and you'll each get a bonus!",
    bonusExplanation: "You'll both receive bonus points after they've used the app for 7 days.",
    shareMessage: "Join me on Nomiqa! Get travel eSIMs and earn rewards for helping improve mobile networks.",
  },

  // Settings
  settings: {
    dataCollectionTitle: "Network Data Collection",
    dataCollectionOn: "Collecting and earning",
    dataCollectionOff: "Paused – not earning points",
    pauseOptions: {
      oneHour: "1 hour",
      untilTomorrow: "Until tomorrow",
      indefinitely: "Until I turn it back on",
    },
    batterySaverTitle: "Battery Saver",
    batterySaverDescription: "Only collect when charging",
    lowPowerTitle: "Low Power Mode",
    lowPowerDescription: "Reduces collection frequency (earnings may decrease)",
  },

  // Errors & Recovery
  errors: {
    locationOff: "Looks like location access is off. To earn points, please enable location.",
    networkError: "Connection issue. Your data is saved and will sync when you're back online.",
    syncFailed: "Couldn't sync your data. We'll try again automatically.",
  },

  // Help & FAQ
  help: {
    batteryQuestion: "Will this drain my battery?",
    batteryAnswer: "No! We use efficient low-power scanning. Typical usage is less than 3% battery per day.",
    
    dataQuestion: "What data is collected?",
    dataAnswer: "We collect signal strength, GPS coordinates, and network type (like 4G/5G). We do NOT collect any personal content or identities.",
    
    redeemQuestion: "How do I redeem points?",
    redeemAnswer: "Points can be converted to tokens or used for discounts on eSIM plans. Full cash-out coming soon!",
    
    privacyQuestion: "Is my data safe?",
    privacyAnswer: "Yes! Your location is anonymized and never tied to your identity. We never sell personal data.",
  },

  // Rewards & Redemption
  rewards: {
    uptimeTip: "Keep the app running longer to increase uptime points.",
    conversionInfo: "Points will convert to NOMIQA tokens when we launch. Visit our web portal to learn more about token conversion and cash-out options.",
    privacyNote: "Your earning data is private and only visible to you.",
    comingSoon: "Coming soon!",
    redemptionAvailable: "Redemption available",
  },

  // Weekly Summary
  weeklySummary: {
    title: "Your Week in Review",
    pointsEarned: "Points earned",
    areasExplored: "New areas explored",
    streakDays: "Day streak",
    encouragement: "Great job! You're helping build better mobile coverage.",
    topContributor: "You're in the top 20% of contributors!",
  },
} as const;

export default APP_COPY;
