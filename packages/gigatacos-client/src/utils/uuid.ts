/**
 * UUID utilities
 * @module gigatacos-client/utils/uuid
 */

import { NIL, v5, validate } from 'uuid';

/**
 * Default namespace for deterministic UUID generation
 */
const DEFAULT_NAMESPACE = NIL;

/**
 * Generate a deterministic UUID (v5) from a seed
 */
export const deterministicUUID = (seed: string, namespace?: string): string => {
  let ns:string = DEFAULT_NAMESPACE;
  if (namespace) {
    ns = validate(namespace) ? namespace : v5(namespace, NIL);
  }
  return v5(seed, ns);
};