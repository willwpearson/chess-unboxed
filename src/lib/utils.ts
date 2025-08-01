import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PieceType, PieceColor, Square } from '@/types/game';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Chess utility functions
export function getSquareColor(square: Square): 'light' | 'dark' {
  const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
  const rank = parseInt(square[1]) - 1; // 1=0, 2=1, etc.
  return (file + rank) % 2 === 0 ? 'dark' : 'light';
}

export function isValidSquare(square: string): square is Square {
  return /^[a-h][1-8]$/.test(square);
}

export function fileToIndex(file: string): number {
  return file.charCodeAt(0) - 97; // a=0, b=1, etc.
}

export function rankToIndex(rank: string): number {
  return parseInt(rank) - 1; // 1=0, 2=1, etc.
}

export function indexToFile(index: number): string {
  return String.fromCharCode(97 + index); // 0=a, 1=b, etc.
}

export function indexToRank(index: number): string {
  return String(index + 1); // 0=1, 1=2, etc.
}

export function squareToIndices(square: Square): [number, number] {
  return [fileToIndex(square[0]), rankToIndex(square[1])];
}

export function indicesToSquare(file: number, rank: number): Square {
  return `${indexToFile(file)}${indexToRank(rank)}` as Square;
}

// Piece symbol mapping for display
export const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

export function normalizeColor(color: string): PieceColor {
  if (color === 'w') return 'white';
  if (color === 'b') return 'black';
  if (color === 'white' || color === 'black') return color as PieceColor;
  console.error(`Unknown piece color: ${color}`);
  return 'white'; // fallback
}

export function normalizePieceType(type: string): PieceType {
  switch (type) {
    case 'p': return 'pawn';
    case 'r': return 'rook';
    case 'n': return 'knight';
    case 'b': return 'bishop';
    case 'q': return 'queen';
    case 'k': return 'king';
    case 'pawn':
    case 'rook':
    case 'knight':
    case 'bishop':
    case 'queen':
    case 'king':
      return type as PieceType;
    default:
      console.error(`Unknown piece type: ${type}`);
      return 'pawn'; // fallback
  }
}

export function getPieceSymbol(type: PieceType | string, color: PieceColor | string): string {
  // Handle chess.js single letter colors ('w'/'b') vs our full names ('white'/'black')
  let normalizedColor: PieceColor;
  if (color === 'w') {
    normalizedColor = 'white';
  } else if (color === 'b') {
    normalizedColor = 'black';
  } else if (color === 'white' || color === 'black') {
    normalizedColor = color as PieceColor;
  } else {
    console.error(`Unknown piece color: ${color}`);
    normalizedColor = 'white'; // fallback
  }
  
  // Handle chess.js single letter types vs our full names
  let normalizedType: PieceType;
  switch (type) {
    case 'p': normalizedType = 'pawn'; break;
    case 'r': normalizedType = 'rook'; break;
    case 'n': normalizedType = 'knight'; break;
    case 'b': normalizedType = 'bishop'; break;
    case 'q': normalizedType = 'queen'; break;
    case 'k': normalizedType = 'king'; break;
    case 'pawn':
    case 'rook':
    case 'knight':
    case 'bishop':
    case 'queen':
    case 'king':
      normalizedType = type as PieceType;
      break;
    default:
      console.error(`Unknown piece type: ${type}`);
      normalizedType = 'pawn'; // fallback
  }
  
  const symbol = PIECE_SYMBOLS[normalizedColor][normalizedType];
  console.log(`getPieceSymbol(${type}, ${color}) -> normalizedType: ${normalizedType}, normalizedColor: ${normalizedColor}, symbol: ${symbol}`);
  return symbol;
}

// Time formatting utilities
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatGameDuration(startTime: number, endTime?: number): string {
  const duration = (endTime || Date.now()) - startTime;
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes}m ${seconds}s`;
}

// User ID generation and storage
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getUserId(): string {
  if (typeof window === 'undefined') return generateUserId();
  
  let userId = localStorage.getItem('chess-user-id');
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem('chess-user-id', userId);
  }
  return userId;
}

export function clearUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('chess-user-id');
  }
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidGameId(gameId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(gameId) && gameId.length >= 6;
}

// Debounce utility for API calls
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for real-time events
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Local storage helpers with error handling
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error && error.message.includes('fetch'))
  );
}
