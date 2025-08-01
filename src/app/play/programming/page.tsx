'use client';

import { useState, useCallback, useEffect } from 'react';
import { ProgrammingChessEngine, CODE_TEMPLATES } from '@/lib/programmingChess';
import CodeEditor from '@/components/game/CodeEditor';
import ProgrammingChessBoard from '@/components/game/ProgrammingChessBoard';
import { 
  CodeExecutionResult, 
  ProgrammingChessMove, 
  GameVariant, 
  PieceColor,
  CodeTemplate 
} from '@/types/game';
import { 
  Play, 
  Square as SquareIcon, 
  Brain, 
  Code, 
  BookOpen, 
  Settings,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ProgrammingChessPage() {
  // Game state
  const [variant, setVariant] = useState<GameVariant>('programming');
  const [programmingEngine, setProgrammingEngine] = useState<ProgrammingChessEngine | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  
  // Code state
  const [userCode, setUserCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | undefined>();
  const [pendingMove, setPendingMove] = useState<ProgrammingChessMove | undefined>();
  
  // UI state
  const [debugMode, setDebugMode] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize engine
  useEffect(() => {
    const engine = new ProgrammingChessEngine(undefined, variant);
    setProgrammingEngine(engine);
    setCurrentPlayer(engine.getChessEngine().turn());
  }, [variant]);

  // Handle code execution
  const executeCode = useCallback(async () => {
    if (!programmingEngine || isExecuting || !userCode.trim()) return;

    setIsExecuting(true);
    setPendingMove(undefined);

    try {
      const result = await programmingEngine.executeUserCode(userCode);
      setExecutionResult(result);

      if (result.success && result.move) {
        setPendingMove(result.move);
      }
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        logs: []
      });
    } finally {
      setIsExecuting(false);
    }
  }, [programmingEngine, userCode, isExecuting]);

  // Handle move execution
  const handleMoveExecuted = useCallback((move: ProgrammingChessMove) => {
    if (!programmingEngine) return;

    const success = programmingEngine.executeMove(move);
    if (success) {
      setCurrentPlayer(programmingEngine.getChessEngine().turn());
      setPendingMove(undefined);
      
      // Check if game is over
      const engine = programmingEngine.getChessEngine();
      if (engine.isCheckmate() || engine.isDraw()) {
        // Game over
        console.log('Game over!');
      }
    }
  }, [programmingEngine]);

  // Handle game reset
  const handleReset = useCallback(() => {
    if (!programmingEngine) return;
    
    programmingEngine.reset();
    setCurrentPlayer(programmingEngine.getChessEngine().turn());
    setPendingMove(undefined);
    setExecutionResult(undefined);
  }, [programmingEngine]);

  // Load code template
  const loadTemplate = useCallback((templateId: string) => {
    const isUnboxed = variant === 'programming_unboxed';
    const template = CODE_TEMPLATES.beginner[isUnboxed ? 'unboxed' : 'classic'];
    
    if (templateId === 'intermediate') {
      const intermediateTemplate = CODE_TEMPLATES.intermediate[isUnboxed ? 'unboxed' : 'classic'];
      setUserCode(intermediateTemplate);
    } else {
      setUserCode(template);
    }
    
    setSelectedTemplate(templateId);
    setShowTemplates(false);
  }, [variant]);

  // Switch variant
  const switchVariant = useCallback((newVariant: GameVariant) => {
    setVariant(newVariant);
    setUserCode('');
    setExecutionResult(undefined);
    setPendingMove(undefined);
    setSelectedTemplate(null);
  }, []);

  if (!programmingEngine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Programming Chess...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Brain className="mr-3 text-blue-600" size={32} />
                Programming Chess
              </h1>
              
              {/* Variant Selector */}
              <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => switchVariant('programming')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    variant === 'programming'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <SquareIcon size={16} className="inline mr-1" />
                  Classic
                </button>
                <button
                  onClick={() => switchVariant('programming_unboxed')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    variant === 'programming_unboxed'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Code size={16} className="inline mr-1" />
                  Unboxed
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowTemplates(!showTemplates)}
                variant="outline"
                size="sm"
              >
                <BookOpen size={16} className="mr-1" />
                Templates
                {showTemplates ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
              </Button>
              
              <Button
                onClick={() => setShowHelp(!showHelp)}
                variant="outline"
                size="sm"
              >
                <Lightbulb size={16} className="mr-1" />
                Help
              </Button>
            </div>
          </div>

          {/* Templates Panel */}
          {showTemplates && (
            <Card className="mb-4 p-4">
              <h3 className="text-lg font-semibold mb-3">Code Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => loadTemplate('beginner')}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-medium text-green-600">Beginner Template</h4>
                  <p className="text-sm text-gray-600">Simple random move generator</p>
                </div>
                <div
                  onClick={() => loadTemplate('intermediate')}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-medium text-blue-600">Intermediate Template</h4>
                  <p className="text-sm text-gray-600">Basic tactics and piece development</p>
                </div>
              </div>
            </Card>
          )}

          {/* Help Panel */}
          {showHelp && (
            <Card className="mb-4 p-4 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Play</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-medium mb-2">Basic Functions:</h4>
                  <ul className="space-y-1">
                    <li>• <code>getPiece(square)</code> - Get piece at square</li>
                    <li>• <code>getLegalMoves(square)</code> - Get legal moves</li>
                    <li>• <code>log(message)</code> - Console logging</li>
                    <li>• <code>evaluatePosition()</code> - Position score</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Return Format:</h4>
                  <pre className="bg-blue-100 p-2 rounded text-xs">
{`{
  from: "e2",
  to: "e4",
  piece: "pawn",
  promotion: "queen" // optional
}`}
                  </pre>
                </div>
              </div>
              {variant === 'programming_unboxed' && (
                <div className="mt-4 p-3 bg-purple-100 rounded border-l-4 border-purple-500">
                  <h4 className="font-medium text-purple-900">Unboxed Mode:</h4>
                  <p className="text-sm text-purple-800">
                    Use <code>getWraparoundMoves()</code> for special edge-wrapping moves!
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor */}
          <div className="space-y-4">
            <Card>
              <div className="h-96">
                <CodeEditor
                  code={userCode}
                  onChange={setUserCode}
                  onExecute={executeCode}
                  executionResult={executionResult}
                  isExecuting={isExecuting}
                  debugMode={debugMode}
                  onDebugModeChange={setDebugMode}
                  variant={variant === 'programming_unboxed' ? 'unboxed' : 'classic'}
                />
              </div>
            </Card>

            {/* Execution Controls */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={executeCode}
                    disabled={isExecuting || !userCode.trim()}
                    className="flex items-center"
                  >
                    <Play size={16} className="mr-1" />
                    {isExecuting ? 'Executing...' : 'Run Code'}
                  </Button>
                  
                  {pendingMove && (
                    <div className="text-sm text-green-600 font-medium">
                      Move ready: {pendingMove.from} → {pendingMove.to}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Turn: {currentPlayer === 'white' ? 'White' : 'Black'}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Chess Board */}
          <div>
            <ProgrammingChessBoard
              chessEngine={programmingEngine.getChessEngine()}
              variant={variant}
              currentPlayer={currentPlayer}
              isExecuting={isExecuting}
              lastExecutionResult={executionResult}
              pendingMove={pendingMove}
              onMoveExecuted={handleMoveExecuted}
              onReset={handleReset}
              debugMode={debugMode}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Write JavaScript functions to control your chess pieces. 
            {variant === 'programming_unboxed' && ' In Unboxed mode, pieces can wrap around board edges!'}
          </p>
        </div>
      </div>
    </div>
  );
}