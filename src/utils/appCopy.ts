/**
 * App Copy Constants
 * Centralized copy following REGULATOR-SAFE guidelines:
 * - Avoid MLM/pyramid optics
 * - Avoid securities-like language (expectation of profit)
 * - Pass EU/GDPR/App Store & Play Store review
 * - From "earning money" → to "contributing infrastructure and sharing value"
 */

export const APP_COPY = {
  // Status Messages
  status: {
    collecting: "Contributing data… ✅",
    collectingSubtext: "You're helping improve the network!",
    paused: "Paused",
    pausedCta: "Tap to resume contributing",
    noGps: "No GPS signal",
    noGpsHint: "Move to an open area",
    permissionDenied: "Location permission is off",
    permissionDeniedCta: "Tap to enable",
    offline: "You're offline",
    offlineHint: "Connect to contribute data",
  },

  // Permission Requests
  permissions: {
    locationTitle: "Enable Location",
    locationDescription: "We collect signal data tied to location to map network coverage. We never associate this with your identity.",
    locationReasoning: "Location helps us understand where network coverage is strong or weak.",
    
    backgroundTitle: "Background Network Contribution",
    backgroundDescription: "Allow the app to run in the background for continuous coverage mapping.",
    backgroundReasoning: "Uses very little battery – typically less than 3% per day.",
    
    notificationTitle: "Stay Updated",
    notificationDescription: "Get updates on your contributions and important milestones. No spam, we promise!",
  },

  // Privacy Reassurances
  privacy: {
    dataAnonymized: "Your data is anonymized – we never store personal location trails tied to you.",
    neverSold: "Your information is never sold to third parties.",
    lowBattery: "Uses very little battery – typically less than 3% per day.",
    minimalData: "Uses only tiny bits of mobile data – comparable to sending a few messages a day.",
    yourControl: "You can turn off data collection anytime in settings.",
    dataUsage: "Your anonymized data is aggregated with other users to create coverage maps. This helps connectivity providers, roaming platforms, and infrastructure planners improve network quality.",
  },

  // Onboarding
  onboarding: {
    welcomeTitle: "Welcome to Nomiqa",
    welcomeSubtitle: "A community-powered global connectivity network",
    
    slide1Title: "Contribute Network Data",
    slide1Description: "This app runs in the background to collect network quality data. Earn points for your contributions!",
    
    slide2Title: "It's This Simple",
    slide2Description: "1. Open app  2. Connect to cellular  3. Contribute automatically in the background",
    
    slide3Title: "Your Privacy Matters",
    slide3Description: "Location maps coverage, not you. Data is anonymized and never sold.",
    
    allSetTitle: "🎉 All Set!",
    allSetDescription: "The app is ready to start collecting in the background. You can turn off data collection anytime.",
  },

  // Points & Contributions
  earnings: {
    todayLabel: "Today",
    totalBalance: "Total Balance",
    betaBadge: "Points",
    betaExplanation: "Points are being tracked. Conversion rates and usage may evolve as the network grows.",
    pointsExplanation: "Points convert to network tokens used inside the Nomiqa ecosystem for access, services, and rewards.",
    earningsEstimate: "Rewards reflect data quality, coverage value, and network demand.",
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
    
  },

  // Referrals / Invitations (REGULATOR-SAFE)
  referral: {
    inviteTitle: "Invite Contributors",
    inviteDescription: "Invite contributors → Earn a share of the value they help create",
    bonusExplanation: "Referral rewards are based on verified network contributions.",
    shareMessage: "Join me on Nomiqa! Help improve mobile networks and earn rewards for your contributions.",
  },

  // Settings
  settings: {
    dataCollectionTitle: "Network Data Contribution",
    dataCollectionOn: "Contributing and earning points",
    dataCollectionOff: "Paused – not contributing",
    pauseOptions: {
      oneHour: "1 hour",
      untilTomorrow: "Until tomorrow",
      indefinitely: "Until I turn it back on",
    },
    batterySaverTitle: "Battery Saver",
    batterySaverDescription: "Contribute while charging only",
    lowPowerTitle: "Low Power Mode",
    lowPowerDescription: "Reduces collection frequency (rewards may decrease)",
    backgroundCollection: "Contribute network data automatically in the background",
    dataValueExplanation: "This data is valuable to network operators — that's why we can reward you.",
  },

  // Errors & Recovery
  errors: {
    locationOff: "Looks like location access is off. To contribute, please enable location.",
    networkError: "Connection issue. Your data is saved and will sync when you're back online.",
    syncFailed: "Couldn't sync your data. We'll try again automatically.",
  },

  // Help & FAQ
  help: {
    batteryQuestion: "Will this drain my battery?",
    batteryAnswer: "No! We use efficient low-power scanning. Typical usage is less than 3% battery per day.",
    
    dataQuestion: "What data is collected?",
    dataAnswer: "We collect signal strength, GPS coordinates, and network type (like 4G/5G). We do NOT collect any personal content or identities.",
    
    redeemQuestion: "How do I use my points?",
    redeemAnswer: "Points can be converted to network tokens for connectivity and rewards within the Nomiqa ecosystem.",
    
    privacyQuestion: "Is my data safe?",
    privacyAnswer: "Yes! Your location is anonymized and never tied to your identity. We never sell personal data.",
  },

  // Rewards & Redemption (REGULATOR-SAFE)
  rewards: {
    uptimeTip: "Higher-quality and more diverse coverage earns higher rewards.",
    conversionInfo: "Convert your points into network tokens for connectivity and rewards. Tokens are used within the Nomiqa network for access, services, and rewards.",
    privacyNote: "Your contribution data is private and only visible to you.",
    comingSoon: "Coming soon!",
    redemptionAvailable: "Use Your Points for Network Services",
  },

  // Contribution Quality (REGULATOR-SAFE)
  contribution: {
    qualityTitle: "Your Contribution Quality",
    qualityDescription: "Rewards reflect data quality, coverage value, and network demand.",
    noCoverage: "No coverage data yet — start contributing to improve",
    coverageDetected: "Coverage detected — contribution value increasing",
    networkModePrompt: "Switch to cellular to contribute network data",
    highValueBadge: "Higher-value coverage detected",
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

  // Challenges & Activities (REGULATOR-SAFE)
  challenges: {
    moveContribute: "Contribute network data while moving",
    quickSession: "Quick contribution – short session",
    backgroundContribution: "Background network contribution",
  },
} as const;

export default APP_COPY;
