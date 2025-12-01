import {
  ArrowLeft,
  Calendar,
  Download,
  ExternalLink,
  Github,
  Package,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Suspense, useState } from 'react';
import Markdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { Await, Link, type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { repository } from '@build/package';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { useDateFormat } from '@/hooks/useDateFormat';
import { routes } from '@/lib/routes';
import { defer } from '@/lib/utils/defer';

type GitHubRelease = {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  assets: Array<{
    name: string;
    size: number;
    download_count: number;
    browser_download_url: string;
  }>;
};

async function fetchGitHubReleases(): Promise<GitHubRelease[]> {
  try {
    const response = await fetch(`${repository.url.replace('github.com', 'api.github.com/repos')}/releases`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch releases:', response.statusText);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch releases:', error);
    return [];
  }
}

export async function releasesLoader(_: LoaderFunctionArgs) {
  return defer({
    releases: fetchGitHubReleases(),
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function ReleaseCard({ release, isLatest }: { release: GitHubRelease; isLatest: boolean }) {
  const { t } = useTranslation();
  const { formatDateOnly } = useDateFormat();
  const [isExpanded, setIsExpanded] = useState(isLatest);

  return (
    <Card
      className={`overflow-hidden shadow-[0_20px_60px_rgba(8,47,73,0.25)] transition-all duration-300 ${
        isLatest
          ? 'border-brand-500/30 bg-linear-to-br from-brand-950/50 via-slate-900/90 to-slate-950/90'
          : ''
      }`}
    >
      <CardHeader
        className="cursor-pointer transition-colors hover:bg-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={isLatest ? 'brand' : 'neutral'}
              pill
              className="gap-1"
            >
              <Tag size={10} />
              {release.tag_name}
            </Badge>
            {isLatest && (
              <Badge tone="success" pill className="gap-1">
                <Sparkles size={10} />
                {t('releases.latest')}
              </Badge>
            )}
            {release.prerelease && (
              <Badge tone="warning" pill>
                {t('releases.prerelease')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Calendar size={14} />
            {formatDateOnly(release.published_at, 'MMM d, yyyy')}
          </div>
        </div>
        <CardTitle className="mt-2 text-white">
          {release.name || release.tag_name}
        </CardTitle>
        {!isExpanded && release.body && (
          <CardDescription className="line-clamp-2">
            {release.body.replace(/[#*`]/g, '').slice(0, 200)}...
          </CardDescription>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 border-white/5 border-t pt-6">
          {/* Author info */}
          <div className="flex items-center gap-3">
            <img
              src={release.author.avatar_url}
              alt={release.author.login}
              className="h-8 w-8 rounded-full border border-white/10"
            />
            <div>
              <a
                href={release.author.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white text-sm hover:text-brand-300"
              >
                {release.author.login}
              </a>
              <p className="text-slate-400 text-xs">{t('releases.releasedThis')}</p>
            </div>
          </div>

          {/* Release body (markdown) */}
          {release.body && (
            <div className="prose prose-invert prose-sm max-w-none rounded-xl border border-white/5 bg-slate-900/50 p-4">
              <Markdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mt-4 mb-2 border-white/10 border-b pb-2 font-bold text-xl text-white">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-4 mb-2 font-bold text-lg text-white">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-3 mb-1 font-semibold text-base text-white">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="my-2 text-slate-300 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-2 space-y-1 pl-4">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-slate-300 before:mr-2 before:text-brand-400 before:content-['•']">
                      {children}
                    </li>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-brand-300 text-xs">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="block overflow-x-auto rounded-lg bg-slate-800 p-3 font-mono text-slate-300 text-xs">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="my-3 overflow-x-auto rounded-lg bg-slate-800 p-4">
                      {children}
                    </pre>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-300 underline decoration-brand-400/30 underline-offset-2 transition-colors hover:text-brand-200 hover:decoration-brand-400"
                    >
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-3 border-brand-500/50 border-l-2 pl-4 text-slate-400 italic">
                      {children}
                    </blockquote>
                  ),
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt}
                      className="my-4 max-w-full rounded-lg border border-white/10"
                    />
                  ),
                }}
              >
                {release.body}
              </Markdown>
            </div>
          )}

          {/* Assets */}
          {release.assets.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-medium text-slate-300 text-sm">
                <Package size={16} />
                {t('releases.assets')} ({release.assets.length})
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {release.assets.map((asset) => (
                  <a
                    key={asset.name}
                    href={asset.browser_download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-slate-900/50 p-3 transition-colors hover:border-brand-400/30 hover:bg-brand-500/5"
                  >
                    <Download size={16} className="shrink-0 text-brand-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white text-sm">{asset.name}</p>
                      <p className="text-slate-400 text-xs">
                        {formatBytes(asset.size)} • {asset.download_count} {t('releases.downloads')}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* View on GitHub */}
          <div className="flex justify-end border-white/5 border-t pt-4">
            <a href={release.html_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-2">
                <Github size={16} />
                {t('releases.viewOnGitHub')}
                <ExternalLink size={12} />
              </Button>
            </a>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function ReleasesListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-6 w-48" />
            <Skeleton className="mt-1 h-4 w-full" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function ReleasesList({ releases }: { releases: GitHubRelease[] }) {
  const { t } = useTranslation();

  if (releases.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-12">
          <EmptyState
            title={t('releases.noReleases')}
            description={t('releases.noReleasesDescription')}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {releases.map((release, index) => (
        <ReleaseCard key={release.id} release={release} isLatest={index === 0} />
      ))}
    </div>
  );
}

export function ReleasesRoute() {
  const { t } = useTranslation();
  const { releases } = useLoaderData<{ releases: Promise<GitHubRelease[]> }>();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to={routes.root.about()}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              {t('releases.backToAbout')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-purple-500/15 via-slate-900/90 to-brand-900/30 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur-sm">
        <div className="-top-24 absolute right-0 h-60 w-60 animate-pulse rounded-full bg-purple-400/20 blur-3xl" />
        <div className="-bottom-16 absolute left-10 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />

        <div className="relative">
          <Badge tone="brand" pill className="mb-4 uppercase tracking-[0.3em]">
            {t('releases.changelog')}
          </Badge>
          <h1 className="font-bold text-3xl text-white tracking-tight lg:text-4xl">
            {t('releases.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-300 leading-relaxed">
            {t('releases.description')}
          </p>
        </div>
      </section>

      {/* Releases */}
      <Suspense fallback={<ReleasesListSkeleton />}>
        <Await resolve={releases}>
          {(resolvedReleases) => <ReleasesList releases={resolvedReleases} />}
        </Await>
      </Suspense>
    </div>
  );
}

