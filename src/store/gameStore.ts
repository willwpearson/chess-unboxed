import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { GameState, GameMode, UIState, Square, ChessPiece, ChessMove, GameVariant, BotConfig } from '@/types/game';
import { GameManager, BotManager, createGame, createBotPlayer, createHumanPlayer } from '@/lib/gameManager';

interface GameStore {
  // Current game state
  currentGame: GameState | null;
  gameManager: GameManager | null;
  botManager: BotManager | null;
  gameHistory: GameState[];
  
  // UI state
  ui: UIState;
  
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Game management actions
  initializeGame: (mode: GameMode, variant: GameVariant, botConfig?: BotConfig) => Promise<boolean>;
  makeMove: (from: Square, to: Square, promotion?: string) => Promise<boolean>;
  resignGame: () => void;
  offerDraw: () => void;
  getLegalMoves: (square: Square) => Square[];
  
  // Legacy actions (for backward compatibility)
  setCurrentGame: (game: GameState | null) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  addToHistory: (game: GameState) => void;
  clearHistory: () => void;
  
  // UI actions
  setSelectedSquare: (square: Square | null) => void;
  setPossibleMoves: (moves: Square[]) => void;
  setDraggedPiece: (piece: { piece: ChessPiece; from: Square } | null) => void;
  showPromotionDialog: (square: Square) => void;
  hidePromotionDialog: () => void;
  clearUI: () => void;
  
  // Connection actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setConnectionError: (error: string | null) => void;
}

const initialUIState: UIState = {
  selectedSquare: null,
  possibleMoves: [],
  draggedPiece: null,
  showPromotionDialog: false,
  promotionSquare: null,
};

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      currentGame: null,
      gameManager: null,
      botManager: null,
      gameHistory: [],
      ui: initialUIState,
      isConnected: false,
      isConnecting: false,
      connectionError: null,

      // Enhanced game management actions
      initializeGame: async (mode: GameMode, variant: GameVariant, botConfig?: BotConfig): Promise<boolean> => {
        try {
          // Create players
          const humanPlayer = createHumanPlayer('You', 'white', 1200);
          let botPlayer = null;
          
          if (mode === 'bot' && botConfig) {
            botPlayer = createBotPlayer('Bot', 'black', botConfig.difficulty);
          }

          // Create game manager
          const gameManager = createGame({
            mode,
            variant,
            players: {
              white: humanPlayer,
              black: botPlayer || humanPlayer // Fallback for non-bot modes
            }
          });

          // Create bot manager if needed
          let botManager = null;
          if (mode === 'bot' && botConfig) {
            botManager = new BotManager(gameManager, botConfig.difficulty);
          }

          // Update store
          set({ 
            gameManager, 
            botManager,
            currentGame: gameManager.getGameState()
          });

          get().addToHistory(gameManager.getGameState());
          return true;
        } catch (error) {
          console.error('Failed to initialize game:', error);
          return false;
        }
      },

      makeMove: async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
        const { gameManager, botManager } = get();
        if (!gameManager) return false;

        try {
          // Make player move
          const currentGameState = gameManager.getGameState();
          console.log('GameStore: calling gameManager.makeMove with:', { from, to, promotion });
          console.log('GameManager current turn:', currentGameState.position.turn);
          console.log('GameManager current game state:', currentGameState);
          const result = gameManager.makeMove(from, to, promotion as any);
          console.log('GameManager makeMove result:', result);
          
          if (!result.isValid) {
            console.warn('Invalid move:', result.error);
            return false;
          }

          // Update game state
          const updatedGameState = gameManager.getGameState();
          set({ currentGame: updatedGameState });
          get().addToHistory(updatedGameState);

          // Clear UI selection
          get().clearUI();

          // If game ended, don't make bot move
          if (result.gameEnd) {
            return true;
          }

          // Make bot move if it's bot's turn
          console.log('Bot move check - botManager:', !!botManager, 'turn:', updatedGameState.position.turn, 'gameOver:', gameManager.isGameOver());
          if (botManager && updatedGameState.position.turn === 'black' && !gameManager.isGameOver()) {
            console.log('Making bot move...');
            setTimeout(async () => {
              try {
                const botMove = await botManager.generateMove();
                console.log('Bot generated move:', botMove);
                if (botMove) {
                  const botResult = gameManager.makeMove(botMove.from, botMove.to, botMove.promotion);
                  console.log('Bot move result:', botResult);
                  if (botResult.isValid) {
                    const finalGameState = gameManager.getGameState();
                    set({ currentGame: finalGameState });
                    get().addToHistory(finalGameState);
                  }
                }
              } catch (error) {
                console.error('Bot move failed:', error);
              }
            }, 100); // Small delay for better UX
          }

          return true;
        } catch (error) {
          console.error('Move failed:', error);
          return false;
        }
      },

      resignGame: () => {
        const { gameManager } = get();
        if (!gameManager) return;

        const currentPlayer = gameManager.getCurrentPlayer();
        gameManager.resign(currentPlayer);
        
        const updatedGameState = gameManager.getGameState();
        set({ currentGame: updatedGameState });
        get().addToHistory(updatedGameState);
      },

      offerDraw: () => {
        const { gameManager } = get();
        if (!gameManager) return;

        gameManager.offerDraw();
        
        const updatedGameState = gameManager.getGameState();
        set({ currentGame: updatedGameState });
        get().addToHistory(updatedGameState);
      },

      getLegalMoves: (square: Square): Square[] => {
        const { gameManager } = get();
        if (!gameManager) return [];

        return gameManager.getLegalMovesForSquare(square);
      },

      // Legacy actions (for backward compatibility)
      setCurrentGame: (game: GameState | null) => {
        set({ currentGame: game });
        if (game) {
          get().addToHistory(game);
        }
      },

      updateGameState: (updates: Partial<GameState>) => {
        const currentGame = get().currentGame;
        if (currentGame) {
          const updatedGame = { ...currentGame, ...updates };
          set({ currentGame: updatedGame });
          get().addToHistory(updatedGame);
        }
      },

      addToHistory: (game: GameState) => {
        const history = get().gameHistory;
        const lastGame = history[history.length - 1];
        
        // Only add if it's different from the last entry
        if (!lastGame || lastGame.updatedAt !== game.updatedAt) {
          set({
            gameHistory: [...history.slice(-49), game], // Keep last 50 states
          });
        }
      },

      clearHistory: () => set({ gameHistory: [] }),

      setSelectedSquare: (square: Square | null) => {
        const { gameManager } = get();
        const possibleMoves = square && gameManager ? gameManager.getLegalMovesForSquare(square) : [];
        
        set({
          ui: {
            ...get().ui,
            selectedSquare: square,
            possibleMoves: square ? possibleMoves : [],
          },
        });
      },

      setPossibleMoves: (moves: Square[]) => {
        set({
          ui: {
            ...get().ui,
            possibleMoves: moves,
          },
        });
      },

      setDraggedPiece: (piece: { piece: ChessPiece; from: Square } | null) => {
        const { gameManager } = get();
        const possibleMoves = piece && gameManager ? gameManager.getLegalMovesForSquare(piece.from) : [];
        
        set({
          ui: {
            ...get().ui,
            draggedPiece: piece,
            possibleMoves: piece ? possibleMoves : [],
          },
        });
      },

      showPromotionDialog: (square: Square) => {
        set({
          ui: {
            ...get().ui,
            showPromotionDialog: true,
            promotionSquare: square,
          },
        });
      },

      hidePromotionDialog: () => {
        set({
          ui: {
            ...get().ui,
            showPromotionDialog: false,
            promotionSquare: null,
          },
        });
      },

      clearUI: () => set({ ui: initialUIState }),

      setConnected: (connected: boolean) => set({ isConnected: connected }),

      setConnecting: (connecting: boolean) => set({ isConnecting: connecting }),

      setConnectionError: (error: string | null) => set({ connectionError: error }),
    }),
    { name: 'game-store' }
  )
);
