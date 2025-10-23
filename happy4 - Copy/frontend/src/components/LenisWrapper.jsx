import { useEffect } from 'react';

export default function LenisWrapper({ children }) {
  // Lenis disabled - using native smooth scroll instead
  // The Lenis library was causing scrolling to stop at certain points
  
  return <>{children}</>;
}
