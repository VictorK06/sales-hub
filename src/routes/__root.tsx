import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sales & Inventory Tracker" },
      { name: "description", content: "Register products and sales with automatic stock tracking." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Sales & Inventory Tracker" },
      { property: "og:description", content: "Register products and sales with automatic stock tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [qc] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={qc}>
      <AppLayout />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div
              className="h-9 w-9 rounded-lg shadow-[var(--shadow-elegant)]"
              style={{ background: "var(--gradient-primary)" }}
            />
            <span className="font-serif text-xl tracking-tight text-foreground">
              Vendora
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition"
            >
              Dashboard
            </Link>
            <Link
              to="/products"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition"
            >
              Products
            </Link>
            <Link
              to="/sales"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition"
            >
              Sales
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
