// Override bun-types HTMLBundle for email templates loaded as text via build.ts loader config
declare module '@/templates/emails/layout.html' {
  const content: string;
  export default content;
}

declare module '@/templates/emails/reset-password.html' {
  const content: string;
  export default content;
}

declare module '@/templates/emails/verify-email.html' {
  const content: string;
  export default content;
}
