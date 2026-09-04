import { customAlphabet } from 'nanoid';

// Excludes ambiguous characters (0/O, 1/I) since invite codes are read aloud
// and typed by hand. 32^6 ≈ 1.07 billion combinations.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generate = customAlphabet(ALPHABET, 6);

export function generateInviteCode(): string {
  return generate();
}
