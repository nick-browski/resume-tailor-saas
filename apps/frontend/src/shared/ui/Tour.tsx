import { useEffect, useState, useRef, useCallback } from "react";
import { hasSkippedAllTours, skipAllTours } from "@/shared/lib/tourUtils";
import { MOBILE_CONSTANTS } from "@/shared/lib/constants";

const DEFAULT_TOUR_STORAGE_KEY = "resume-tailor-tour-completed";

// DOM readiness checking constants
const MAX_DOM_READY_RETRIES = 10;
const DOM_READY_CHECK_INTERVAL_MS = 16;
const DOM_READY_INITIAL_DELAY_MS = 100;
const REQUIRED_STABLE_CHECKS_COUNT = 2;
const POSITION_CHANGE_THRESHOLD_PX = 5;
const SIZE_CHANGE_THRESHOLD_PX = 1;
const VIEWPORT_CHECK_OFFSET_PX = 1000;
const VIEWPORT_CHECK_NEGATIVE_OFFSET_PX = -1000;

// Animation timing constants
const HIGHLIGHT_APPEARANCE_FRAMES = 3;
const TOOLTIP_APPEARANCE_FRAMES = 5;
const HIGHLIGHT_TRANSITION_DURATION_MS = 300;
const TOOLTIP_TRANSITION_DURATION_MS = 400;
const SMOOTH_SCROLL_COMPLETION_TIMEOUT_MS = 500;
const POSITION_MONITORING_INTERVAL_MS = 100;

// Tooltip dimensions constants
const TOOLTIP_HEIGHT_MOBILE_PX = 220;
const TOOLTIP_HEIGHT_DESKTOP_PX = 200;
const TOOLTIP_WIDTH_DESKTOP_PX = 384;
const TOOLTIP_SPACING_MOBILE_PX = 12;
const TOOLTIP_SPACING_DESKTOP_PX = 16;
const TOOLTIP_MARGIN_PX = 16;

// Z-index constants
const OVERLAY_Z_INDEX = 9998;
const HIGHLIGHT_Z_INDEX = 9999;
const TOOLTIP_Z_INDEX = 10000;

// Visual styling constants
const HIGHLIGHT_INITIAL_SCALE = 0.95;
const HIGHLIGHT_SCALE_DELTA = 0.05;
const TOOLTIP_INITIAL_SCALE = 0.95;
const TOOLTIP_SCALE_DELTA = 0.05;
const TOOLTIP_TRANSLATE_Y_PX = 8;
const HIGHLIGHT_BORDER_RADIUS_MOBILE_PX = 6;
const HIGHLIGHT_BORDER_RADIUS_DESKTOP_PX = 8;
const HIGHLIGHT_BORDER_WIDTH_PX = 4;
const HIGHLIGHT_BORDER_COLOR = "#3b82f6";
const OVERLAY_BLACK_COLOR = "rgba(0, 0, 0, 0.6)";

export interface TourStep {
  target: string | (() => HTMLElement | null); // CSS selector, data-tour-id, or function returning element ref
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface TourProps {
  steps: TourStep[];
  storageKey?: string; // Optional custom storage key for different steps
  onComplete?: () => void;
  onSkip?: () => void;
}

export function Tour({
  steps,
  storageKey = DEFAULT_TOUR_STORAGE_KEY,
  onComplete,
  onSkip,
}: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDOMReady, setIsDOMReady] = useState(false);
  const [isHighlightReady, setIsHighlightReady] = useState(false);
  const [isTooltipReady, setIsTooltipReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [highlightOpacity, setHighlightOpacity] = useState(0);
  const [tooltipOpacity, setTooltipOpacity] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<{
    top?: string;
    left?: string;
    right?: string;
    width?: string;
  } | null>(null);

  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if all tours were skipped
    if (hasSkippedAllTours()) {
      return;
    }
    const hasCompletedTour = localStorage.getItem(storageKey);
    if (!hasCompletedTour && steps.length > 0) {
      setIsVisible(true);
    }
  }, [steps.length, storageKey]);

  // Detect mobile device
  useEffect(() => {
    const checkMobileDevice = () => {
      const isMobileByScreenWidth =
        window.innerWidth <= MOBILE_CONSTANTS.BREAKPOINT_WIDTH_PX;
      setIsMobile(isMobileByScreenWidth);
    };

    checkMobileDevice();
    window.addEventListener("resize", checkMobileDevice);
    return () => window.removeEventListener("resize", checkMobileDevice);
  }, []);

  const getElementFromTarget = useCallback(
    (target: string | (() => HTMLElement | null)): HTMLElement | null => {
      let element: HTMLElement | null = null;
      if (typeof target === "function") {
        element = target();
      } else {
        element = document.querySelector(target);
      }
      return element;
    },
    []
  );

  // Wait for DOM to be fully rendered before showing tour
  useEffect(() => {
    if (!isVisible || steps.length === 0) {
      setIsDOMReady(false);
      return;
    }

    // Reset isDOMReady when step changes (but not in cleanup to avoid race condition)
    setIsDOMReady(false);

    let domReadyRetryCount = 0;
    let domReadyCheckTimeoutId: NodeJS.Timeout | null = null;
    let domReadyCheckFrameId: number | null = null;
    let previousElementRect: DOMRect | null = null;
    let previousElementState: {
      disabled?: boolean;
      className?: string;
      display?: string;
      visibility?: string;
    } | null = null;
    let elementStabilityCheckCount = 0;

    // Check if element is ready and stable
    const checkDOMReady = (): boolean => {
      const currentTourStep = steps[currentStep];
      const targetElement = getElementFromTarget(currentTourStep.target);

      if (!targetElement) {
        return false;
      }

      // Check computed styles to ensure element is visible
      const elementComputedStyle = window.getComputedStyle(targetElement);
      const isElementVisible =
        elementComputedStyle.display !== "none" &&
        elementComputedStyle.visibility !== "hidden" &&
        elementComputedStyle.opacity !== "0";

      if (!isElementVisible) {
        return false;
      }

      const elementBoundingRect = targetElement.getBoundingClientRect();
      // Element must have valid dimensions (not collapsed or hidden)
      const hasValidDimensions =
        elementBoundingRect.width > 0 && elementBoundingRect.height > 0;

      if (!hasValidDimensions) {
        return false;
      }

      // Check that element is in the viewport or close to it
      const isInViewport =
        elementBoundingRect.top <
          window.innerHeight + VIEWPORT_CHECK_OFFSET_PX &&
        elementBoundingRect.bottom > VIEWPORT_CHECK_NEGATIVE_OFFSET_PX &&
        elementBoundingRect.left <
          window.innerWidth + VIEWPORT_CHECK_OFFSET_PX &&
        elementBoundingRect.right > VIEWPORT_CHECK_NEGATIVE_OFFSET_PX;

      if (!isInViewport) {
        return false;
      }

      // Check stability: element position, size, and properties should not change
      // Note: We allow small position changes (up to POSITION_CHANGE_THRESHOLD_PX) to account for smooth scrolling
      const currentElementState = {
        disabled: (targetElement as HTMLButtonElement).disabled,
        className: targetElement.className,
        display: elementComputedStyle.display,
        visibility: elementComputedStyle.visibility,
      };

      if (previousElementRect && previousElementState) {
        const hasPositionChanged =
          Math.abs(elementBoundingRect.top - previousElementRect.top) >
            POSITION_CHANGE_THRESHOLD_PX ||
          Math.abs(elementBoundingRect.left - previousElementRect.left) >
            POSITION_CHANGE_THRESHOLD_PX;
        const hasSizeChanged =
          Math.abs(elementBoundingRect.width - previousElementRect.width) >
            SIZE_CHANGE_THRESHOLD_PX ||
          Math.abs(elementBoundingRect.height - previousElementRect.height) >
            SIZE_CHANGE_THRESHOLD_PX;
        const hasPropertiesChanged =
          previousElementState.disabled !== currentElementState.disabled ||
          previousElementState.className !== currentElementState.className ||
          previousElementState.display !== currentElementState.display ||
          previousElementState.visibility !== currentElementState.visibility;

        if (!hasPositionChanged && !hasSizeChanged && !hasPropertiesChanged) {
          elementStabilityCheckCount++;
          if (elementStabilityCheckCount >= REQUIRED_STABLE_CHECKS_COUNT) {
            return true; // Element is stable
          }
        } else {
          elementStabilityCheckCount = 0; // Reset counter if element moved or properties changed
        }
      }

      previousElementRect = elementBoundingRect;
      previousElementState = currentElementState;
      return false;
    };

    const attemptDOMReadyCheck = () => {
      const isElementReady = checkDOMReady();
      if (isElementReady) {
        setIsDOMReady(true);
        return;
      }

      domReadyRetryCount++;
      if (domReadyRetryCount < MAX_DOM_READY_RETRIES) {
        domReadyCheckFrameId = requestAnimationFrame(() => {
          domReadyCheckTimeoutId = setTimeout(
            attemptDOMReadyCheck,
            DOM_READY_CHECK_INTERVAL_MS
          );
        });
      }
    };

    // Start checking after render cycle
    domReadyCheckFrameId = requestAnimationFrame(() => {
      domReadyCheckTimeoutId = setTimeout(() => {
        attemptDOMReadyCheck();
      }, DOM_READY_INITIAL_DELAY_MS);
    });

    return () => {
      if (domReadyCheckFrameId !== null) {
        cancelAnimationFrame(domReadyCheckFrameId);
      }
      if (domReadyCheckTimeoutId !== null) {
        clearTimeout(domReadyCheckTimeoutId);
      }
      // Don't reset isDOMReady in cleanup - it's reset at the start of effect
      // This prevents race condition where cleanup runs after render with isDOMReady=true
      previousElementRect = null;
      previousElementState = null;
      elementStabilityCheckCount = 0;
      domReadyRetryCount = 0;
    };
  }, [isVisible, currentStep, steps, getElementFromTarget]);

  const updateTooltipPosition = useCallback(() => {
    if (currentStep >= steps.length) {
      setTooltipStyle(null);
      return;
    }

    const currentTourStep = steps[currentStep];
    const targetElement = getElementFromTarget(currentTourStep.target);
    const preferredTooltipPosition = currentTourStep.position || "bottom";

    if (!targetElement) {
      setTooltipStyle(null);
      return;
    }

    // Use getBoundingClientRect() directly for fixed positioning (relative to viewport)
    const elementBoundingRect = targetElement.getBoundingClientRect();
    const elementPositionData = {
      top: elementBoundingRect.top,
      left: elementBoundingRect.left,
      width: elementBoundingRect.width,
      height: elementBoundingRect.height,
      element: targetElement,
    };

    const calculatedTooltipStyle = calculateTooltipPosition(
      elementPositionData,
      preferredTooltipPosition,
      isMobile,
      currentTourStep.target
    );

    // Only set tooltipStyle if highlight is ready (to maintain sequence)
    if (isHighlightReady) {
      setTooltipStyle(calculatedTooltipStyle);
    }
  }, [currentStep, steps, isMobile, getElementFromTarget, isHighlightReady]);

  const updateHighlightPosition = useCallback(() => {
    if (currentStep >= steps.length || !highlightRef.current) return;

    const currentTourStep = steps[currentStep];
    const targetElement = getElementFromTarget(currentTourStep.target);

    if (targetElement && highlightRef.current && isHighlightReady) {
      // Use getBoundingClientRect() directly for fixed positioning (relative to viewport)
      const elementBoundingRect = targetElement.getBoundingClientRect();
      highlightRef.current.style.top = `${elementBoundingRect.top}px`;
      highlightRef.current.style.left = `${elementBoundingRect.left}px`;
      highlightRef.current.style.width = `${elementBoundingRect.width}px`;
      highlightRef.current.style.height = `${elementBoundingRect.height}px`;
    }
  }, [currentStep, steps, getElementFromTarget, isHighlightReady]);

  // Unified sequential appearance queue: overlay -> highlight -> tooltip
  // Single source of truth using requestAnimationFrame for frame-synced animations
  useEffect(() => {
    if (!isVisible || !isDOMReady || currentStep >= steps.length) {
      // Reset all states when not ready
      setIsHighlightReady(false);
      setIsTooltipReady(false);
      setTooltipStyle(null);
      return;
    }

    // Reset states when step changes
    setIsHighlightReady(false);
    setIsTooltipReady(false);
    setTooltipStyle(null);
    setHighlightOpacity(0);
    setTooltipOpacity(0);

    let highlightFrameId: number | null = null;
    let tooltipFrameId: number | null = null;

    // Queue: Step 1 - Show highlight after overlay
    // Using HIGHLIGHT_APPEARANCE_FRAMES frames for smooth delay (~50ms at 60fps) - optimal for visual quality
    const showHighlightWithAnimation = () => {
      let frameCount = 0;
      const scheduleNextFrame = () => {
        requestAnimationFrame(() => {
          frameCount++;
          if (frameCount < HIGHLIGHT_APPEARANCE_FRAMES) {
            scheduleNextFrame();
          } else {
            setIsHighlightReady(true);

            // Wait for React to render highlight, then update position
            requestAnimationFrame(() => {
              updateHighlightPosition();

              // Queue: Step 2 - Show tooltip after highlight appears
              // Calculate tooltip position only after highlight is rendered
              updateTooltipPosition();

              // Show tooltip after additional frames (~80-100ms delay for smooth visual separation)
              // TOOLTIP_APPEARANCE_FRAMES provides optimal balance between responsiveness and visual quality
              let tooltipFrameCount = 0;
              const scheduleTooltipFrame = () => {
                requestAnimationFrame(() => {
                  tooltipFrameCount++;
                  if (tooltipFrameCount < TOOLTIP_APPEARANCE_FRAMES) {
                    scheduleTooltipFrame();
                  } else {
                    setIsTooltipReady(true);
                  }
                });
              };
              tooltipFrameId = requestAnimationFrame(scheduleTooltipFrame);
            });
          }
        });
      };
      scheduleNextFrame();
    };

    highlightFrameId = requestAnimationFrame(showHighlightWithAnimation);

    return () => {
      if (highlightFrameId !== null) {
        cancelAnimationFrame(highlightFrameId);
      }
      if (tooltipFrameId !== null) {
        cancelAnimationFrame(tooltipFrameId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, isDOMReady, currentStep, steps.length]);

  // Trigger fade-in animation when highlight becomes ready
  useEffect(() => {
    if (isHighlightReady) {
      // Use requestAnimationFrame to ensure DOM is ready before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHighlightOpacity(1);
        });
      });
    }
  }, [isHighlightReady]);

  // Trigger fade-in animation when tooltip becomes ready
  useEffect(() => {
    if (isTooltipReady) {
      // Use requestAnimationFrame to ensure DOM is ready before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTooltipOpacity(1);
        });
      });
    }
  }, [isTooltipReady]);

  useEffect(() => {
    if (!isVisible || !isDOMReady) {
      return;
    }

    // Track element position changes after isDOMReady becomes true
    let previousElementPosition: {
      top: number;
      left: number;
      width: number;
      height: number;
    } | null = null;
    const checkElementPositionChanges = () => {
      const currentTourStep = steps[currentStep];
      const targetElement = getElementFromTarget(currentTourStep.target);
      if (targetElement) {
        const elementBoundingRect = targetElement.getBoundingClientRect();
        const currentElementPosition = {
          top: elementBoundingRect.top,
          left: elementBoundingRect.left,
          width: elementBoundingRect.width,
          height: elementBoundingRect.height,
        };

        if (previousElementPosition) {
          const hasPositionChanged =
            Math.abs(currentElementPosition.top - previousElementPosition.top) >
              SIZE_CHANGE_THRESHOLD_PX ||
            Math.abs(
              currentElementPosition.left - previousElementPosition.left
            ) > SIZE_CHANGE_THRESHOLD_PX;
          const hasSizeChanged =
            Math.abs(
              currentElementPosition.width - previousElementPosition.width
            ) > SIZE_CHANGE_THRESHOLD_PX ||
            Math.abs(
              currentElementPosition.height - previousElementPosition.height
            ) > SIZE_CHANGE_THRESHOLD_PX;

          if (hasPositionChanged || hasSizeChanged) {
            // Update highlight and tooltip immediately when element position changes
            // Only update if highlight is already ready (to maintain sequence)
            if (isHighlightReady) {
              updateHighlightPosition();
              updateTooltipPosition();
            }
          }
        }

        previousElementPosition = currentElementPosition;
      }
    };

    // Scroll to element to ensure it's visible in viewport
    const scrollToTargetElement = () => {
      const currentTourStep = steps[currentStep];
      const targetElement = getElementFromTarget(currentTourStep.target);
      if (targetElement) {
        const elementBoundingRect = targetElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const tooltipHeight = isMobile
          ? TOOLTIP_HEIGHT_MOBILE_PX
          : TOOLTIP_HEIGHT_DESKTOP_PX;
        const tooltipSpacing = isMobile
          ? TOOLTIP_SPACING_MOBILE_PX
          : TOOLTIP_SPACING_DESKTOP_PX;
        const currentScrollY = window.scrollY || window.pageYOffset;

        // Check if element is outside viewport or too close to edges
        const isElementFullyVisible =
          elementBoundingRect.top >= 0 &&
          elementBoundingRect.bottom <= viewportHeight &&
          elementBoundingRect.left >= 0 &&
          elementBoundingRect.right <= viewportWidth;

        // Check if element is partially visible but tooltip might be cut off
        const availableSpaceAbove = elementBoundingRect.top;
        const availableSpaceBelow = viewportHeight - elementBoundingRect.bottom;
        const needsScrolling =
          !isElementFullyVisible ||
          (elementBoundingRect.top < tooltipHeight + tooltipSpacing &&
            availableSpaceBelow < tooltipHeight + tooltipSpacing);

        if (needsScrolling) {
          // Calculate scroll position to center element with space for tooltip
          const elementVerticalCenter =
            elementBoundingRect.top +
            currentScrollY +
            elementBoundingRect.height / 2;
          const targetScrollPosition =
            elementVerticalCenter - viewportHeight / 2;

          // Adjust for tooltip position (prefer showing tooltip above if space allows)
          const finalScrollPosition =
            availableSpaceAbove >= availableSpaceBelow
              ? targetScrollPosition - tooltipHeight - tooltipSpacing
              : targetScrollPosition + tooltipHeight + tooltipSpacing;

          window.scrollTo({
            top: Math.max(0, finalScrollPosition),
            behavior: "smooth",
          });
        }
      }
    };

    // Scroll to element first, then update highlight and tooltip after scroll completes
    scrollToTargetElement();

    // Wait for scroll to complete before checking stability
    let scrollCompletionTimeoutId: NodeJS.Timeout | null = null;
    let scrollCompletionFrameId: number | null = null;
    scrollCompletionTimeoutId = setTimeout(() => {
      scrollCompletionFrameId = requestAnimationFrame(() => {
        // Only update if highlight is already ready (to maintain sequence)
        if (isHighlightReady) {
          updateHighlightPosition();
          updateTooltipPosition();
        }
        checkElementPositionChanges();
      });
    }, SMOOTH_SCROLL_COMPLETION_TIMEOUT_MS); // Wait for smooth scroll to complete

    const handleViewportResize = () => {
      requestAnimationFrame(() => {
        // Only update if highlight is already ready (to maintain sequence)
        if (isHighlightReady) {
          updateHighlightPosition();
          updateTooltipPosition();
        }
        checkElementPositionChanges();
      });
    };
    window.addEventListener("resize", handleViewportResize);
    window.addEventListener("scroll", handleViewportResize, true);

    // Monitor position changes periodically
    const positionMonitoringIntervalId = setInterval(() => {
      checkElementPositionChanges();
    }, POSITION_MONITORING_INTERVAL_MS);

    return () => {
      if (scrollCompletionTimeoutId !== null) {
        clearTimeout(scrollCompletionTimeoutId);
      }
      if (scrollCompletionFrameId !== null) {
        cancelAnimationFrame(scrollCompletionFrameId);
      }
      clearInterval(positionMonitoringIntervalId);
      window.removeEventListener("resize", handleViewportResize);
      window.removeEventListener("scroll", handleViewportResize, true);
    };
  }, [
    isVisible,
    isDOMReady,
    updateHighlightPosition,
    updateTooltipPosition,
    currentStep,
    isMobile,
    steps,
    getElementFromTarget,
    isHighlightReady,
  ]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    onSkip?.();
  };

  const handleSkipAll = () => {
    skipAllTours();
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible || !isDOMReady || currentStep >= steps.length) {
    return null;
  }

  const currentTourStep = steps[currentStep];
  const targetElement = getElementFromTarget(currentTourStep.target);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed bg-black/60 transition-opacity ease-out"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          minHeight: "100vh",
          opacity: 1,
          zIndex: OVERLAY_Z_INDEX,
          transitionDuration: `${HIGHLIGHT_TRANSITION_DURATION_MS}ms`,
        }}
        onClick={isMobile ? undefined : handleNext}
      />

      {/* Highlight */}
      {isHighlightReady && (
        <div
          ref={highlightRef}
          className="fixed pointer-events-none"
          style={{
            boxShadow: `0 0 0 9999px ${OVERLAY_BLACK_COLOR}, 0 0 0 ${HIGHLIGHT_BORDER_WIDTH_PX}px ${HIGHLIGHT_BORDER_COLOR}`,
            borderRadius: isMobile
              ? `${HIGHLIGHT_BORDER_RADIUS_MOBILE_PX}px`
              : `${HIGHLIGHT_BORDER_RADIUS_DESKTOP_PX}px`,
            transition: `opacity ${HIGHLIGHT_TRANSITION_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${HIGHLIGHT_TRANSITION_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            opacity: highlightOpacity,
            transform: `scale(${
              HIGHLIGHT_INITIAL_SCALE + highlightOpacity * HIGHLIGHT_SCALE_DELTA
            })`,
            willChange: "opacity, transform",
            zIndex: HIGHLIGHT_Z_INDEX,
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipStyle && targetElement && isTooltipReady && (
        <div
          className={`fixed bg-white rounded-lg shadow-xl pointer-events-auto ${
            isMobile ? "p-4 left-4 right-4 max-w-none" : "p-4 sm:p-6 max-w-sm"
          }`}
          style={{
            ...tooltipStyle,
            transition: `opacity ${TOOLTIP_TRANSITION_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${TOOLTIP_TRANSITION_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            opacity: tooltipOpacity,
            transform: `translateY(${
              tooltipOpacity === 0 ? `${TOOLTIP_TRANSLATE_Y_PX}px` : "0"
            }) scale(${
              TOOLTIP_INITIAL_SCALE + tooltipOpacity * TOOLTIP_SCALE_DELTA
            })`,
            willChange: "opacity, transform",
            zIndex: TOOLTIP_Z_INDEX,
          }}
        >
          <div
            className={`flex items-start justify-between mb-3 ${
              isMobile ? "gap-2" : "gap-2 sm:gap-4"
            }`}
          >
            <h3
              className={`font-semibold text-gray-900 flex-1 ${
                isMobile ? "text-base pr-2" : "text-lg"
              }`}
            >
              {currentTourStep.title}
            </h3>
            <div
              className={`flex items-center flex-shrink-0 ${
                isMobile ? "gap-1" : "gap-1 sm:gap-2"
              }`}
            >
              <button
                onClick={handleSkipAll}
                className={`text-gray-500 hover:text-gray-700 hover:scale-[1.02] active:scale-[0.98] transition duration-150 rounded hover:bg-gray-100 touch-manipulation ${
                  isMobile
                    ? "text-xs px-2 py-1.5 min-w-[60px]"
                    : "text-xs px-2 py-1"
                }`}
                aria-label="Skip all tours"
              >
                Skip all
              </button>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 hover:scale-[1.02] active:scale-[0.98] transition duration-150 touch-manipulation p-1"
                aria-label="Skip tour"
              >
                <svg
                  className={`${isMobile ? "w-6 h-6" : "w-5 h-5"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          <p
            className={`text-gray-600 mb-4 ${
              isMobile ? "text-sm leading-relaxed break-words" : "text-sm"
            }`}
          >
            {currentTourStep.content}
          </p>
          <div
            className={`flex items-center ${
              isMobile ? "flex-col gap-3" : "justify-between"
            }`}
          >
            <div
              className={`text-gray-500 ${
                isMobile ? "text-xs self-start order-2 w-full" : "text-xs"
              }`}
            >
              {currentStep + 1} of {steps.length}
            </div>
            <div className={`flex gap-2 ${isMobile ? "w-full" : ""}`}>
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className={`font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition duration-150 touch-manipulation ${
                    isMobile
                      ? "px-4 py-2.5 text-sm flex-1"
                      : "px-4 py-2 text-sm"
                  }`}
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleNext}
                className={`font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition duration-150 touch-manipulation ${
                  isMobile ? "px-4 py-2.5 text-sm flex-1" : "px-4 py-2 text-sm"
                }`}
              >
                {currentStep === steps.length - 1 ? "Got it!" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function calculateTooltipPosition(
  elementPositionData: {
    top: number;
    left: number;
    width: number;
    height: number;
    element?: HTMLElement | null;
  },
  preferredPosition: string,
  isMobileDevice: boolean,
  stepTargetSelector?: string | (() => HTMLElement | null)
): { top: string; left?: string; right?: string; width?: string } {
  const tooltipSpacing = isMobileDevice
    ? TOOLTIP_SPACING_MOBILE_PX
    : TOOLTIP_SPACING_DESKTOP_PX;
  const tooltipWidth = TOOLTIP_WIDTH_DESKTOP_PX;
  const tooltipHeight = isMobileDevice
    ? TOOLTIP_HEIGHT_MOBILE_PX
    : TOOLTIP_HEIGHT_DESKTOP_PX;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Get element position relative to viewport (for fixed positioning)
  let elementBoundingRect: DOMRect | null = null;
  if (elementPositionData.element) {
    elementBoundingRect = elementPositionData.element.getBoundingClientRect();
  } else if (stepTargetSelector) {
    const targetElement =
      typeof stepTargetSelector === "function"
        ? stepTargetSelector()
        : document.querySelector(stepTargetSelector);
    elementBoundingRect = targetElement?.getBoundingClientRect() || null;
  }

  // Fallback to elementPositionData if element not found (shouldn't happen, but just in case)
  if (!elementBoundingRect) {
    elementBoundingRect = {
      top: elementPositionData.top,
      left: elementPositionData.left,
      width: elementPositionData.width,
      height: elementPositionData.height,
      bottom: elementPositionData.top + elementPositionData.height,
      right: elementPositionData.left + elementPositionData.width,
    } as DOMRect;
  }

  // On mobile, prefer bottom or top positioning, full width with margins
  if (isMobileDevice) {
    const elementTopRelativeToViewport = elementBoundingRect.top;
    const elementBottomRelativeToViewport = elementBoundingRect.bottom;

    const availableSpaceBelow =
      viewportHeight - elementBottomRelativeToViewport;
    const availableSpaceAbove = elementTopRelativeToViewport;
    const shouldPositionBelow = availableSpaceBelow >= availableSpaceAbove;

    if (shouldPositionBelow) {
      // Position below element, full width with margins
      const calculatedTop = elementBottomRelativeToViewport + tooltipSpacing;
      // Ensure tooltip doesn't go below viewport
      const maximumTop = viewportHeight - tooltipHeight - TOOLTIP_MARGIN_PX;
      const finalTopPosition = Math.min(calculatedTop, maximumTop);
      // Ensure tooltip is always visible
      return {
        top: `${Math.max(TOOLTIP_MARGIN_PX, finalTopPosition)}px`,
      };
    } else {
      // Position above element, full width with margins
      const calculatedTop =
        elementTopRelativeToViewport - tooltipHeight - tooltipSpacing;
      // Ensure tooltip doesn't go above viewport
      return {
        top: `${Math.max(
          TOOLTIP_MARGIN_PX,
          Math.min(
            calculatedTop,
            viewportHeight - tooltipHeight - TOOLTIP_MARGIN_PX
          )
        )}px`,
      };
    }
  }

  // Desktop positioning (use viewport-relative positions)
  switch (preferredPosition) {
    case "top": {
      const calculatedTop = Math.max(
        TOOLTIP_MARGIN_PX,
        elementBoundingRect.top - tooltipHeight - tooltipSpacing
      );
      const calculatedLeft = Math.max(
        TOOLTIP_MARGIN_PX,
        Math.min(
          elementBoundingRect.left +
            elementBoundingRect.width / 2 -
            tooltipWidth / 2,
          viewportWidth - tooltipWidth - TOOLTIP_MARGIN_PX
        )
      );
      return { top: `${calculatedTop}px`, left: `${calculatedLeft}px` };
    }
    case "bottom": {
      const calculatedTop = elementBoundingRect.bottom + tooltipSpacing;
      const calculatedLeft = Math.max(
        TOOLTIP_MARGIN_PX,
        Math.min(
          elementBoundingRect.left +
            elementBoundingRect.width / 2 -
            tooltipWidth / 2,
          viewportWidth - tooltipWidth - TOOLTIP_MARGIN_PX
        )
      );
      return { top: `${calculatedTop}px`, left: `${calculatedLeft}px` };
    }
    case "left": {
      const calculatedTop = Math.max(
        TOOLTIP_MARGIN_PX,
        Math.min(
          elementBoundingRect.top +
            elementBoundingRect.height / 2 -
            tooltipHeight / 2,
          viewportHeight - tooltipHeight - TOOLTIP_MARGIN_PX
        )
      );
      const calculatedLeft = Math.max(
        TOOLTIP_MARGIN_PX,
        elementBoundingRect.left - tooltipWidth - tooltipSpacing
      );
      return { top: `${calculatedTop}px`, left: `${calculatedLeft}px` };
    }
    case "right": {
      const calculatedTop = Math.max(
        TOOLTIP_MARGIN_PX,
        Math.min(
          elementBoundingRect.top +
            elementBoundingRect.height / 2 -
            tooltipHeight / 2,
          viewportHeight - tooltipHeight - TOOLTIP_MARGIN_PX
        )
      );
      const calculatedLeft = Math.min(
        elementBoundingRect.right + tooltipSpacing,
        viewportWidth - tooltipWidth - TOOLTIP_MARGIN_PX
      );
      return { top: `${calculatedTop}px`, left: `${calculatedLeft}px` };
    }
    default: {
      const calculatedTop = elementBoundingRect.bottom + tooltipSpacing;
      const calculatedLeft = Math.max(
        TOOLTIP_MARGIN_PX,
        Math.min(
          elementBoundingRect.left +
            elementBoundingRect.width / 2 -
            tooltipWidth / 2,
          viewportWidth - tooltipWidth - TOOLTIP_MARGIN_PX
        )
      );
      return { top: `${calculatedTop}px`, left: `${calculatedLeft}px` };
    }
  }
}
