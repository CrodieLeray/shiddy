"use client"

import React, { useState, useEffect } from 'react';
import styles from '../app/shiddy.module.css';
import Obstacle from './Obstacle';

export default function Game() {
    const [isJumping, setIsJumping] = useState(false);
    const [obstacles, setObstacles] = useState<{ id: number; position: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const gameAreaRef = React.useRef<HTMLDivElement>(null);

  const handleJump = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !isJumping) {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 500); // Jump duration
    }
  };

    useEffect(() => {
    if (gameOver) return;
    window.addEventListener('keydown', handleJump);
        const gameLoop = setInterval(() => {
      // Move obstacles
      setObstacles(prevObstacles => 
        prevObstacles.map(obs => ({ ...obs, position: obs.position + 5 }))
                     .filter(obs => obs.position < (gameAreaRef.current?.offsetWidth || 800)) // Remove off-screen obstacles
      );

      // Spawn new obstacles
            if (Math.random() < 0.02) { // Adjust spawn rate
        setObstacles(prevObstacles => [...prevObstacles, { id: Date.now(), position: -24 }]);
      }

      // Collision detection
      const characterRect = {
        x: 16,
        y: isJumping ? 96 : 16,
        width: 60, // Approximate width of the character
        height: 80
      };

      obstacles.forEach(obstacle => {
        const obstacleRect = {
          x: (gameAreaRef.current?.offsetWidth || 0) - obstacle.position - 24,
          y: 16,
          width: 24,
          height: 48
        };

        if (
          characterRect.x < obstacleRect.x + obstacleRect.width &&
          characterRect.x + characterRect.width > obstacleRect.x &&
          characterRect.y < obstacleRect.y + obstacleRect.height &&
          characterRect.y + characterRect.height > obstacleRect.y
        ) {
          setGameOver(true);
        }
      });

      setScore(prev => prev + 1);
    }, 16); // ~60 FPS

    window.addEventListener('keydown', handleJump);
    return () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleJump);
    };
    }, [isJumping, gameOver, obstacles]);

  return (
    <div
      ref={gameAreaRef}
      id="game-root"
      className={`${styles.gameArea} relative bg-white p-4 w-full max-w-3xl h-64 mt-8 flex items-center justify-center overflow-hidden`}
      tabIndex={0} // Make div focusable to receive key events
    >
      <div className="absolute top-2 right-4 text-2xl font-bold z-10">Score: {score}</div>
      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-20">
          <h2 className="text-5xl text-white font-bold mb-4">Game Over</h2>
          <button 
            onClick={() => {
              setGameOver(false);
              setScore(0);
              setObstacles([]);
            }}
            className={`${styles.scribbleButton} text-xl`}
          >
            Restart
          </button>
        </div>
      )}
      <img 
        src="/shiddy.gif" 
        alt="Shiddy character" 
        className={`h-20 absolute left-4 transition-all duration-500 ease-out ${isJumping ? 'bottom-24' : 'bottom-4'}`}
      />
      {obstacles.map(obstacle => (
        <Obstacle key={obstacle.id} position={obstacle.position} />
      ))}
      <div className="absolute bottom-4 left-0 right-0 h-1 bg-gray-400" />
    </div>
  );
}
