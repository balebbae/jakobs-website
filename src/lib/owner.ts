/** Each browser owns its saves through a private, unguessable ID cookie set by src/proxy.ts. */
export const OWNER_COOKIE = "glow_owner";
export const OWNER_MAX_AGE = 60 * 60 * 24 * 400;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isOwnerId = (value: string | undefined | null): value is string => !!value && UUID.test(value);
