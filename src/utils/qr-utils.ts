import QRCode from 'qrcode';

/**
 * Generates a QR code from a full HTTPS URL.
 * Returns a base64 image string usable in <img src="...">.
 */
export async function generateQRCodeFromUrl(url: string): Promise<string> {
  if (!/^https:\/\//.test(url)) {
    throw new Error('generateQRCodeFromUrl: Input must be a valid URL (starting with http or https).');
  }

  return await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 2,
    scale: 6,
  });
}
