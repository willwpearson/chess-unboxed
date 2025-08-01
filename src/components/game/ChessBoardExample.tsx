/**
 * Example usage of the ChessBoard component with chess.js integration
 * This demonstrates how to use the component in different scenarios
 */
'use client';

import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from './ChessBoard';
import { ChessMove, PieceColor } from '@/types/game';

export function ChessBoardExample() {
  const [chess] = useState(() => new Chess());
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');

  const handleMove = (move: ChessMove) => {
    console.log('Move made:', move);
    
    // Update the current player
    setCurrentPlayer(chess.turn() === 'w' ? 'white' : 'black');
    
    // Here you would typically send the move to your backend
    // or update your game state store
  };

  const handleResign = () => {
    console.log('Player resigned');
    // Handle resignation logic
  };

  const handleOfferDraw = () => {
    console.log('Draw offered');
    // Handle draw offer logic
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Chess Board with chess.js Integration</h1>
      
      {/* Example 1: Using with chess.js instance */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Using chess.js instance:</h2>
        <ChessBoard
          chess={chess}
          onMove={handleMove}
          onResign={handleResign}
          onOfferDraw={handleOfferDraw}
          currentPlayer={currentPlayer}
          isPlayerTurn={true}
          showCoordinates={true}
          boardTheme="classic"
        />
      </div>

      {/* Example 2: Using with FEN string */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Using FEN string (Sicilian Defense):</h2>
        <ChessBoard
          fen="rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6"
          onMove={(move) => console.log('FEN Board move:', move)}
          currentPlayer="white"
          isPlayerTurn={true}
          showCoordinates={true}
          boardTheme="modern"
        />
      </div>

      {/* Game Info */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Game Status:</h3>
        <p>Turn: {chess.turn() === 'w' ? 'White' : 'Black'}</p>
        <p>Check: {chess.inCheck() ? 'Yes' : 'No'}</p>
        <p>Checkmate: {chess.isCheckmate() ? 'Yes' : 'No'}</p>
        <p>Stalemate: {chess.isStalemate() ? 'Yes' : 'No'}</p>
        <p>FEN: {chess.fen()}</p>
      </div>
    </div>
  );
}