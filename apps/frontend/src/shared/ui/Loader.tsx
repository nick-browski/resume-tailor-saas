import { useId } from "react";

interface DocumentIconProps {
  gradientId: string;
  showDetails?: boolean;
}

function DocumentIcon({ gradientId, showDetails = true }: DocumentIconProps) {
  const bounceAnimation = {
    animation: "bounce-contained 3s ease-in-out infinite",
    animationDuration: "3s",
  };

  return (
    <>
      <style>{`
        @keyframes bounce-contained {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
      <svg
        className="w-full h-full"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <g className="origin-center" style={bounceAnimation}>
          <rect
            x="30"
            y="20"
            width="60"
            height="80"
            rx="6"
            fill={`url(#${gradientId})`}
            className="drop-shadow-lg"
          />
          <rect
            x="35"
            y="30"
            width="50"
            height="3"
            rx="1.5"
            fill="white"
            opacity="0.9"
          />
          <rect
            x="35"
            y="40"
            width="45"
            height="3"
            rx="1.5"
            fill="white"
            opacity="0.7"
          />
          <rect
            x="35"
            y="50"
            width="40"
            height="3"
            rx="1.5"
            fill="white"
            opacity="0.5"
          />
          {showDetails && (
            <>
              <rect
                x="35"
                y="60"
                width="35"
                height="3"
                rx="1.5"
                fill="white"
                opacity="0.4"
              />
              <circle
                cx="60"
                cy="75"
                r="6"
                fill="white"
                opacity="0.8"
                className="animate-pulse"
              />
            </>
          )}
        </g>
      </svg>
    </>
  );
}

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loader({ size = "md", className = "" }: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <svg
      className={`animate-spin text-blue-600 ${sizeClasses[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function LoadingAnimation() {
  const uniqueId = useId();
  return (
    <div className="flex items-center justify-center w-full">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
        <DocumentIcon gradientId={uniqueId} showDetails={true} />
      </div>
    </div>
  );
}

interface LoaderOverlayProps {
  message?: string;
}

export function LoaderOverlay({ message }: LoaderOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-4 sm:gap-5">
        <LoadingAnimation />
        {message && (
          <p className="text-sm sm:text-base text-gray-600 font-medium text-center px-4">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
