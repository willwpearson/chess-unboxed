import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameState, GameMode, UIState, Square, ChessPiece, ChessMove, GameVariant, BotConfig, PieceColor } from '@/types/game';
import { GameManager, BotManager, createGame, createBotPlayer, createHumanPlayer } from '@/lib/gameManager';
import { loadGameManager, type GameRow } from '@/lib/server/gameSession';
import { supabase } from '@/lib/supabase';
import { HEARTBEAT_INTERVAL_MS } from '@/lib/abandonmentConfig';

interface GameStore {
  // Current game state
  currentGame: GameState | null;
  gameManager: GameManager | null;
  botManager: BotManager | null;
  gameHistory: GameState[];

  // Multiplayer (mode 'private'/'ranked'/'casual') state
  activeGameId: string | null;
  myColor: PieceColor | null;
  realtimeChannel: RealtimeChannel | null;
  drawOfferedBy: PieceColor | null;
  heartbeatIntervalId: ReturnType<typeof setInterval> | null;

  // UI state
  ui: UIState;

  // Game management actions
  initializeGame: (mode: GameMode, variant: GameVariant, botConfig?: BotConfig) => Promise<boolean>;
  initializeMultiplayerGame: (gameId: string, userId: string) => Promise<boolean>;
  subscribeToGame: (gameId: string) => void;
  unsubscribeFromGame: () => void;
  makeMove: (from: Square, to: Square, promotion?: string) => Promise<boolean>;
  resignGame: () => Promise<void>;
  offerDraw: () => Promise<void>;
  acceptDraw: () => Promise<void>;
  getLegalMoves: (square: Square) => Square[];
  getCurrentFEN: () => string | null;
  
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
    (set, get) => {
      // Applies an opponent-driven update (a new move, or a resign/draw-accept/
      // timeout that ends the game without one) to the local GameManager.
      // Reuses GameManager.makeMove()/resign()/offerDraw() as the single apply
      // mechanism instead of a second parallel state-mutation path — for the
      // no-new-move-but-status-changed case, the color passed to resign() is
      // derived explicitly from the row's winner_id (the loser), not from
      // "whichever local player is acting," so it's correctly attributed even
      // though the end came from the opponent's action, not ours.
      const handleRemoteGameUpdate = (row: Record<string, any>) => {
        const { gameManager } = get();
        if (!gameManager) return;

        const localMoveCount = gameManager.getGameState().moves.length;
        const remoteMoves: ChessMove[] = row.moves ?? [];

        if (remoteMoves.length > localMoveCount) {
          for (let i = localMoveCount; i < remoteMoves.length; i++) {
            const move = remoteMoves[i];
            const result = gameManager.makeMove(move.from as Square, move.to as Square, move.promotion as any);
            if (!result.isValid) {
              console.error('Failed to apply remote move:', move, result.error);
              break;
            }
          }
        } else if (row.status === 'abandoned' && !gameManager.isGameOver()) {
          if (row.winner_id === null) {
            // Both players abandoned — no one to credit a win to.
            gameManager.forfeitByMutualAbandonment();
          } else {
            const abandoningColor: PieceColor = row.winner_id === row.white_player_id ? 'black' : 'white';
            gameManager.forfeitByAbandonment(abandoningColor);
          }
        } else if (row.status === 'completed' && !gameManager.isGameOver()) {
          if (row.winner_id) {
            const loserColor: PieceColor = row.winner_id === row.white_player_id ? 'black' : 'white';
            gameManager.resign(loserColor);
          } else {
            gameManager.offerDraw();
          }
        }

        const updatedGameState = gameManager.getGameState();
        set({
          currentGame: {
            ...updatedGameState,
            players: {
              white: { ...updatedGameState.players.white, timeRemaining: row.white_time_ms ?? updatedGameState.players.white.timeRemaining },
              black: { ...updatedGameState.players.black, timeRemaining: row.black_time_ms ?? updatedGameState.players.black.timeRemaining },
            },
          },
          drawOfferedBy: row.draw_offered_by
            ? (row.draw_offered_by === row.white_player_id ? 'white' : 'black')
            : null,
        });
        get().addToHistory(updatedGameState);
      };

      return {
      currentGame: null,
      gameManager: null,
      botManager: null,
      gameHistory: [],
      activeGameId: null,
      myColor: null,
      realtimeChannel: null,
      drawOfferedBy: null,
      heartbeatIntervalId: null,
      ui: initialUIState,

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

      initializeMultiplayerGame: async (gameId: string, userId: string): Promise<boolean> => {
        try {
          const response = await fetch(`/api/games?id=${gameId}`, { credentials: 'include' });
          const body = await response.json();
          const row: GameRow & Record<string, any> = body.game;
          if (!row) {
            console.error('Failed to load game:', body.error);
            return false;
          }

          const gameManager = loadGameManager(row);
          const myColor: PieceColor = row.white_player_id === userId ? 'white' : 'black';

          // Close any stale channel/heartbeat directly (not via
          // unsubscribeFromGame — that also clears activeGameId/myColor/
          // drawOfferedBy, which would wipe out the values this same call is
          // about to set below).
          const { realtimeChannel: staleChannel, heartbeatIntervalId: staleHeartbeatId } = get();
          if (staleChannel) supabase.removeChannel(staleChannel);
          if (staleHeartbeatId) clearInterval(staleHeartbeatId);

          set({
            gameManager,
            botManager: null,
            currentGame: gameManager.getGameState(),
            activeGameId: gameId,
            myColor,
            drawOfferedBy: row.draw_offered_by
              ? (row.draw_offered_by === row.white_player_id ? 'white' : 'black')
              : null,
          });

          get().addToHistory(gameManager.getGameState());
          get().subscribeToGame(gameId);
          return true;
        } catch (error) {
          console.error('Failed to initialize multiplayer game:', error);
          return false;
        }
      },

      subscribeToGame: (gameId: string) => {
        // Heartbeat is plain fetch-based (see src/app/api/games/[gameId]/heartbeat)
        // and runs regardless of Realtime availability — it's also how the
        // opponent's own presence gets refreshed, and how this client learns
        // an opponent was forfeited for going quiet (see abandonment.ts).
        const heartbeatIntervalId = setInterval(async () => {
          try {
            const response = await fetch(`/api/games/${gameId}/heartbeat`, {
              method: 'POST',
              credentials: 'include',
            });
            const body = await response.json();
            if (body.success && body.data.status !== 'in_progress') {
              const gameResponse = await fetch(`/api/games?id=${gameId}`, { credentials: 'include' });
              const gameBody = await gameResponse.json();
              if (gameBody.game) handleRemoteGameUpdate(gameBody.game);
            }
          } catch (error) {
            console.error('Heartbeat failed:', error);
          }
        }, HEARTBEAT_INTERVAL_MS);
        set({ heartbeatIntervalId });

        // In dev mode (NEXT_PUBLIC_DEV_MODE=true) `supabase` resolves to the
        // in-memory devDb mock, which has no `.channel()` — there's no
        // Postgres WAL to subscribe to. Skip Realtime there rather than
        // throwing; opponent moves just won't live-sync in dev mode without
        // a manual refresh (no polling fallback for in-game moves, unlike
        // the lobby waiting room, since polling every move would be noisy).
        if (typeof supabase.channel !== 'function') return;

        const channel = supabase
          .channel(`game:${gameId}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
            (payload: { new: Record<string, any> }) => handleRemoteGameUpdate(payload.new)
          )
          .subscribe();
        set({ realtimeChannel: channel });
      },

      unsubscribeFromGame: () => {
        const { realtimeChannel, heartbeatIntervalId } = get();
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
        }
        if (heartbeatIntervalId) {
          clearInterval(heartbeatIntervalId);
        }
        set({ realtimeChannel: null, activeGameId: null, myColor: null, drawOfferedBy: null, heartbeatIntervalId: null });
      },

      makeMove: async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
        const { gameManager, botManager, currentGame, activeGameId } = get();
        if (!gameManager) return false;

        if (currentGame?.mode !== 'bot' && activeGameId) {
          try {
            const response = await fetch(`/api/games/${activeGameId}/move`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ from, to, promotion }),
            });
            const body = await response.json();
            if (!body.success) {
              console.warn('Move rejected by server:', body.error);
              return false;
            }

            // Server already validated the move — this local call is view-sync,
            // not a second validation pass.
            const result = gameManager.makeMove(from, to, promotion as any);
            if (!result.isValid) {
              console.error('Local replay of a server-confirmed move failed unexpectedly:', result.error);
              return false;
            }

            const updatedGameState = gameManager.getGameState();
            set({ currentGame: updatedGameState });
            get().addToHistory(updatedGameState);
            get().clearUI();
            return true;
          } catch (error) {
            console.error('Move failed:', error);
            return false;
          }
        }

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
                    console.log('Bot move completed - final game state turn:', finalGameState.position.turn, 'status:', finalGameState.status);
                    set({ currentGame: finalGameState });
                    get().addToHistory(finalGameState);
                  } else {
                    console.log('Bot move was invalid:', botResult.error);
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

      resignGame: async () => {
        const { gameManager, currentGame, activeGameId, myColor } = get();
        if (!gameManager) return;

        if (currentGame?.mode !== 'bot' && activeGameId && myColor) {
          try {
            const response = await fetch(`/api/games/${activeGameId}/resign`, {
              method: 'POST',
              credentials: 'include',
            });
            const body = await response.json();
            if (!body.success) {
              console.warn('Resign failed:', body.error);
              return;
            }
            gameManager.resign(myColor);
            const updatedGameState = gameManager.getGameState();
            set({ currentGame: updatedGameState });
            get().addToHistory(updatedGameState);
          } catch (error) {
            console.error('Resign failed:', error);
          }
          return;
        }

        const currentPlayer = gameManager.getCurrentPlayer();
        gameManager.resign(currentPlayer);

        const updatedGameState = gameManager.getGameState();
        set({ currentGame: updatedGameState });
        get().addToHistory(updatedGameState);
      },

      offerDraw: async () => {
        const { gameManager, currentGame, activeGameId, myColor } = get();
        if (!gameManager) return;

        if (currentGame?.mode !== 'bot' && activeGameId) {
          try {
            const response = await fetch(`/api/games/${activeGameId}/draw-offer`, {
              method: 'POST',
              credentials: 'include',
            });
            const body = await response.json();
            if (!body.success) {
              console.warn('Draw offer failed:', body.error);
              return;
            }
            set({ drawOfferedBy: myColor });
          } catch (error) {
            console.error('Draw offer failed:', error);
          }
          return;
        }

        gameManager.offerDraw();

        const updatedGameState = gameManager.getGameState();
        set({ currentGame: updatedGameState });
        get().addToHistory(updatedGameState);
      },

      acceptDraw: async () => {
        const { gameManager, currentGame, activeGameId } = get();
        if (!gameManager || currentGame?.mode === 'bot' || !activeGameId) return;

        try {
          const response = await fetch(`/api/games/${activeGameId}/draw-accept`, {
            method: 'POST',
            credentials: 'include',
          });
          const body = await response.json();
          if (!body.success) {
            console.warn('Accept draw failed:', body.error);
            return;
          }
          gameManager.offerDraw();
          const updatedGameState = gameManager.getGameState();
          set({ currentGame: updatedGameState, drawOfferedBy: null });
          get().addToHistory(updatedGameState);
        } catch (error) {
          console.error('Accept draw failed:', error);
        }
      },

      getLegalMoves: (square: Square): Square[] => {
        const { gameManager } = get();
        if (!gameManager) return [];

        return gameManager.getLegalMovesForSquare(square);
      },

      getCurrentFEN: (): string | null => {
        const { gameManager } = get();
        if (!gameManager) return null;

        return gameManager.getFEN();
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
      };
    },
    { name: 'game-store' }
  )
);
