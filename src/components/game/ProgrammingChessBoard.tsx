'use client';

import { useState, useCallback } from 'react';
// We'll create a simple board visualization instead of using the complex ChessBoard component
import { WraparoundChessEngine } from '@/lib/chessEngine';
import { 
  Square, 
  ChessPiece, 
  ProgrammingChessMove,
  CodeExecutionResult,
  GameVariant,
  PieceColor
} from '@/types/game';
import { Play, Pause, RotateCcw, Bug, Zap, Clock } from 'lucide-react';

// Piece symbols for display
const PIECE_SYMBOLS: Record<string, Record<string, string>> = {
  king: { white: '♔', black: '♚' },
  queen: { white: '♕', black: '♛' },
  rook: { white: '♖', black: '♜' },
  bishop: { white: '♗', black: '♝' },
  knight: { white: '♘', black: '♞' },
  pawn: { white: '♙', black: '♟' },
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

interface ProgrammingChessBoardDisplayProps {
  position: Record<Square, ChessPiece | null>;
  onSquareClick: (square: Square) => void;
  highlightedSquares: Square[];
  getSquareHighlight: (square: Square) => string | undefined;
  showCoordinates: boolean;
  variant: GameVariant;
  isInteractive: boolean;
}

function ProgrammingChessBoardDisplay({
  position,
  onSquareClick,
  highlightedSquares,
  getSquareHighlight,
  showCoordinates,
  variant,
  isInteractive
}: ProgrammingChessBoardDisplayProps) {
  const isLightSquare = (file: number, rank: number) => (file + rank) % 2 === 0;
  
  const getSquareColor = (file: number, rank: number, highlight?: string) => {
    const base = isLightSquare(file, rank) ? 'bg-amber-100' : 'bg-amber-800';
    
    if (highlight === 'from-move') return 'bg-green-400';
    if (highlight === 'to-move') return 'bg-green-500';
    if (highlight === 'last-from') return 'bg-blue-300';
    if (highlight === 'last-to') return 'bg-blue-400';
    if (highlight === 'possible') return isLightSquare(file, rank) ? 'bg-yellow-200' : 'bg-yellow-600';
    
    return base;
  };

  return (
    <div className="relative border-2 border-gray-800 rounded-lg overflow-hidden">
      {variant === 'programming_unboxed' && (
        <div className="absolute -top-2 -left-2 bg-purple-600 text-white px-2 py-1 text-xs rounded z-10">
          UNBOXED
        </div>
      )}
      
      <div className="grid grid-cols-8 gap-0">
        {RANKS.map((rankStr, rankIndex) => 
          FILES.map((fileStr, fileIndex) => {
            const square = `${fileStr}${rankStr}` as Square;
            const piece = position[square];
            const highlight = getSquareHighlight(square);
            
            return (
              <div
                key={square}
                className={`
                  relative w-12 h-12 flex items-center justify-center text-2xl font-bold cursor-pointer
                  transition-colors duration-200 hover:brightness-110
                  ${getSquareColor(fileIndex, rankIndex, highlight)}
                  ${isInteractive ? 'hover:opacity-80' : 'cursor-default'}
                `}
                onClick={() => isInteractive && onSquareClick(square)}
              >
                {piece && (
                  <span className={`select-none ${piece.color === 'white' ? 'text-white drop-shadow-md' : 'text-black'}`}>
                    {PIECE_SYMBOLS[piece.type][piece.color]}
                  </span>
                )}
                
                {/* Square coordinates */}
                {showCoordinates && (
                  <>
                    {fileIndex === 0 && (
                      <span className="absolute left-1 top-0 text-xs text-gray-600 font-medium">
                        {rankStr}
                      </span>
                    )}
                    {rankIndex === RANKS.length - 1 && (
                      <span className="absolute right-1 bottom-0 text-xs text-gray-600 font-medium">
                        {fileStr}
                      </span>
                    )}
                  </>
                )}
                
                {/* Highlight dots for possible moves */}
                {highlight === 'possible' && !piece && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gray-600 bg-opacity-60 rounded-full"></div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface ProgrammingChessBoardProps {
  chessEngine: WraparoundChessEngine;
  variant: GameVariant;
  currentPlayer: PieceColor;
  isExecuting: boolean;
  lastExecutionResult?: CodeExecutionResult;
  pendingMove?: ProgrammingChessMove;
  onMoveExecuted: (move: ProgrammingChessMove) => void;
  onReset: () => void;
  debugMode: boolean;
}

export default function ProgrammingChessBoard({
  chessEngine,
  variant,
  currentPlayer,
  isExecuting,
  lastExecutionResult,
  pendingMove,
  onMoveExecuted,
  onReset,
  debugMode
}: ProgrammingChessBoardProps) {
  const [highlightedSquares, setHighlightedSquares] = useState<Square[]>([]);
  const [showMoveAnimation, setShowMoveAnimation] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<CodeExecutionResult[]>([]);

  // Get current board position
  const position = chessEngine.getPosition();
  const gameStatus = {
    isCheck: chessEngine.inCheck(),
    isCheckmate: chessEngine.isCheckmate(),
    isDraw: chessEngine.isDraw(),
    turn: chessEngine.turn()
  };

  // Handle move execution
  const executePendingMove = useCallback(() => {
    if (pendingMove && !isExecuting) {
      setShowMoveAnimation(true);
      
      // Highlight the move path
      setHighlightedSquares([pendingMove.from, pendingMove.to]);
      
      // Execute after a brief delay for visual feedback
      setTimeout(() => {
        const success = chessEngine.makeMove(pendingMove.from, pendingMove.to, pendingMove.promotion);
        
        if (success) {
          onMoveExecuted(pendingMove);
          
          // Add to execution history
          if (lastExecutionResult) {
            setExecutionHistory(prev => [...prev.slice(-9), lastExecutionResult]);
          }
        }
        
        // Clear highlights after animation
        setTimeout(() => {
          setHighlightedSquares([]);
          setShowMoveAnimation(false);
        }, 500);
      }, 300);
    }
  }, [pendingMove, isExecuting, chessEngine, onMoveExecuted, lastExecutionResult]);

  // Handle square click (mainly for visual feedback in programming mode)
  const handleSquareClick = (square: Square) => {
    if (debugMode) {
      // In debug mode, show possible moves for clicked piece
      const piece = chessEngine.getPiece(square);
      if (piece && piece.color === currentPlayer) {
        const legalMoves = chessEngine.getLegalMoves(square);
        setHighlightedSquares([square, ...legalMoves]);
      } else {
        setHighlightedSquares([]);
      }
    }
  };

  // Get square colors for highlighting
  const getSquareHighlight = (square: Square): string | undefined => {
    if (highlightedSquares.includes(square)) {
      if (pendingMove && (square === pendingMove.from || square === pendingMove.to)) {
        return square === pendingMove.from ? 'from-move' : 'to-move';
      }
      return 'possible';
    }
    
    // Highlight last move
    if (lastExecutionResult?.move) {
      if (square === lastExecutionResult.move.from) return 'last-from';
      if (square === lastExecutionResult.move.to) return 'last-to';
    }
    
    return undefined;
  };

  // Format execution time
  const formatExecutionTime = (time: number): string => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Game Status Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">
              Programming Chess - {variant === 'programming_unboxed' ? 'Unboxed Mode' : 'Classic Mode'}
            </h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              gameStatus.isCheckmate
                ? 'bg-red-100 text-red-800'
                : gameStatus.isDraw
                ? 'bg-yellow-100 text-yellow-800'
                : gameStatus.isCheck
                ? 'bg-orange-100 text-orange-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {gameStatus.isCheckmate
                ? `Checkmate - ${gameStatus.turn === 'white' ? 'Black' : 'White'} Wins!`
                : gameStatus.isDraw
                ? 'Draw'
                : gameStatus.isCheck
                ? 'Check!'
                : `${gameStatus.turn === 'white' ? 'White' : 'Black'} to Move`
              }
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {debugMode && (
              <div className="flex items-center text-blue-600 text-sm">
                <Bug size={16} className="mr-1" />
                Debug Mode
              </div>
            )}
            
            <button
              onClick={onReset}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              <RotateCcw size={16} className="inline mr-1" />
              Reset
            </button>
          </div>
        </div>

        {/* Execution Status */}
        {(isExecuting || pendingMove || lastExecutionResult) && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {isExecuting ? (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Executing code...
                  </div>
                ) : pendingMove ? (
                  <div className="flex items-center space-x-3">
                    <div className="text-green-600 font-medium">
                      Move Ready: {pendingMove.from} → {pendingMove.to}
                      {pendingMove.promotion && ` (=${pendingMove.promotion})`}
                    </div>
                    <button
                      onClick={executePendingMove}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                    >
                      <Play size={14} className="inline mr-1" />
                      Execute
                    </button>
                  </div>
                ) : lastExecutionResult ? (
                  <div className={`flex items-center ${
                    lastExecutionResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {lastExecutionResult.success ? (
                      <>
                        <Zap size={16} className="mr-1" />
                        Move executed successfully
                      </>
                    ) : (
                      <>
                        <Bug size={16} className="mr-1" />
                        Execution failed: {lastExecutionResult.error}
                      </>
                    )}
                  </div>
                ) : null}
              </div>
              
              {lastExecutionResult && (
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock size={14} className="mr-1" />
                  {formatExecutionTime(lastExecutionResult.executionTime)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chess Board */}
      <div className="relative">
        <div className="relative inline-block">
          <ProgrammingChessBoardDisplay
            position={position}
            onSquareClick={handleSquareClick}
            highlightedSquares={highlightedSquares}
            getSquareHighlight={getSquareHighlight}
            showCoordinates={true}
            variant={variant}
            isInteractive={debugMode}
          />
        </div>
        
        {/* Overlay for execution state */}
        {isExecuting && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-600 font-medium">Executing your code...</span>
            </div>
          </div>
        )}
      </div>

      {/* Execution History */}
      {executionHistory.length > 0 && debugMode && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Execution History</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {executionHistory.slice(-5).map((result, index) => (
              <div key={index} className={`p-2 rounded text-sm ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success
                      ? `Move: ${result.move?.from} → ${result.move?.to}`
                      : `Error: ${result.error}`
                    }
                  </div>
                  <span className="text-gray-500 text-xs">
                    {formatExecutionTime(result.executionTime)}
                  </span>
                </div>
                {result.logs.length > 0 && (
                  <div className="mt-1 text-xs text-gray-600">
                    Console: {result.logs.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wraparound Mode Indicator */}
      {variant === 'programming_unboxed' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <Zap size={20} className="text-purple-600 mr-2" />
            <div>
              <h4 className="font-semibold text-purple-900">Chess Unboxed Mode Active</h4>
              <p className="text-purple-700 text-sm">
                Pieces can wrap around board edges! Use getWraparoundMoves() to find special moves.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}