/**
 * Seeded random number generator utilities
 * Uses a simple linear congruential generator (LCG) for deterministic randomness
 * @module utils/seeded-random-utils
 */

/**
 * Simple seeded random number generator using Linear Congruential Generator (LCG)
 * Same seed always produces the same sequence of random numbers
 */
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    // Convert string seed to number using hash-like function
    this.seed = this.hashString(seed);
  }

  /**
   * Hash a string to a number (simple hash function)
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // LCG parameters (same as used in many standard libraries)
    this.seed = (this.seed * 1664525 + 1013904223) % 2 ** 32;
    return (this.seed >>> 0) / 2 ** 32; // Convert to float between 0 and 1
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Shuffle array deterministically using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Create a seeded random number generator from a string seed
 */
export function createSeededRandom(seed: string): SeededRandom {
  return new SeededRandom(seed);
}
