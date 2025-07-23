import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Question } from './types';
import { QUESTIONS_PER_LEVEL, TOTAL_LEVELS, SILLY_JOKES } from './constants';
import { generateMathsQuestions } from './services/geminiService';
import WelcomeScreen from './components/WelcomeScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Welcome);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joke, setJoke] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
      const savedLevel = localStorage.getItem('mathsHarryCurrentLevel');
      return savedLevel ? parseInt(savedLevel, 10) : 1;
  });

  useEffect(() => {
    localStorage.setItem('mathsHarryCurrentLevel', currentLevel.toString());
  }, [currentLevel]);

  const fetchQuestionsForLevel = useCallback(async (level: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const newQuestions = await generateMathsQuestions(level);
      if (newQuestions.length === 0) {
        throw new Error("Failed to generate questions. Please try again.");
      }
      setQuestions(newQuestions);
      setScore(0);
      setJoke(null);
      setCurrentQuestionIndex(0);
      setGameState(GameState.Playing);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setGameState(GameState.Welcome); // Revert to welcome screen on error
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const startGame = () => {
      fetchQuestionsForLevel(currentLevel);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
      const randomJoke = SILLY_JOKES[Math.floor(Math.random() * SILLY_JOKES.length)];
      setJoke(randomJoke);
    }
    
    const nextQuestionIndex = currentQuestionIndex + 1;
    setTimeout(() => {
      if (nextQuestionIndex < QUESTIONS_PER_LEVEL) {
        setCurrentQuestionIndex(nextQuestionIndex);
        setJoke(null);
      } else {
        setGameState(GameState.LevelEnd);
      }
    }, 5000); // Wait 5 seconds to show feedback/joke before moving on
  };
  
  const handleNextLevel = () => {
      if (currentLevel < TOTAL_LEVELS) {
          const nextLevel = currentLevel + 1;
          setCurrentLevel(nextLevel);
          fetchQuestionsForLevel(nextLevel);
      }
  };

  const handleRetryLevel = () => {
      fetchQuestionsForLevel(currentLevel);
  };
  
  const restartGame = () => {
    setCurrentLevel(1);
    setGameState(GameState.Welcome);
    setQuestions([]);
    setJoke(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loader message={`Loading Level ${currentLevel}...`}/>;
    }

    switch (gameState) {
      case GameState.Playing:
        return (
          <GameScreen
            question={questions[currentQuestionIndex]}
            onAnswer={handleAnswer}
            questionNumber={currentQuestionIndex + 1}
            score={score}
            level={currentLevel}
            joke={joke}
          />
        );
      case GameState.LevelEnd:
        return (
          <GameOverScreen 
            score={score} 
            level={currentLevel}
            onRetry={handleRetryLevel}
            onNextLevel={handleNextLevel}
            onRestartGame={restartGame}
          />
        );
      case GameState.Welcome:
      default:
        return <WelcomeScreen onStart={startGame} error={error} level={currentLevel} />;
    }
  };

  return (
    <div className="min-h-screen bg-sky-400 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;