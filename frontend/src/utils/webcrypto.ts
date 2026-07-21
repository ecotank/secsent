/**
 * Client-Side WebCrypto API Engine Wrapper
 * Provides browser-native SHA-256 hashing, random byte generation, & PIN Verification
 */

export async function computeSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomHex(length: number = 32): string {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyDocumentIntegrity(content: string, expectedHash: string): Promise<boolean> {
  const calculated = await computeSHA256(content);
  return calculated.toLowerCase() === expectedHash.toLowerCase();
}

export function validateSecurityPIN(inputPIN: string): boolean {
  // Default Security PIN for Pejabat / Demo session: "123456"
  return inputPIN.trim() === "123456";
}
