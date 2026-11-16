/**
 * Tiny client-side auth helper.
 *
 * Keys are never stored in clear — only a salted hash. This is a demo-grade
 * gate for the browser build; when Supabase is connected, sign-in moves to
 * Supabase Auth (`profiles.role` already carries the role in the schema).
 */

/** Deterministic SHA-256-length-ish hash built on FNV-1a (sync, no async plumbing). */
export const hashKey = (login: string, key: string): string => {
  const input = `${login.trim().toLowerCase()}::${key.trim().toUpperCase()}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c + i;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return [h1, h2, (h1 ^ h2) >>> 0, (h1 + h2) >>> 0]
    .map((n) => n.toString(16).padStart(8, "0"))
    .join("");
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I

/** Human-friendly access code, e.g. "K7QP-4M2X". */
export const generateKey = (groups = 2): string =>
  Array.from({ length: groups }, () =>
    Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join(""),
  ).join("-");

export const normaliseLogin = (v: string) => v.trim().toLowerCase();

/** Accept an email, a phone number or a name-ish username. */
export const looksLikeLogin = (v: string) => v.trim().length >= 3;

export const keyIsStrongEnough = (v: string) => v.trim().length >= 6;
