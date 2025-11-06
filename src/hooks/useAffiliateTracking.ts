import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AffiliateStore {
  referralCode: string | null;
  setReferralCode: (code: string) => void;
  clearReferralCode: () => void;
}

export const useAffiliateTracking = create<AffiliateStore>()(
  persist(
    (set) => ({
      referralCode: null,
      setReferralCode: (code: string) => set({ referralCode: code }),
      clearReferralCode: () => set({ referralCode: null }),
    }),
    {
      name: 'affiliate-tracking',
    }
  )
);