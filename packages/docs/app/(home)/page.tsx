import Link from 'next/link';
import { Languages, Terminal, Zap, Globe, Code, Server } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-secondary px-4 py-1.5 text-sm font-medium mb-6">
          <Languages className="h-4 w-4" />
          AI-Powered i18n
        </div>
        <h1 className="mb-4 text-4xl font-bold md:text-6xl">
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            dev-translate
          </span>
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-fd-muted-foreground md:text-xl">
          Automatically translate your i18n JSON files using AI. Works with CLI, Vite, Next.js, and React with zero
          configuration.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/docs"
            className="rounded-lg bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="https://github.com/aexol-studio/dev-translate"
            className="rounded-lg border border-fd-border px-6 py-3 font-medium transition-colors hover:bg-fd-accent"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-fd-border bg-fd-secondary/50 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Features</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Terminal className="h-8 w-8" />}
              title="Powerful CLI"
              description="Translate, predict token usage, and manage cache with simple commands. Supports watch mode for automatic translation."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Framework Plugins"
              description="Native plugins for Vite and Next.js. Just add to your config and translations happen automatically."
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="30+ Languages"
              description="Support for Bulgarian, Czech, German, English, Spanish, French, Japanese, Korean, Chinese, and many more."
            />
            <FeatureCard
              icon={<Code className="h-8 w-8" />}
              title="Dynamite React Library"
              description="Build-time string extraction for React. Write t('Hello') and extract translations automatically."
            />
            <FeatureCard
              icon={<Server className="h-8 w-8" />}
              title="SSR & RSC Support"
              description="Full support for Server Components and Server-Side Rendering with dedicated utilities."
            />
            <FeatureCard
              icon={<Languages className="h-8 w-8" />}
              title="Smart Caching"
              description="Incremental translation with timestamp tracking. Only translate what changed to save costs."
            />
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold">Quick Start</h2>
          <div className="overflow-hidden rounded-lg border border-fd-border bg-fd-card">
            <div className="border-b border-fd-border bg-fd-muted px-4 py-2 text-sm font-medium">Terminal</div>
            <pre className="overflow-x-auto p-4 text-sm">
              <code className="text-fd-foreground">
                {`# Install the CLI
npm install -g @aexol/dev-translate

# Navigate to your project
cd your-project

# Run translation (creates config on first run)
dev-translate translate

# Watch mode for automatic translation
dev-translate translate -w`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="border-t border-fd-border bg-fd-secondary/50 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Packages</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <PackageCard
              name="@aexol/dev-translate"
              description="CLI tool for translating locale files"
              href="/docs/cli"
            />
            <PackageCard
              name="@aexol/dev-translate-core"
              description="Core translation logic and GraphQL API client"
              href="/docs/core"
            />
            <PackageCard
              name="@aexol/vite-plugin-dev-translate"
              description="Vite plugin for automatic translation"
              href="/docs/integrations/vite"
            />
            <PackageCard
              name="@aexol/nextjs-dev-translate-plugin"
              description="Next.js plugin for automatic translation"
              href="/docs/integrations/nextjs"
            />
            <PackageCard
              name="@aexol/dynamite"
              description="React i18n library with build-time extraction"
              href="/docs/dynamite"
              className="md:col-span-2"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-fd-border bg-fd-card p-6">
      <div className="mb-4 text-fd-primary">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-fd-muted-foreground">{description}</p>
    </div>
  );
}

function PackageCard({
  name,
  description,
  href,
  className = '',
}: {
  name: string;
  description: string;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col rounded-lg border border-fd-border bg-fd-card p-6 transition-colors hover:bg-fd-accent ${className}`}
    >
      <code className="mb-2 text-sm font-semibold text-fd-primary">{name}</code>
      <p className="text-fd-muted-foreground">{description}</p>
    </Link>
  );
}
