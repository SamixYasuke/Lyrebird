import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { HowItWorks } from "@/components/HowItWorks";
import { Showcase } from "@/components/Showcase";
import { Safety } from "@/components/Safety";
import { Features } from "@/components/Features";
import { Faq } from "@/components/Faq";
import { Cta } from "@/components/Cta";
import { Footer } from "@/components/Footer";

const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const TenantDetail = lazy(() =>
  import("@/pages/TenantDetail").then((m) => ({ default: m.TenantDetail })),
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <p className="font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
        loading console…
      </p>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <Showcase />
        <Safety />
        <Features />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/app"
          element={
            <Suspense fallback={<AppFallback />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/app/tenants/:tenantId"
          element={
            <Suspense fallback={<AppFallback />}>
              <TenantDetail />
            </Suspense>
          }
        />
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}
