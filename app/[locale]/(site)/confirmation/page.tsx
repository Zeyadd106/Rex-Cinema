import { Suspense } from 'react';
import ConfirmationClient from './confirmation-client';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="mx-auto h-9 w-64 animate-pulse rounded-lg bg-white/5" />
          <div className="mx-auto mt-10 h-96 animate-pulse rounded-3xl bg-white/5" />
        </div>
      }
    >
      <ConfirmationClient />
    </Suspense>
  );
}
