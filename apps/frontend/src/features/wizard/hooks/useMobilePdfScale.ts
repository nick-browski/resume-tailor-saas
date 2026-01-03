import { useState, useEffect, useMemo } from "react";
import { MOBILE_CONSTANTS, PDF_CONSTANTS } from "@/shared/lib/constants";

// Detects mobile device and calculates PDF scale for proper display
export function useMobilePdfScale() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Detects mobile device by user agent and screen width
  useEffect(() => {
    const isMobileByUserAgent = MOBILE_CONSTANTS.MOBILE_USER_AGENT_PATTERN.test(
      navigator.userAgent
    );
    const isMobileByScreenWidth =
      window.innerWidth <= MOBILE_CONSTANTS.BREAKPOINT_WIDTH_PX;
    const isMobile = isMobileByUserAgent || isMobileByScreenWidth;
    setIsMobileDevice(isMobile);
  }, []);

  // Calculates PDF scale for mobile devices based on screen width
  const pdfScaleForMobile = useMemo(() => {
    if (!isMobileDevice || typeof window === "undefined") {
      return PDF_CONSTANTS.MAX_SCALE;
    }
    const screenWidth = window.innerWidth;
    const scaleBasedOnWidth = screenWidth / PDF_CONSTANTS.A4_WIDTH_PX;
    const clampedScale = Math.min(scaleBasedOnWidth, PDF_CONSTANTS.MAX_SCALE);
    return Math.max(clampedScale, PDF_CONSTANTS.MIN_SCALE);
  }, [isMobileDevice]);

  return {
    isMobile: isMobileDevice,
    mobileScale: pdfScaleForMobile,
  };
}
