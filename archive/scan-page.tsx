'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRScanner } from '@/utils/qr-utils';
import type { QRData } from '@/lib/types';

export default function ScanPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QRScanner | null>(null);

  useEffect(() => {
    // Check camera permission status
    const checkPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermission(permission.state);
        permission.onchange = () => {
          setCameraPermission(permission.state);
        };
      } catch (err) {
        console.error('Failed to check camera permission:', err);
      }
    };
    checkPermission();
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current && videoRef.current) {
        scannerRef.current.stop(videoRef.current);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      if (!videoRef.current) return;
      setError(null);
      const scanner = new QRScanner();
      scannerRef.current = scanner;
      scanner.onResult = (result) => {
        try {
          const data = JSON.parse(result) as QRData;
          setScannedData(data);
        } catch (err) {
          setError('Invalid QR code format');
        }
      };
      scanner.onError = (err) => {
        console.error('Scanner error:', err);
        setError(err.message);
        setIsScanning(false);
      };
      setIsScanning(true);
      await scanner.start(videoRef.current);
    } catch (err) {
      const error = err as Error;
      console.error('Failed to start scanning:', error);
      if (error.message.includes('permission')) {
        setError('Camera access is required. Please allow camera access in your browser settings.');
        setCameraPermission('denied');
      } else {
        setError('Failed to start camera: ' + error.message);
      }
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current && videoRef.current) {
      scannerRef.current.stop(videoRef.current);
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleJoinChat = () => {
    if (!scannedData) return;
    const displayName = prompt('Enter your display name:');
    if (!displayName) {
      setError('Display name is required');
      return;
    }
    localStorage.setItem('displayName', displayName);
    router.push(`/chat/${scannedData.roomId}`);
    stopScanning();
  };

  const handleRetryCamera = () => {
    setError(null);
    setCameraPermission('prompt');
    startScanning();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-purple-600 text-white p-4">
        <h1 className="text-xl font-bold text-center">Scan QR Code</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="relative aspect-square bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              muted
            />
            {!isScanning && !scannedData && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                <p className="text-white text-center p-4">
                  {cameraPermission === 'denied' 
                    ? 'Camera access denied. Please enable camera access in your browser settings.'
                    : 'Camera access required to scan QR code'}
                </p>
              </div>
            )}
            {isScanning && (
              <div className="absolute inset-4 border-2 border-purple-400 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-purple-400"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-purple-400"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-purple-400"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-purple-400"></div>
              </div>
            )}
          </div>
          {error && (
            <div className="bg-red-600 text-white p-3 rounded-lg">
              {error}
              {cameraPermission === 'denied' && (
                <button
                  onClick={handleRetryCamera}
                  className="mt-2 w-full bg-white text-red-600 py-2 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Retry Camera Access
                </button>
              )}
            </div>
          )}
          {!scannedData ? (
            <button
              onClick={isScanning ? stopScanning : startScanning}
              disabled={cameraPermission === 'denied'}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? 'Stop Scanning' : 'Start Scanning'}
            </button>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-xl">
                <h2 className="text-lg font-semibold mb-2">Room Found!</h2>
                <p className="text-gray-600">Room ID: {scannedData.roomId}</p>
                <p className="text-gray-600">Created by: {scannedData.displayName}</p>
              </div>
              <button
                onClick={handleJoinChat}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Join Chat Room
              </button>
            </div>
          )}
          <button
            onClick={() => router.push('/')}
            className="w-full text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
} 