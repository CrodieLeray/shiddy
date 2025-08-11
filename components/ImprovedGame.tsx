"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../app/shiddy.module.css';

// Constants for game configuration
const GRAVITY = 0.8;  // Increased gravity for better feel
const JUMP_FORCE = -15; // More powerful jump
const GAME_SPEED = 5;
const OBSTACLE_SPAWN_RATE = 0.01; // Lower number = less frequent
const OBSTACLE_SPEED = 5;
const CHARACTER_WIDTH = 60;
const CHARACTER_HEIGHT = 80;
const OBSTACLE_WIDTH = 24;
const OBSTACLE_HEIGHT = 48;

// Debug mode - set to true to see hitboxes
const DEBUG_MODE = false;

interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
}

interface GameState {
  isGameOver: boolean;
  isJumping: boolean;
  velocity: number;
  y: number;
  score: number;
  obstacles: Obstacle[];
  lastTime: number;
  gameAreaWidth: number;
}

export default function ImprovedGame() {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const [gameState, setGameState] = useState<GameState>({
    isGameOver: false,
    isJumping: false,
    velocity: 0,
    y: 0,
    score: 0,
    obstacles: [],
    lastTime: 0,
    gameAreaWidth: 800, // Default, will be updated on mount
  });

  // Initialize game area width on mount
  useEffect(() => {
    if (gameAreaRef.current) {
      setGameState(prev => ({
        ...prev,
        gameAreaWidth: gameAreaRef.current?.offsetWidth || 800
      }));
    }
  }, []);

  // Handle jump
  const jump = useCallback(() => {
    if (!gameState.isJumping && !gameState.isGameOver) {
      setGameState(prev => ({
        ...prev,
        velocity: JUMP_FORCE,
        isJumping: true,
        y: prev.y - 1 // Small nudge up to ensure jump starts
      }));
    }
  }, [gameState.isJumping, gameState.isGameOver]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      } else if (e.code === 'KeyR' && gameState.isGameOver) {
        // Restart game on 'R' key when game is over
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, gameState.isGameOver]);

  // Handle touch input for mobile
  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    jump();
  }, [jump]);

  // Reset game state
  const resetGame = useCallback(() => {
    setGameState({
      isGameOver: false,
      isJumping: false,
      velocity: 0,
      y: 0,
      score: 0,
      obstacles: [],
      lastTime: performance.now(),
      gameAreaWidth: gameState.gameAreaWidth,
    });
  }, [gameState.gameAreaWidth]);

  // Main game loop
  useEffect(() => {
    if (gameState.isGameOver) return;

    let lastTime = performance.now();
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 16; // Normalize to ~60fps
      lastTime = currentTime;

      setGameState(prevState => {
        if (prevState.isGameOver) return prevState;

        // Update character position (Y=0 is ground level, negative Y is up)
        let { velocity, y, isJumping, score, obstacles } = prevState;
        const newVelocity = velocity + GRAVITY;
        let newY = y + newVelocity;
        
        // Ground collision (can't go below ground level)
        if (newY > 0) {
          newY = 0;
          isJumping = false;
        }

        // Update obstacles
        const newObstacles = obstacles
          .map(obs => ({
            ...obs,
            x: obs.x - OBSTACLE_SPEED * deltaTime
          }))
          .filter(obs => obs.x > -obs.width);

        // Spawn new obstacles
        if (Math.random() < OBSTACLE_SPAWN_RATE) {
          newObstacles.push({
            id: Date.now(),
            x: prevState.gameAreaWidth,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT
          });
        }

        // Update score
        const newScore = score + 1;
        
        // Increase difficulty as score increases
        const currentSpeed = GAME_SPEED + Math.floor(newScore / 1000);

        // Collision detection (Y=0 is ground level, negative Y is up)
        const characterRect = {
          x: 16,
          y: -newY, // Invert Y since negative is up in screen coordinates
          width: CHARACTER_WIDTH,
          height: CHARACTER_HEIGHT
        };

        const hasCollision = newObstacles.some(obstacle => {
          const obstacleRect = {
            x: obstacle.x,
            y: 0, // Ground level
            width: obstacle.width,
            height: obstacle.height
          };

          return (
            characterRect.x < obstacleRect.x + obstacleRect.width &&
            characterRect.x + characterRect.width > obstacleRect.x &&
            characterRect.y < obstacleRect.y + obstacleRect.height &&
            characterRect.y + characterRect.height > obstacleRect.y
          );
        });

        return {
          ...prevState,
          velocity: newVelocity,
          y: newY,
          isJumping,
          score: newScore,
          obstacles: newObstacles,
          isGameOver: hasCollision,
          lastTime: currentTime
        };
      });

      if (!gameState.isGameOver) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isGameOver, gameState.gameAreaWidth]);

  // Calculate character position (Y=0 is ground level, negative Y is up)
  const characterStyle = {
    transform: `translateY(${gameState.y}px)`,
    transition: gameState.isJumping ? 'none' : 'transform 0.1s ease-out'
  };

  // Debug hitboxes
  const renderDebugHitbox = (rect: { x: number; y: number; width: number; height: number }, color: string) => {
    if (!DEBUG_MODE) return null;
    
    return (
      <div 
        className="absolute border-2"
        style={{
          left: `${rect.x}px`,
          bottom: `${rect.y}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          borderColor: color,
          backgroundColor: `${color}33`, // Add some transparency
          pointerEvents: 'none',
          zIndex: 100
        }}
      />
    );
  };

  return (
    <div
      ref={gameAreaRef}
      className={`${styles.gameArea} relative bg-white p-4 w-full max-w-3xl h-64 mt-8 flex items-center justify-center overflow-hidden`}
      tabIndex={0}
      onTouchStart={handleTouch}
    >
      {/* Score */}
      <div className="absolute top-2 right-4 text-2xl font-bold z-10">
        Score: {Math.floor(gameState.score)}
      </div>

      {/* Game Over Overlay */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-20">
          <h2 className="text-5xl text-white font-bold mb-4">Game Over</h2>
          <p className="text-2xl text-white mb-6">Score: {Math.floor(gameState.score)}</p>
          <button 
            onClick={resetGame}
            className={`${styles.scribbleButton} text-xl`}
          >
            Play Again
          </button>
          <p className="text-white mt-4 text-sm">(Press R or tap to restart)</p>
        </div>
      )}

      {/* Character */}
      <div 
        className="absolute left-4 bottom-4 transition-transform duration-100 ease-linear"
        style={characterStyle}
      >
        <img 
          src="/shiddy.gif" 
          alt="Shiddy character" 
          className="h-20 w-auto"
        />
        {DEBUG_MODE && renderDebugHitbox(
          { x: 16, y: 16, width: CHARACTER_WIDTH, height: CHARACTER_HEIGHT },
          'red'
        )}
      </div>

      {/* Obstacles */}
      {gameState.obstacles.map(obstacle => (
        <div
          key={obstacle.id}
          className="absolute bottom-4 bg-red-500"
          style={{
            left: `${obstacle.x}px`,
            width: `${obstacle.width}px`,
            height: `${obstacle.height}px`
          }}
        >
          {DEBUG_MODE && renderDebugHitbox(
            { x: 0, y: 0, width: obstacle.width, height: obstacle.height },
            'blue'
          )}
        </div>
      ))}

      {/* Ground */}
      <div className="absolute bottom-4 left-0 right-0 h-1 bg-gray-400" />
      
      {/* Debug info */}
      {DEBUG_MODE && (
        <div className="absolute top-2 left-2 text-xs bg-black text-white p-1 z-10">
          Y: {gameState.y.toFixed(1)}<br />
          V: {gameState.velocity.toFixed(1)}<br />
          Obstacles: {gameState.obstacles.length}
        </div>
      )}
    </div>
  );
}
