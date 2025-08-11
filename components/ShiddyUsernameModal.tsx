"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shuffle } from 'lucide-react';

interface ShiddyUsernameModalProps {
  isOpen: boolean;
  currentUsername: string;
  onUsernameSet: (username: string) => void;
}

const shiddyNames = [
  "ShiddyArtist", "PixelShiddy", "DoodleShiddy", "CanvasShiddy", "SketchShiddy",
  "ShiddyChaos", "DrawShiddy", "PaintShiddy", "ArtShiddy", "ShiddySquad",
  "BrushShiddy", "PixelPunk", "ShiddyDude", "PaintPal", "SketchStar"
];

export default function ShiddyUsernameModal({ isOpen, currentUsername, onUsernameSet }: ShiddyUsernameModalProps) {
  const [username, setUsername] = useState(currentUsername);

  useEffect(() => {
    setUsername(currentUsername);
  }, [currentUsername]);

  const generateUsername = () => {
    const name = shiddyNames[Math.floor(Math.random() * shiddyNames.length)];
    const num = Math.floor(Math.random() * 999) + 1;
    setUsername(`${name}${num}`);
  };

  const handleSubmit = () => {
    if (username.trim().length >= 3) {
      onUsernameSet(username.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg border-4 border-red-600 p-6 w-80 shadow-2xl">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Join ShiddyChat</h2>
          <p className="text-sm text-gray-600">Choose your username</p>
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              maxLength={20}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={generateUsername}
              className="px-3"
            >
              <Shuffle className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={username.trim().length < 3}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Enter Chat
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            3-20 characters required
          </p>
        </div>
      </div>
    </div>
  );
}
