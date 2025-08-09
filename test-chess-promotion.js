// Test chess.js promotion parameter expectations
const { Chess } = require('chess.js');

const chess = new Chess();
chess.load('rnbq3r/ppppPppk/5n2/8/8/8/PPPP1PPP/RNBQKBNR w KQ - 0 4'); // White pawn on e7

console.log('Testing different promotion parameter formats:');

// Test 1: Full name 'queen'
try {
  const chess1 = new Chess();
  chess1.load('rnbq3r/ppppPppk/5n2/8/8/8/PPPP1PPP/RNBQKBNR w KQ - 0 4');
  const result1 = chess1.move({from: 'e7', to: 'e8', promotion: 'queen'});
  console.log('✓ "queen" works:', result1.san);
} catch (error) {
  console.log('✗ "queen" failed:', error.message);
}

// Test 2: Single letter 'q'
try {
  const chess2 = new Chess();
  chess2.load('rnbq3r/ppppPppk/5n2/8/8/8/PPPP1PPP/RNBQKBNR w KQ - 0 4');
  const result2 = chess2.move({from: 'e7', to: 'e8', promotion: 'q'});
  console.log('✓ "q" works:', result2.san);
} catch (error) {
  console.log('✗ "q" failed:', error.message);
}

// Test 3: Other pieces
try {
  const chess3 = new Chess();
  chess3.load('rnbq3r/ppppPppk/5n2/8/8/8/PPPP1PPP/RNBQKBNR w KQ - 0 4');
  const result3 = chess3.move({from: 'e7', to: 'e8', promotion: 'rook'});
  console.log('✓ "rook" works:', result3.san);
} catch (error) {
  console.log('✗ "rook" failed:', error.message);
}

try {
  const chess4 = new Chess();
  chess4.load('rnbq3r/ppppPppk/5n2/8/8/8/PPPP1PPP/RNBQKBNR w KQ - 0 4');
  const result4 = chess4.move({from: 'e7', to: 'e8', promotion: 'r'});
  console.log('✓ "r" works:', result4.san);
} catch (error) {
  console.log('✗ "r" failed:', error.message);
}