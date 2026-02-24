/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Trophy, RefreshCw, Info, ChevronRight, AlertCircle } from 'lucide-react';

// --- Constants & Types ---

const GRID_SIZE = 5;
const INITIAL_TIME = 30;
const TIME_BONUS = 2;
const INITIAL_DIFF = 40; // Max difference in RGB values
const MIN_DIFF = 3; // Minimum difference for extreme levels

type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

interface Color {
  r: number;
  g: number;
  b: number;
}

// --- Helper Functions ---

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateColors = (level: number) => {
  const base: Color = {
    r: getRandomInt(30, 225),
    g: getRandomInt(30, 225),
    b: getRandomInt(30, 225),
  };

  // Difficulty scaling: difference decreases as level increases
  // Level 1: 40, Level 50: ~5
  const diff = Math.max(MIN_DIFF, INITIAL_DIFF - Math.floor(level / 1.5));
  
  // Randomly choose which channel to vary and in which direction
  const channel = (['r', 'g', 'b'] as const)[getRandomInt(0, 2)];
  const direction = base[channel] > 128 ? -1 : 1;
  
  const target: Color = { ...base };
  target[channel] += diff * direction;

  return { base, target, diff, channel };
};

const colorToCSS = (c: Color) => `rgb(${c.r}, ${c.g}, ${c.b})`;

// --- Components ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [colors, setColors] = useState(generateColors(1));
  const [targetIndex, setTargetIndex] = useState(getRandomInt(0, GRID_SIZE * GRID_SIZE - 1));
  const [lastDiffInfo, setLastDiffInfo] = useState<{ base: Color; target: Color; diff: number; channel: string } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setTimeLeft(INITIAL_TIME);
    const newColors = generateColors(1);
    setColors(newColors);
    setTargetIndex(getRandomInt(0, GRID_SIZE * GRID_SIZE - 1));
    setGameState('PLAYING');
  };

  const handleBlockClick = (index: number) => {
    if (gameState !== 'PLAYING') return;

    if (index === targetIndex) {
      // Correct!
      setScore(s => s + 1);
      setLevel(l => l + 1);
      setTimeLeft(t => Math.min(INITIAL_TIME, t + TIME_BONUS));
      
      const nextColors = generateColors(level + 1);
      setColors(nextColors);
      setTargetIndex(getRandomInt(0, GRID_SIZE * GRID_SIZE - 1));
    } else {
      // Wrong!
      setTimeLeft(t => Math.max(0, t - 5));
    }
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 0) {
            setGameState('GAMEOVER');
            return 0;
          }
          return t - 0.1;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (timeLeft <= 0 && gameState === 'PLAYING') {
      setGameState('GAMEOVER');
      setLastDiffInfo(colors);
    }
  }, [timeLeft, gameState, colors]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      {/* Header Section */}
      <header className="w-full max-w-md mb-8 flex flex-col items-center">
        <h1 className="font-serif italic text-4xl md:text-5xl mb-2 tracking-tight">Chroma Vision</h1>
        <p className="text-xs font-mono uppercase tracking-widest opacity-50 mb-6">Artistic Sensitivity Challenge</p>
        
        <div className="w-full grid grid-cols-3 gap-4 border-y border-[#141414]/10 py-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono uppercase opacity-50">Level</span>
            <span className="text-xl font-bold">{level}</span>
          </div>
          <div className="flex flex-col items-center border-x border-[#141414]/10">
            <span className="text-[10px] font-mono uppercase opacity-50">Score</span>
            <span className="text-xl font-bold">{score}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono uppercase opacity-50">Time</span>
            <span className={`text-xl font-bold font-mono ${timeLeft < 5 ? 'text-red-500' : ''}`}>
              {timeLeft.toFixed(1)}s
            </span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="w-full max-w-md relative">
        <AnimatePresence mode="wait">
          {gameState === 'START' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-3xl shadow-xl border border-[#141414]/5 text-center"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info className="text-emerald-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Ready to test your eyes?</h2>
              <p className="text-sm text-[#141414]/60 mb-8 leading-relaxed">
                Find the block with the slightly different color. The difference becomes subtler as you progress.
              </p>
              <button 
                onClick={startGame}
                className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold hover:bg-[#141414]/90 transition-colors flex items-center justify-center gap-2 group"
              >
                Start Challenge
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {gameState === 'PLAYING' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid-container w-full grid grid-cols-5 gap-2 md:gap-3"
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                <motion.button
                  key={`${level}-${i}`}
                  whileHover={{ scale: 0.98 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleBlockClick(i)}
                  className="w-full h-full rounded-lg md:rounded-xl shadow-sm cursor-pointer"
                  style={{ 
                    backgroundColor: i === targetIndex ? colorToCSS(colors.target) : colorToCSS(colors.base) 
                  }}
                />
              ))}
            </motion.div>
          )}

          {gameState === 'GAMEOVER' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-3xl shadow-2xl border border-[#141414]/5 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-amber-500" size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Challenge Over</h2>
              <p className="text-sm font-mono uppercase tracking-widest opacity-50 mb-8">Final Score: {score}</p>
              
              <div className="bg-[#F5F5F0] rounded-2xl p-6 mb-8 text-left">
                <h3 className="text-xs font-mono uppercase opacity-50 mb-4 flex items-center gap-2">
                  <AlertCircle size={14} /> Last Level Analysis
                </h3>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="h-12 w-full rounded-lg mb-2" style={{ backgroundColor: colorToCSS(lastDiffInfo?.base || {r:0,g:0,b:0}) }} />
                    <span className="text-[10px] font-mono opacity-50">Base Color</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-px w-8 bg-[#141414]/20 mb-1" />
                    <span className="text-[10px] font-mono font-bold">Δ {lastDiffInfo?.diff}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-12 w-full rounded-lg mb-2 border-2 border-emerald-500" style={{ backgroundColor: colorToCSS(lastDiffInfo?.target || {r:0,g:0,b:0}) }} />
                    <span className="text-[10px] font-mono opacity-50">Target (Diff in {lastDiffInfo?.channel.toUpperCase()})</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={startGame}
                className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold hover:bg-[#141414]/90 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="mt-12 max-w-md text-center">
        <p className="text-[10px] text-[#141414]/40 leading-relaxed">
          Designed for chromatic precision. <br />
          Higher levels require calibrated displays and focused perception.
        </p>
      </footer>
    </div>
  );
}
