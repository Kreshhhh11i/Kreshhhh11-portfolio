import type { Metadata } from 'next';
import { SignatureReview } from './review';

export const metadata: Metadata = {
  title: 'Signature review',
  robots: { index: false, follow: false },
};

export default function SignatureAdminPage() {
  return <SignatureReview />;
}
