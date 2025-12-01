import { SiBluesky, SiGithub } from '@icons-pack/react-simple-icons';
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
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { abbreviatedSha, branch, github, isClean, lastTag, tag } from '@build/git';
import { author, contributors, repository, version } from '@build/package';
import buildTime from '@build/time';

const GITHUB_URL = github ?? repository.url;
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useDateFormat } from '@/hooks/useDateFormat';
import { routes } from '@/lib/routes';

type Contributor = {
  name: string;
  email?: string;
  url?: string;
  github?: string;
  bluesky?: string;
};

function parseContributor(contributor: string | Contributor): Contributor {
  if (typeof contributor === 'string') {
    const match = contributor.match(/^([^<(]+)(?:\s*<([^>]+)>)?(?:\s*\(([^)]+)\))?$/);
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
  const match = githubUrl.match(/github\.com\/([^/]+)/);
  return match ? match[1] : null;
}

function SocialButton({
  href,
  title,
  children,
  variant = 'default',
}: {
  href: string;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'bluesky' | 'github';
}) {
  const isExternal = !href.startsWith('mailto:');
  const variantClasses = {
    default: 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white',
    bluesky: 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300',
    github: 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white',
  };

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={`grid h-10 w-10 place-items-center rounded-xl border border-white/10 transition-all duration-200 hover:scale-105 hover:border-white/20 ${variantClasses[variant]}`}
      title={title}
    >
      {children}
    </a>
  );
}

function ContributorCard({ contributor }: { contributor: Contributor }) {
  const initials = contributor.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const githubUsername = contributor.github ? getGitHubUsername(contributor.github) : null;
  const avatarUrl = githubUsername ? `https://github.com/${githubUsername}.png` : null;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-900/80 to-slate-950/80 p-5 transition-all duration-300 hover:border-brand-500/30 hover:shadow-brand-500/5 hover:shadow-lg">
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
              <SocialButton href={contributor.github} title="GitHub" variant="github">
                <SiGithub size={16} />
              </SocialButton>
            )}
            {contributor.bluesky && (
              <SocialButton href={contributor.bluesky} title="Bluesky" variant="bluesky">
                <SiBluesky size={16} />
              </SocialButton>
            )}
            {contributor.email && (
              <SocialButton href={`mailto:${contributor.email}`} title={contributor.email}>
                <AtSignIcon size={16} />
              </SocialButton>
            )}
            {contributor.url && (
              <SocialButton href={contributor.url} title="Website">
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
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

  const allContributorsList = (contributors || []).map(parseContributor);
  const authorInfo = author ? parseContributor(author) : null;

  const allContributors = authorInfo
    ? [authorInfo, ...allContributorsList.filter((c) => c.name !== authorInfo.name)]
    : allContributorsList;

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <Card className="relative overflow-hidden border-white/10">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-500/10 via-transparent to-purple-500/10" />
        <div className="-top-20 -right-20 pointer-events-none absolute h-64 w-64 rounded-full bg-brand-500/20 blur-[80px]" />
        <div className="-bottom-20 -left-20 pointer-events-none absolute h-64 w-64 rounded-full bg-purple-500/15 blur-[80px]" />

        <CardContent className="relative p-8 sm:p-10">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            {/* Logo */}
            <div className="shrink-0">
              <div className="grid h-28 w-28 place-items-center rounded-3xl border border-white/10 bg-linear-to-br from-slate-800 to-slate-900 shadow-2xl sm:h-32 sm:w-32">
                <span className="text-6xl sm:text-7xl">🌮</span>
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
                    v{version}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {tag && (
                    <Badge tone="neutral" pill className="gap-1 text-xs">
                      <TagIcon size={10} />
                      {tag}
                    </Badge>
                  )}
                  {isClean && (
                    <Badge tone="success" pill className="text-xs">
                      ✓ Clean
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
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
          <BuildInfoItem icon={GitBranchIcon} label={t('about.branch')} value={branch} />
          <BuildInfoItem icon={Hash} label={t('about.commit')} value={abbreviatedSha} mono />
          <BuildInfoItem
            icon={TagIcon}
            label={t('about.latestTag')}
            value={lastTag || tag}
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
