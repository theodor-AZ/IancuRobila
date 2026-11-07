import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Logo } from "./logo";
import { MainNav, MainNavFallback } from "./main-nav";
import { ThemeToggle } from "./theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="no-print sticky top-0 z-30 border-b bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="rounded-sm" aria-label="ClaimGuard X home">
            <Logo size={22} />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
            <Suspense fallback={<MainNavFallback />}>
              <MainNav />
            </Suspense>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/scan/new" className={buttonVariants({ size: "sm" })}>
              <Plus aria-hidden className="size-4" />
              New scan
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
