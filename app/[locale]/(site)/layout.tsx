import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />
      <PageTransition>
        <main id="main" className="flex-1">
          {children}
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
