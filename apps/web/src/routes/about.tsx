import * as git from '@build/git';
import * as pkg from '@build/package';
import buildTime from '@build/time';
import { SiBluesky, SiGithub } from '@icons-pack/react-simple-icons';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@tacocrew/ui-kit';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  AtSignIcon,
  Calendar,
  Code2Icon,
  GitBranchIcon,
  GlobeIcon,
  Hash,
  Package,
  TagIcon,
  Users,
} from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import appIcon from '@/assets/icon.png?format=webp&img';
import { useDateFormat } from '@/hooks/useDateFormat';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

type Contributor = {
  name: string;
  email?: string;
  url?: string;
  github?: string;
  bluesky?: string;
};

function parseContributor(contributor: string | Contributor): Contributor {
  if (typeof contributor === 'string') {
    // Use more specific regex to avoid ReDoS: limit whitespace repetition
    const match = new RegExp(/^([^<(]+?)(?:\s?<([^>]+)>)?(?:\s?\(([^)]+)\))?$/).exec(contributor);
    if (match) {
      return {
        name: match[1].trim(),
        email: match[2],
        url: match[3],
      };
    }
    return { name: contributor };
  }
  return contributor;
}

function getGitHubUsername(githubUrl: string): string | null {
  const match = new RegExp(/github\.com\/([^/]+)/).exec(githubUrl);
  return match ? match[1] : null;
}

const socialButtonVariants = cva(
  'grid h-10 w-10 place-items-center rounded-xl border transition-all duration-200 hover:scale-105',
  {
    variants: {
      variant: {
        default:
          'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white',
        sky: 'border-sky-500/20 bg-sky-500/15 text-sky-400 hover:border-sky-500/30 hover:bg-sky-500/25 hover:text-sky-200',
        slate:
          'border-slate-700/30 bg-slate-800/30 text-slate-200 hover:border-slate-600/40 hover:bg-slate-800/40 hover:text-white',
        orange:
          'border-orange-500/20 bg-orange-500/15 text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/25 hover:text-orange-300',
        emerald:
          'border-emerald-500/20 bg-emerald-500/15 text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/25 hover:text-emerald-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type SocialButtonProps = {
  readonly href: string;
  readonly title: string;
  readonly children: ReactNode;
  readonly className?: string;
} & VariantProps<typeof socialButtonVariants>;

function SocialButton({ href, title, children, variant, className }: SocialButtonProps) {
  const isExternal = !href.startsWith('mailto:');

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={cn(socialButtonVariants({ variant }), className)}
      title={title}
    >
      {children}
    </a>
  );
}

function ContributorCard({ contributor }: { readonly contributor: Contributor }) {
  const initials = contributor.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const githubUsername = contributor.github ? getGitHubUsername(contributor.github) : null;
  const avatarUrl = githubUsername ? `https://github.com/${githubUsername}.png` : null;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-900/80 to-slate-950/80 p-3 transition-all duration-300 hover:border-brand-500/30 hover:shadow-brand-500/5 hover:shadow-lg sm:p-5">
      {/* Hover glow */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-center gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={contributor.name}
              className="h-16 w-16 rounded-2xl border-2 border-white/10 shadow-lg transition-all duration-300 group-hover:border-brand-500/30"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-linear-to-br from-brand-500 to-purple-600 font-bold text-white text-xl shadow-lg">
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg text-white">{contributor.name}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {contributor.github && (
              <SocialButton href={contributor.github} title="GitHub" variant="slate">
                <SiGithub size={16} />
              </SocialButton>
            )}
            {contributor.bluesky && (
              <SocialButton href={contributor.bluesky} title="Bluesky" variant="sky">
                <SiBluesky size={16} />
              </SocialButton>
            )}
            {contributor.email && (
              <SocialButton
                href={`mailto:${contributor.email}`}
                title={contributor.email}
                variant="orange"
              >
                <AtSignIcon size={16} />
              </SocialButton>
            )}
            {contributor.url && (
              <SocialButton href={contributor.url} title="Website" variant="emerald">
                <GlobeIcon size={16} />
              </SocialButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildInfoItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  readonly icon: ComponentType<{ size?: number; className?: string }>;
  readonly label: string;
  readonly value: string | null | undefined;
  readonly mono?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-400">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-slate-500 text-xs uppercase tracking-wider">{label}</p>
        <p className={`truncate text-sm text-white ${mono ? 'font-mono' : ''}`} title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function AboutRoute() {
  const { t } = useTranslation();
  const { formatDateTimeWithYear } = useDateFormat();

  const allContributorsList = (pkg.contributors || []).map(parseContributor);
  const authorInfo = pkg.author ? parseContributor(pkg.author) : null;

  const allContributors = authorInfo
    ? [authorInfo, ...allContributorsList.filter((c) => c.name !== authorInfo.name)]
    : allContributorsList;

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <Card className="relative overflow-hidden border-white/10">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-500/10 via-transparent to-purple-500/10" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-500/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/15 blur-[80px]" />

        <CardContent className="relative p-4 sm:p-8 lg:p-10">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
            {/* Logo */}
            <div className="shrink-0">
              <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-800 to-slate-900 shadow-2xl sm:h-32 sm:w-32">
                <img src={appIcon} alt="TacoCrew" className="h-full w-full object-cover" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <h1 className="font-bold text-3xl text-white tracking-tight sm:text-4xl">
                    TacoCrew
                  </h1>
                  <Badge tone="brand" pill>
                    v{pkg.version}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {git.tag && (
                    <Badge tone="neutral" pill className="gap-1 text-xs">
                      <TagIcon size={10} />
                      {git.tag}
                    </Badge>
                  )}
                  {git.isClean && (
                    <Badge tone="success" pill className="text-xs">
                      ✓ Clean
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <a href={pkg.repository.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="md" className="gap-2">
                    <SiGithub size={16} />
                    GitHub
                  </Button>
                </a>
                <Link to={routes.root.releases()}>
                  <Button variant="ghost" size="md" className="gap-2">
                    <Package size={16} />
                    {t('about.releaseNotes')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Build Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-400">
            <Code2Icon size={20} />
          </div>
          <CardTitle className="text-lg text-white">{t('about.buildInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <BuildInfoItem
            icon={Calendar}
            label={t('about.buildDate')}
            value={formatDateTimeWithYear(buildTime)}
          />
          <BuildInfoItem icon={GitBranchIcon} label={t('about.branch')} value={git.branch} />
          <BuildInfoItem icon={Hash} label={t('about.commit')} value={git.abbreviatedSha} mono />
          <BuildInfoItem
            icon={TagIcon}
            label={t('about.latestTag')}
            value={git.lastTag || git.tag}
          />
        </CardContent>
      </Card>

      {/* Contributors Card */}
      {allContributors.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-pink-500/10 text-pink-400">
              <Users size={20} />
            </div>
            <CardTitle className="text-lg text-white">{t('about.contributors')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              {allContributors.map((contributor, index) => (
                <ContributorCard key={contributor.email || index} contributor={contributor} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
