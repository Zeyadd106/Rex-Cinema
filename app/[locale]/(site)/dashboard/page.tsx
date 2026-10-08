import { Suspense } from 'react';
import DashboardClient from './dashboard-client';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="h-9 w-64 animate-pulse rounded-lg bg-white/5" />
          <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded bg-white/5" />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
