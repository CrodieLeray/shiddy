"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Shuffle, Check } from 'lucide-react';

interface UsernameModalProps {
  isOpen: boolean;
  currentUsername: string;
  onUsernameSet: (username: string) => void;
}

const funUsernames = [
  "ShiddyArtist", "PixelPainter", "DoodleMaster", "CanvasKing", "SketchyVibes",
  "ColorChaos", "DrawDragon", "PaintPanda", "ArtAttack", "SkribbleSquad",
  "BrushBoss", "PixelPunk", "DoodleDude", "PaintPal", "SketchStar",
  "ColorCrafter", "ArtAddict", "DrawDream", "PaintPro", "CanvasCrazy"
];

export default function UsernameModal({ isOpen, currentUsername, onUsernameSet }: UsernameModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    setUsername(currentUsername);
  }, [currentUsername]);

  const generateRandomUsername = () => {
    const randomName = funUsernames[Math.floor(Math.random() * funUsernames.length)];
    const randomNum = Math.floor(Math.random() * 999) + 1;
    const generatedName = `${randomName}${randomNum}`;
    setUsername(generatedName);
    setIsCustom(false);
  };

  const handleSubmit = () => {
    if (username.trim().length >= 3) {
      onUsernameSet(username.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Username</h2>
          <p className="text-gray-600 text-sm">
            Pick a name for the global PictoChat! You can change it anytime.
          </p>
        </div>

        <div className="space-y-4">
          {/* Username Input */}
          <div>
            <Input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setIsCustom(true);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter your username..."
              className="text-center text-lg font-bold"
              maxLength={20}
            />
            <div className="text-xs text-gray-500 mt-1 text-center">
              {username.length}/20 characters (minimum 3)
            </div>
          </div>

          {/* Random Generator */}
          <Button
            onClick={generateRandomUsername}
            variant="outline"
            className="w-full"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Generate Random Name
          </Button>

          {/* Quick Suggestions */}
          <div className="grid grid-cols-2 gap-2">
            {funUsernames.slice(0, 4).map((name, index) => (
              <Button
                key={index}
                onClick={() => {
                  setUsername(`${name}${Math.floor(Math.random() * 99) + 1}`);
                  setIsCustom(false);
                }}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                {name}
              </Button>
            ))}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={username.trim().length < 3}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3"
          >
            <Check className="w-4 h-4 mr-2" />
            Enter PictoChat
          </Button>
        </div>
      </div>
    </div>
  );
}
