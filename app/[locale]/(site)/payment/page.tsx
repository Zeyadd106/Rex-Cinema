import { Suspense } from 'react';
import PaymentClient from './payment-client';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="h-9 w-48 animate-pulse rounded-lg bg-white/5" />
          <div className="mt-4 h-4 w-72 max-w-full animate-pulse rounded bg-white/5" />
          <div className="mt-10 h-96 animate-pulse rounded-2xl bg-white/5" />
        </div>
      }
    >
      <PaymentClient />
    </Suspense>
  );
}
