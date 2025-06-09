import React from 'react';

interface MobileConnectionErrorProps {
  error: {
    type: string;
    message: string;
  };
  isSignalingConnected: boolean;
  onRetry: () => void;
  onDiagnostics: () => void;
}

export function MobileConnectionError({ 
  error, 
  isSignalingConnected, 
  onRetry, 
  onDiagnostics 
}: MobileConnectionErrorProps) {
  const getMobileErrorInfo = () => {
    if (!isSignalingConnected) {
      return {
        title: "📱 Signaling Server Disconnected",
        message: "Can't reach the connection server. This often happens when switching between WiFi and mobile data.",
        suggestions: [
          "Check your internet connection",
          "Try switching between WiFi and mobile data",
          "Refresh the page if the issue persists"
        ],
        emoji: "🌐"
      };
    }

    switch (error.type) {
      case 'disconnected':
        return {
          title: "📱 Connection Lost",
          message: "Lost connection to the signaling server. This is common on mobile networks.",
          suggestions: [
            "We're automatically trying to reconnect",
            "Switch between WiFi and mobile data",
            "Move to an area with better signal"
          ],
          emoji: "📶"
        };
      
      case 'peer-unavailable':
        return {
          title: "📱 Peer Not Found",
          message: "The person you're trying to connect to isn't available right now.",
          suggestions: [
            "Ask them to check their connection",
            "Try scanning their QR code again",
            "Both devices need good internet"
          ],
          emoji: "👤"
        };
      
      case 'network':
        return {
          title: "📱 Network Issue",
          message: "Mobile network is preventing the connection.",
          suggestions: [
            "Try switching to WiFi",
            "Move to better signal area",
            "Check mobile data permissions"
          ],
          emoji: "📡"
        };
      
      default:
        return {
          title: "📱 Connection Error",
          message: "Something went wrong with the mobile connection.",
          suggestions: [
            "Retry the connection",
            "Check network settings",
            "Restart the browser if needed"
          ],
          emoji: "⚠️"
        };
    }
  };

  const errorInfo = getMobileErrorInfo();

  return (
    <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{errorInfo.emoji}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-200 mb-2">
            {errorInfo.title}
          </h3>
          <p className="text-red-300 text-sm mb-3">
            {errorInfo.message}
          </p>
          
          <div className="space-y-1 mb-4">
            {errorInfo.suggestions.map((suggestion, index) => (
              <div key={index} className="text-xs text-red-300 flex items-center">
                <span className="mr-2">•</span>
                {suggestion}
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onRetry}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
            >
              🔄 Retry Connection
            </button>
            <button
              onClick={onDiagnostics}
              className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition"
            >
              🔍 Diagnostics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MobileSignalingStatusProps {
  isConnected: boolean;
  reconnectAttempts: number;
}

export function MobileSignalingStatus({ isConnected, reconnectAttempts }: MobileSignalingStatusProps) {
  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 text-xs text-green-400">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>📱 Mobile signaling connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-xs text-orange-400">
      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
      <span>
        📱 Reconnecting to server
        {reconnectAttempts > 0 && ` (attempt ${reconnectAttempts})`}
      </span>
    </div>
  );
}

interface MobileNetworkInfoProps {
  className?: string;
}

export function MobileNetworkInfo({ className = '' }: MobileNetworkInfoProps) {
  const [networkInfo, setNetworkInfo] = React.useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });

        const updateInfo = () => {
          setNetworkInfo({
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
          });
        };

        connection.addEventListener('change', updateInfo);
        return () => connection.removeEventListener('change', updateInfo);
      }
    }
  }, []);

  if (!networkInfo) {
    return null;
  }

  const getNetworkQuality = () => {
    if (networkInfo.effectiveType === '4g' && networkInfo.downlink > 5) {
      return { quality: 'excellent', color: 'green', emoji: '🚀' };
    }
    if (networkInfo.effectiveType === '4g' || networkInfo.downlink > 2) {
      return { quality: 'good', color: 'blue', emoji: '📶' };
    }
    if (networkInfo.effectiveType === '3g' || networkInfo.downlink > 0.5) {
      return { quality: 'fair', color: 'yellow', emoji: '📳' };
    }
    return { quality: 'poor', color: 'red', emoji: '📵' };
  };

  const quality = getNetworkQuality();

  return (
    <div className={`text-xs text-gray-400 ${className}`}>
      <div className="flex items-center space-x-2">
        <span>{quality.emoji}</span>
        <span className={`text-${quality.color}-400`}>
          {networkInfo.effectiveType?.toUpperCase()} • {networkInfo.downlink}Mbps • {networkInfo.rtt}ms
        </span>
      </div>
    </div>
  );
}
