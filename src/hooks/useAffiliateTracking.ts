import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AffiliateStore {
  referralCode: string | null;
  referralTimestamp: number | null;
  setReferralCode: (code: string) => void;
  clearReferralCode: () => void;
}

// Referral code expires after 30 days
const REFERRAL_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

export const useAffiliateTracking = create<AffiliateStore>()(
  persist(
    (set, get) => ({
      referralCode: null,
      referralTimestamp: null,
      setReferralCode: (code: string) => {
        // Always update to the newest referral code (last click wins)
        console.log('Setting referral code:', code, 'Previous:', get().referralCode);
        set({ 
          referralCode: code, 
          referralTimestamp: Date.now() 
        });
      },
      clearReferralCode: () => {
        console.log('Clearing referral code');
        set({ referralCode: null, referralTimestamp: null });
      },
    }),
    {
      name: 'affiliate-tracking',
      // On rehydration, check if the referral code has expired
      onRehydrateStorage: () => (state) => {
        if (state?.referralTimestamp) {
          const age = Date.now() - state.referralTimestamp;
          if (age > REFERRAL_EXPIRY_MS) {
            console.log('Referral code expired, clearing');
            state.clearReferralCode();
          }
        }
      },
    }
  )
);