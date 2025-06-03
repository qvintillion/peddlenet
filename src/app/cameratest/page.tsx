"use client";

import { useRef } from "react";

export default function CameraTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      alert("Camera error: " + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <video ref={videoRef} className="w-full max-w-md aspect-video bg-gray-900" autoPlay playsInline muted />
      <button onClick={startCamera} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded">
        Start Camera
      </button>
    </div>
  );
} 