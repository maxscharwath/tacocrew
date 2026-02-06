import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
// `with { type: 'text' }` ensures Bun loads HTML as plain strings
// in both dev (runtime) and prod (bundler with text loader)
import layoutHtml from '@/templates/emails/layout.html' with { type: 'text' };
import resetPasswordHtml from '@/templates/emails/reset-password.html' with { type: 'text' };
import verifyEmailHtml from '@/templates/emails/verify-email.html' with { type: 'text' };

const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:5173';

const templates: Record<string, string> = {
  'reset-password': resetPasswordHtml,
  'verify-email': verifyEmailHtml,
};

// Logo PNG (96x96) loaded once at startup
const logoPng = readFileSync(join(import.meta.dirname, 'assets', 'logo.png'));

export interface EmailUser {
  readonly email: string;
  readonly name: string;
  readonly image?: string | null;
}

export interface EmailAttachment {
  readonly content: Buffer;
  readonly filename: string;
  readonly contentType: string;
  readonly contentId: string;
}

export interface RenderedEmail {
  readonly html: string;
  readonly attachments: readonly EmailAttachment[];
}

async function buildAvatarAttachment(user: EmailUser): Promise<EmailAttachment> {
  if (user.image) {
    // User has an image (base64 data URI from DB) — resize to 80x80 with sharp
    const base64Data = user.image.replace(/^data:image\/\w+;base64,/, '');
    const resized = await sharp(Buffer.from(base64Data, 'base64'))
      .resize(80, 80, { fit: 'cover' })
      .png()
      .toBuffer();

    return {
      content: resized,
      filename: 'avatar.png',
      contentType: 'image/png',
      contentId: 'avatar',
    };
  }

  // No image — generate a 80x80 purple circle with the user's initial using sharp
  const initial = (user.name || user.email).charAt(0).toUpperCase();
  const svg = `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="#9e77ed"/>
    <text x="40" y="40" text-anchor="middle" dominant-baseline="central"
      font-family="sans-serif" font-size="36" font-weight="600" fill="white">${initial}</text>
  </svg>`;

  const fallback = await sharp(Buffer.from(svg)).png().toBuffer();
  return {
    content: fallback,
    filename: 'avatar.png',
    contentType: 'image/png',
    contentId: 'avatar',
  };
}

export async function renderEmail(
  template: keyof typeof templates,
  user: EmailUser,
  variables: Readonly<Record<string, string>>
): Promise<RenderedEmail> {
  const contentHtml = templates[template];
  if (!contentHtml) {
    throw new Error(`Unknown email template: ${template}`);
  }

  const userName = user.name || user.email.split('@')[0] || 'there';

  const allVars: Record<string, string> = {
    frontendUrl,
    email: user.email,
    userName,
    ...variables,
  };

  const interpolate = (html: string) =>
    html.replace(/\{\{(\w+)\}\}/g, (_, key: string) => allVars[key] ?? '');

  const html = interpolate(layoutHtml.replace('{{content}}', interpolate(contentHtml)));

  const avatarAttachment = await buildAvatarAttachment(user);

  return {
    html,
    attachments: [
      { content: logoPng, filename: 'logo.png', contentType: 'image/png', contentId: 'logo' },
      avatarAttachment,
    ],
  };
}
