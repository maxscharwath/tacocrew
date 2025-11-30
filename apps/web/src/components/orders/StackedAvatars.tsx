import { Avatar } from '@/components/ui';
import { getAvatarUrl } from '@/lib/api/user';
import {
  getAvatarSizeClass,
  getAvatarSizePixels,
  getStackedOffsetClass,
  getUserInitials,
} from './user-utils';

type Participant = {
  readonly userId: string;
  readonly name: string | null;
};

type StackedAvatarsProps = {
  readonly participants: Participant[];
  readonly maxVisible?: number;
  readonly size?: 'sm' | 'md';
};

/**
 * Stacked avatar component for displaying multiple participants
 * Shows overlapping avatars with a count badge if there are more than maxVisible
 */
export function StackedAvatars({
  participants,
  maxVisible = 5,
  size = 'sm',
}: StackedAvatarsProps) {
  if (participants.length === 0) {
    return null;
  }

  const visible = participants.slice(0, maxVisible);
  const remaining = participants.length - maxVisible;
  const avatarSize = getAvatarSizePixels(size);
  const avatarClass = getAvatarSizeClass(size, 'stacked');
  const offsetClass = getStackedOffsetClass(size);

  return (
    <div className="mx-2 flex items-center overflow-visible">
      {visible.map((participant, index) => (
        <div
          key={participant.userId}
          className={`${index > 0 ? offsetClass : ''} relative overflow-hidden rounded-full border border-brand-400 shadow-sm`}
          style={{ zIndex: index + 1 }}
        >
          <Avatar
            color="brandHero"
            size={size}
            variant="default"
            src={getAvatarUrl(participant.userId, { size: avatarSize })}
            className={`${avatarClass} border-0`}
          >
            {getUserInitials(participant.name)}
          </Avatar>
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`${offsetClass} relative flex min-w-8 items-center justify-center rounded-full border border-brand-400 bg-slate-800 px-2 shadow-sm ${avatarClass} font-semibold text-sm text-white`}
          style={{ zIndex: 10 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
