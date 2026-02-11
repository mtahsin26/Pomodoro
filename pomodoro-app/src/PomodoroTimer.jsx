import React, { useState, useEffect, useRef } from 'react';

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(25);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const activeNodesRef = useRef([]);

  const stopRinging = () => {
    setIsRinging(false);
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    activeNodesRef.current.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    });
    activeNodesRef.current = [];
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startRinging = () => {
    setIsRinging(true);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = ctx;

    const playBell = () => {
      const frequencies = [880, 1108, 1320];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + 1);
        activeNodesRef.current.push({ osc, gain });
      });
    };

    playBell();
    ringIntervalRef.current = setInterval(playBell, 1500);
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds === 0) {
            setMinutes((prevMinutes) => {
              if (prevMinutes === 0) {
                setIsRunning(false);
                startRinging();
                return 0;
              }
              return prevMinutes - 1;
            });
            return prevSeconds === 0 && minutes === 0 ? 0 : 59;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    return () => {
      stopRinging();
    };
  }, []);

  const handleSetTime = () => {
    const newMinutes = Math.min(Math.max(1, inputMinutes), 30);
    setMinutes(newMinutes);
    setSeconds(0);
    setIsRunning(false);
    stopRinging();
  };

  const handleToggle = () => {
    if (isRinging) return;
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setMinutes(inputMinutes);
    setSeconds(0);
    stopRinging();
  };

  const formatTime = (mins, secs) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-8">
        {/* Tomato with Timer */}
        <div className="relative">
          {/* Tomato SVG */}
          <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-xl">
            {/* Stem */}
            <path
              d="M140 30 Q140 50 130 70"
              fill="none"
              stroke="#4a7c2e"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M160 30 Q160 50 170 70"
              fill="none"
              stroke="#4a7c2e"
              strokeWidth="8"
              strokeLinecap="round"
            />
            
            {/* Leaves */}
            <ellipse
              cx="120"
              cy="60"
              rx="25"
              ry="15"
              fill="#5a9c3a"
              transform="rotate(-30 120 60)"
            />
            <ellipse
              cx="180"
              cy="60"
              rx="25"
              ry="15"
              fill="#5a9c3a"
              transform="rotate(30 180 60)"
            />
            
            {/* Tomato body */}
            <circle
              cx="150"
              cy="170"
              r="120"
              fill="#e74c3c"
              className={isRinging ? 'animate-pulse' : ''}
            />
            
            {/* Highlight for depth */}
            <ellipse
              cx="120"
              cy="140"
              rx="40"
              ry="50"
              fill="#ff6b6b"
              opacity="0.6"
            />
          </svg>

          {/* Timer Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <div className="text-6xl font-bold text-white drop-shadow-lg font-mono">
              {formatTime(minutes, seconds)}
            </div>
            {isRinging && (
              <div className="text-white text-sm font-semibold mt-2 animate-bounce">
                🔔 Time's up!
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          {/* Time Input */}
          <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-md w-full">
            <label className="text-gray-700 font-medium whitespace-nowrap">
              Set Time:
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={inputMinutes}
              onChange={(e) => setInputMinutes(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <span className="text-gray-600">min</span>
            <button
              onClick={handleSetTime}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Set
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full">
            <button
              onClick={handleToggle}
              disabled={isRinging}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all shadow-md ${
                isRinging
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isRunning
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={handleReset}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all shadow-md ${
                isRinging
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
