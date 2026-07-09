/**
 * AI Photo Verification Wrapper
 * In a real-world scenario, this connects to AWS Rekognition or Azure Face API
 * to detect if a photo contains a clear human face and doesn't violate guidelines.
 */

export interface VerificationResult {
  isVerified: boolean;
  confidence: number;
  reason?: string;
}

export const verifyProfilePhoto = async (photoUrl: string): Promise<VerificationResult> => {
  // Simulate network request to Computer Vision API
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // For development, simulate random failures for 10% of uploads
  const isRandomFailure = Math.random() < 0.1;

  if (isRandomFailure) {
    return {
      isVerified: false,
      confidence: 45,
      reason: 'No clear human face detected or image quality is too low.',
    };
  }

  return {
    isVerified: true,
    confidence: 98.5,
  };
};
