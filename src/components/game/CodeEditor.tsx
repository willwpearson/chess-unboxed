'use client';

import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { CodeExecutionResult } from '@/types/game';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onExecute: () => void;
  executionResult?: CodeExecutionResult;
  isExecuting: boolean;
  debugMode: boolean;
  onDebugModeChange: (enabled: boolean) => void;
  variant: 'classic' | 'unboxed';
}

// Chess API definitions for TypeScript IntelliSense
const CHESS_API_DEFINITIONS = `
declare interface ChessBoard {
  [square: string]: ChessPiece | null;
}

declare interface ChessPiece {
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
}

declare interface GameState {
  turn: 'white' | 'black';
  moveNumber: number;
  isCheck: boolean;
  isCheckmate: boolean;
  lastMove?: ChessMove;
  castlingRights: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
  enPassantTarget?: string;
}

declare interface ChessMove {
  from: string;
  to: string;
  piece: ChessPiece;
  captured?: ChessPiece;
  promotion?: 'queen' | 'rook' | 'bishop' | 'knight';
  castling?: 'kingside' | 'queenside';
  enPassant?: boolean;
  isWraparound?: boolean;
}

declare interface ProgrammingChessContext {
  board: ChessBoard;
  pieces: {
    white: string[];
    black: string[];
  };
  gameState: GameState;
  history: ChessMove[];
}

declare interface MoveResult {
  from: string;
  to: string;
  piece: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  promotion?: 'queen' | 'rook' | 'bishop' | 'knight';
}

// Chess Helper Functions
declare function getPiece(square: string): ChessPiece | null;
declare function getLegalMoves(square: string): string[];
declare function isSquareAttacked(square: string, byColor: 'white' | 'black'): boolean;
declare function evaluatePosition(): number;
declare function getSquareColor(square: string): 'light' | 'dark';
declare function getDistance(from: string, to: string): number;
declare function isOnSameDiagonal(square1: string, square2: string): boolean;
declare function isOnSameRankOrFile(square1: string, square2: string): boolean;
declare function getKingPosition(color: 'white' | 'black'): string | null;
declare function log(message: any): void;

// Wraparound specific functions (only available in unboxed mode)
${variant === 'unboxed' ? `
declare function getWraparoundMoves(square: string): string[];
declare function getWraparoundDistance(from: string, to: string): number;
declare function isWraparoundPath(from: string, to: string): boolean;
` : ''}

// Main function that players must implement
declare function makeMove(context: ProgrammingChessContext): MoveResult;
`;

const DEFAULT_CODE = {
  classic: `function makeMove(context) {
  // Your chess AI logic goes here
  // Access the board: context.board
  // Get your pieces: context.pieces.white or context.pieces.black
  // Check game state: context.gameState
  // View move history: context.history
  
  const { board, pieces, gameState } = context;
  const myColor = gameState.turn;
  const myPieces = pieces[myColor];
  
  // Example: Find a random legal move
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece) {
      const legalMoves = getLegalMoves(square);
      if (legalMoves.length > 0) {
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        return {
          from: square,
          to: randomMove,
          piece: piece.type
        };
      }
    }
  }
  
  // Fallback (should not happen if there are legal moves)
  return null;
}`,
  unboxed: `function makeMove(context) {
  // Programming Unboxed: Use wraparound features!
  // The board wraps around at the edges - pieces can move through borders
  
  const { board, pieces, gameState } = context;
  const myColor = gameState.turn;
  const myPieces = pieces[myColor];
  
  // Look for wraparound opportunities
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece) {
      // Check for wraparound moves
      const wraparoundMoves = getWraparoundMoves(square);
      if (wraparoundMoves.length > 0) {
        // Prefer wraparound moves for surprise attacks
        const move = wraparoundMoves[0];
        log('Using wraparound move: ' + square + ' to ' + move);
        return {
          from: square,
          to: move,
          piece: piece.type
        };
      }
      
      // Fallback to regular moves
      const legalMoves = getLegalMoves(square);
      if (legalMoves.length > 0) {
        return {
          from: square,
          to: legalMoves[0],
          piece: piece.type
        };
      }
    }
  }
  
  return null;
}`
};

export default function CodeEditor({
  code,
  onChange,
  onExecute,
  executionResult,
  isExecuting,
  debugMode,
  onDebugModeChange,
  variant
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;

    // Add chess API definitions for IntelliSense
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      CHESS_API_DEFINITIONS,
      'chess-api.d.ts'
    );

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      bracketColoring: true,
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onExecute();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      onDebugModeChange(!debugMode);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onExecute();
    }
  };

  useEffect(() => {
    if (!code && variant) {
      onChange(DEFAULT_CODE[variant]);
    }
  }, [code, onChange, variant]);

  return (
    <div className="flex flex-col h-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Chess AI Code - {variant === 'classic' ? 'Standard Chess' : 'Chess Unboxed'}
          </h3>
          <div className="flex items-center">
            <label className="flex items-center text-xs text-gray-600">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => onDebugModeChange(e.target.checked)}
                className="mr-1"
              />
              Debug Mode
            </label>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onExecute}
            disabled={isExecuting}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              isExecuting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isExecuting ? 'Running...' : 'Run (Ctrl+Enter)'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative" onKeyDown={handleKeyDown}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => onChange(value || '')}
          onMount={handleEditorDidMount}
          options={{
            selectOnLineNumbers: true,
            automaticLayout: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
            },
          }}
        />
      </div>

      {/* Execution Results */}
      {executionResult && (
        <div className="border-t border-gray-200 bg-white">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700">Execution Result</h4>
              <span className="text-xs text-gray-500">
                {executionResult.executionTime}ms
              </span>
            </div>
            
            {executionResult.success ? (
              <div className="space-y-1">
                {executionResult.move && (
                  <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                    Move: {executionResult.move.from} → {executionResult.move.to}
                    {executionResult.move.promotion && ` (=${executionResult.move.promotion})`}
                  </div>
                )}
                {executionResult.logs.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">Console Logs:</p>
                    {executionResult.logs.map((log, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                Error: {executionResult.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
        <p className="text-xs text-blue-700">
          <strong>Tip:</strong> Implement the <code>makeMove(context)</code> function to return your move. 
          Use <code>getPiece()</code>, <code>getLegalMoves()</code>, and other helper functions. 
          {variant === 'unboxed' && (
            <span> In Unboxed mode, use <code>getWraparoundMoves()</code> for edge-wrapping moves!</span>
          )}
        </p>
      </div>
    </div>
  );
}