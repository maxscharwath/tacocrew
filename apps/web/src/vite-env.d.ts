/// <reference types="vite/client" />

// Type declarations for vite-imagetools query parameters
// Note: TypeScript's module resolution doesn't handle query parameters well,
// but Vite handles these at build time, so these errors are non-blocking.
// We declare the base image types, and Vite will process the query parameters.

// Base image type declarations (vite/client should handle these, but we add explicit ones)
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

// For query parameters, we need to use a workaround since TypeScript doesn't
// support query strings in module declarations. The build will work fine,
// but TypeScript will show errors. These can be ignored as Vite handles them.
