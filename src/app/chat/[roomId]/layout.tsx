// generateStaticParams for Firebase static export
// This must be in a server component (not 'use client')

export async function generateStaticParams() {
  // For static export, we'll pre-generate some common room IDs
  // This is just for the build process - dynamic rooms will still work at runtime
  return [
    { roomId: 'main-stage' },
    { roomId: 'main-stage-chat' },
    { roomId: 'food-court' },
    { roomId: 'lost-found' },
    { roomId: 'ride-share' },
    { roomId: 'after-party' },
    { roomId: 'vip-lounge' },
    { roomId: 'sample-room' },
    // Add more common room patterns
    { roomId: 'main-stage-vip' },
    { roomId: 'food-court-meetup' },
    { roomId: 'artist-meet-greet' },
    { roomId: 'camping-area' }
  ];
}

// This is a server component wrapper that handles static generation
export default function ChatRoomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { roomId: string };
}) {
  return children;
}
