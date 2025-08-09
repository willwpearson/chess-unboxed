/**
 * Enhanced Move History Component
 * Displays comprehensive chess move history with proper algebraic notation,
 * Chess Unboxed wraparound support, and advanced features
 */
'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChessMove, 
  PieceType, 
  GamePosition, 
  MoveAnnotation, 
  MoveEvaluation 
} from '@/types/game';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { 
  ScrollText, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  EyeOff,
  Star,
  Zap,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { 
  formatMoveWithAnnotations, 
  generatePGN
} from '@/lib/moveNotation';
import { WraparoundChessEngine } from '@/lib/chessEngine';

interface MoveHistoryProps {
  moves: ChessMove[];
  currentMoveIndex?: number;
  onMoveClick?: (moveIndex: number) => void;
  gamePosition?: GamePosition;
  isWraparoundMode?: boolean;
  engine?: WraparoundChessEngine;
  gameInfo?: {
    white: string;
    black: string;
    result: string;
    date?: string;
    event?: string;
    site?: string;
  };
  showEvaluations?: boolean;
  showTimings?: boolean;
  showWraparoundInfo?: boolean;
}

export function MoveHistory({ 
  moves, 
  currentMoveIndex, 
  onMoveClick,
  gamePosition,
  isWraparoundMode = false,
  engine,
  gameInfo,
  showEvaluations = true,
  showTimings = true,
  showWraparoundInfo = true
}: MoveHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'captures' | 'checks' | 'wraparound'>('all');
  const [showDetails, setShowDetails] = useState(true);

  // Format moves with enhanced notation
  const formattedMoves = useMemo(() => {
    return moves.map((move, index) => {
      const context = {
        position: gamePosition || {} as GamePosition,
        moves,
        moveIndex: index,
        isWraparoundMode,
        engine
      };

      return {
        ...move,
        ...formatMoveWithAnnotations(move, context),
        index
      };
    });
  }, [moves, gamePosition, isWraparoundMode, engine]);

  // Filter moves based on search and filter criteria
  const filteredMoves = useMemo(() => {
    return formattedMoves.filter(move => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesNotation = move.notation.toLowerCase().includes(searchLower);
        const matchesPiece = move.piece.type.toLowerCase().includes(searchLower);
        const matchesSquare = move.from.includes(searchLower) || move.to.includes(searchLower);
        
        if (!matchesNotation && !matchesPiece && !matchesSquare) {
          return false;
        }
      }

      // Type filter
      switch (filterType) {
        case 'captures':
          return !!move.captured;
        case 'checks':
          return move.isCheck || move.isCheckmate;
        case 'wraparound':
          return move.isWraparound;
        default:
          return true;
      }
    });
  }, [formattedMoves, searchTerm, filterType]);

  const formatMoveNumber = (index: number): string => {
    return Math.floor(index / 2) + 1 + (index % 2 === 0 ? '.' : '...');
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleExportPGN = () => {
    if (!gameInfo) return;
    
    const pgn = generatePGN(moves, gameInfo);
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${Date.now()}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMoveIcon = (move: typeof formattedMoves[0]) => {
    if (move.isCheckmate) return <Star className="w-3 h-3 text-yellow-500" />;
    if (move.isCheck) return <AlertCircle className="w-3 h-3 text-orange-500" />;
    if (move.captured) return <Zap className="w-3 h-3 text-red-500" />;
    if (move.isWraparound) return <RotateCcw className="w-3 h-3 text-purple-500" />;
    return <CheckCircle className="w-3 h-3 text-green-500" />;
  };

  if (moves.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Move History</h3>
        </div>
        <div className="p-4">
          <div className="text-center py-6 text-gray-500">
            <ScrollText size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No moves yet</p>
            <p className="text-xs text-gray-400">Moves will appear here as the game progresses</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-gray-900">
              Moves
              {isWraparoundMode && (
                <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                  Unboxed
                </span>
              )}
            </h3>
            <span className="text-xs text-gray-500">
              {moves.length}
            </span>
          </div>
          
          {/* Compact controls */}
          <div className="flex items-center space-x-1">
            {gameInfo && (
              <button
                onClick={handleExportPGN}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Export PGN"
              >
                <Download size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Move List */}
      <div className="p-2">
        <div className="max-h-80 overflow-y-auto">
          {filteredMoves.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p className="text-xs">No moves match your filters</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {/* Group moves by pairs (white, black) */}
              {Array.from({ length: Math.ceil(filteredMoves.length / 2) }, (_, pairIndex) => {
                const whiteMove = filteredMoves.find(m => m.index === pairIndex * 2);
                const blackMove = filteredMoves.find(m => m.index === pairIndex * 2 + 1);
                
                return (
                  <div key={pairIndex} className="flex items-center space-x-1 text-xs">
                    {/* Move number */}
                    <span className="text-gray-400 font-mono w-6 text-right">
                      {pairIndex + 1}.
                    </span>
                    
                    {/* White move */}
                    <div 
                      className={`flex-1 p-1.5 rounded cursor-pointer transition-colors ${
                        whiteMove && currentMoveIndex === whiteMove.index 
                          ? 'bg-blue-50 text-blue-900' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => whiteMove && onMoveClick?.(whiteMove.index)}
                    >
                      {whiteMove ? (
                        <div className="flex items-center space-x-1">
                          <span className="font-mono font-medium">{whiteMove.notation}</span>
                          {whiteMove.captured && <span className="text-red-500">×</span>}
                          {whiteMove.isCheck && <span className="text-orange-500">+</span>}
                          {whiteMove.isCheckmate && <span className="text-red-500">#</span>}
                          {whiteMove.isWraparound && <span className="text-purple-500">↺</span>}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </div>
                    
                    {/* Black move */}
                    <div 
                      className={`flex-1 p-1.5 rounded cursor-pointer transition-colors ${
                        blackMove && currentMoveIndex === blackMove.index 
                          ? 'bg-blue-50 text-blue-900' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => blackMove && onMoveClick?.(blackMove.index)}
                    >
                      {blackMove ? (
                        <div className="flex items-center space-x-1">
                          <span className="font-mono font-medium">{blackMove.notation}</span>
                          {blackMove.captured && <span className="text-red-500">×</span>}
                          {blackMove.isCheck && <span className="text-orange-500">+</span>}
                          {blackMove.isCheckmate && <span className="text-red-500">#</span>}
                          {blackMove.isWraparound && <span className="text-purple-500">↺</span>}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
