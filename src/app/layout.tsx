import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Disable tab visibility tracking for cross-room notifications
import '../utils/tab-visibility-override';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://peddlenet.app'),
  title: "PeddleNet - Instant P2P Messaging",
  description: "Connect with people nearby without internet using instant P2P chat rooms perfect for festivals and events",
  icons: {
    icon: '/favicon.svg',
    apple: '/peddlenet-logo.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'PeddleNet - Instant P2P Messaging',
    description: 'Connect with people nearby without internet using instant P2P chat rooms perfect for festivals and events',
    images: ['/peddlenet-logo.svg'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'PeddleNet - Instant P2P Messaging',
    description: 'Connect with people nearby without internet using instant P2P chat rooms perfect for festivals and events',
    images: ['/peddlenet-logo.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* Load PeerJS from CDN - same version that works in diagnostic */}
        <script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
