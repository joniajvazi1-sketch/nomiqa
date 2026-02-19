import React from 'react';

interface SwipeablePagesProps {
  children: React.ReactNode;
}

/**
 * SwipeablePages - Now a simple passthrough wrapper.
 * Horizontal swipe navigation has been removed to prevent
 * conflicts with vertical scrolling on mobile devices.
 * Users navigate between tabs using the bottom tab bar.
 */
export const SwipeablePages: React.FC<SwipeablePagesProps> = ({ children }) => {
  return <>{children}</>;
};
