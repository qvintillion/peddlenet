declare module 'jsqr' {
  interface Point {
    x: number;
    y: number;
  }

  interface QRCode {
    data: string;
    location: {
      topRightCorner: Point;
      topLeftCorner: Point;
      bottomRightCorner: Point;
      bottomLeftCorner: Point;
    };
  }

  export function jsQR(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    options: {
      inversionAttempts: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
    }
  ): QRCode | null;
} 