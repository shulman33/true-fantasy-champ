import { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen field-bg">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-1 container mx-auto max-w-screen-xl p-4 md:p-6 lg:p-8" role="main">
        <div className="crt-effect p-6 md:p-8 lg:p-10">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
