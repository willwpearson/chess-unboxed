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
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ScrollText size={20} />
            <h3 className="text-lg font-semibold">Move History</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <ScrollText size={48} className="mx-auto mb-4 opacity-30" />
            <p>No moves yet</p>
            <p className="text-sm">Moves will appear here as the game progresses</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ScrollText size={20} />
            <h3 className="text-lg font-semibold">
              Move History
              {isWraparoundMode && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  Unboxed
                </span>
              )}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1 hover:bg-gray-100 rounded"
              title="Search moves"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 hover:bg-gray-100 rounded"
              title={showDetails ? "Hide details" : "Show details"}
            >
              {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {gameInfo && (
              <button
                onClick={handleExportPGN}
                className="p-1 hover:bg-gray-100 rounded"
                title="Export PGN"
              >
                <Download size={16} />
              </button>
            )}
          </div>
        </div>

        {showSearch && (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              placeholder="Search moves..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <div className="flex space-x-2">
              {['all', 'captures', 'checks', 'wraparound'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as any)}
                  className={`px-2 py-1 text-xs rounded capitalize ${
                    filterType === type 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
          <span>
            {filteredMoves.length} of {moves.length} move{moves.length !== 1 ? 's' : ''}
          </span>
          {searchTerm || filterType !== 'all' ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-1">
          {filteredMoves.map((move) => {
            const isCurrentMove = currentMoveIndex === move.index;
            const isWhiteMove = move.index % 2 === 0;
            
            return (
              <div
                key={move.index}
                className={`
                  relative p-2 rounded cursor-pointer transition-all duration-200
                  ${isCurrentMove 
                    ? 'bg-blue-100 border border-blue-300 shadow-sm' 
                    : 'hover:bg-gray-50'
                  }
                  ${onMoveClick ? 'cursor-pointer' : 'cursor-default'}
                `}
                onClick={() => onMoveClick?.(move.index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Move number */}
                    <span className="text-xs font-mono text-gray-500 w-8">
                      {formatMoveNumber(move.index)}
                    </span>
                    
                    {/* Player indicator */}
                    <div className={`w-3 h-3 rounded-full ${
                      isWhiteMove ? 'bg-gray-200 border border-gray-400' : 'bg-gray-800'
                    }`} />
                    
                    {/* Move notation */}
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="font-mono text-sm font-medium">
                        {move.notation}
                      </span>
                      
                      {/* Move icon */}
                      {getMoveIcon(move)}
                      
                      {/* Annotations */}
                      {move.annotation && (
                        <span className="text-xs text-blue-600 font-bold">
                          {move.annotation}
                        </span>
                      )}
                      
                      {/* Evaluation */}
                      {showEvaluations && move.evaluation && typeof move.evaluation === 'object' && (
                        <span className={`text-xs px-1 rounded ${move.evaluation.color} ${move.evaluation.bg}`}>
                          {move.evaluation.symbol}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Timing */}
                  {showTimings && (
                    <span className="text-xs text-gray-400 font-mono ml-2">
                      {formatTime(move.timestamp)}
                    </span>
                  )}
                </div>

                {/* Additional move details */}
                {showDetails && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {/* Captured piece */}
                    {move.captured && (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        ×{move.captured.type}
                      </span>
                    )}
                    
                    {/* Promotion */}
                    {move.promotion && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        ={move.promotion}
                      </span>
                    )}
                    
                    {/* En passant */}
                    {move.enPassant && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        e.p.
                      </span>
                    )}
                    
                    {/* Wraparound info */}
                    {showWraparoundInfo && move.isWraparound && move.wraparoundInfo && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded flex items-center space-x-1">
                          <span>{move.wraparoundInfo.symbol}</span>
                          <span>{move.wraparoundInfo.type}</span>
                          {move.wraparoundInfo.distance && (
                            <span>[{move.wraparoundInfo.distance}]</span>
                          )}
                        </span>
                      </div>
                    )}
                    
                    {/* Evaluation score */}
                    {showEvaluations && move.evaluation && typeof move.evaluation === 'object' && move.evaluation.score && (
                      <span className="text-xs text-gray-500">
                        {move.evaluation.score > 0 ? '+' : ''}{(move.evaluation.score / 100).toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {moves.length > 10 && (
          <div className="mt-3 pt-3 border-t text-center">
            <span className="text-xs text-gray-500">
              {filteredMoves.length < moves.length 
                ? `Showing ${filteredMoves.length} of ${moves.length} moves`
                : 'Scroll to see all moves'
              }
            </span>
          </div>
        )}
      </CardContent>

      {/* Footer with game statistics */}
      {gameInfo && (
        <CardFooter>
          <div className="w-full text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>{gameInfo.white} vs {gameInfo.black}</span>
              <span>{gameInfo.result}</span>
            </div>
            {(gameInfo.event || gameInfo.site) && (
              <div className="flex justify-between">
                {gameInfo.event && <span>{gameInfo.event}</span>}
                {gameInfo.site && <span>{gameInfo.site}</span>}
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
