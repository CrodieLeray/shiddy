"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Eraser, 
  Brush, 
  Trash2, 
  Users,
  Palette,
  MessageSquare,
  RefreshCw,
  Loader2
} from 'lucide-react';
import styles from '../app/shiddy.module.css';
import { useToast } from "@/components/ui/use-toast";
import { usePictoChat } from "@/hooks/usePictoChat";
import UsernameModal from "@/components/UsernameModal";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface PictoChatDatabaseProps {
  roomName?: string;
}

export default function PictoChatDatabase({ 
  roomName = "Global Shiddy Board"
}: PictoChatDatabaseProps) {
  
  // Database hook
  const {
    sessionId,
    username,
    userColor,
    messages,
    isLoading,
    activeUsers,
    error,
    setUserProfile,
    sendMessage,
    loadMessages,
    hasUsername,
    isReady
  } = usePictoChat(roomName);

  // Local drawing state
  const [currentStrokes, setCurrentStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000080'); // DS blue
  const [brushSize, setBrushSize] = useState(3);
  const [textInput, setTextInput] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // DS Color palette
  const dsColors = [
    '#000080', '#FF0000', '#00FF00', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#000000', '#FFFFFF',
    '#800000', '#008000', '#000080', '#808000',
    '#800080', '#008080', '#808080', '#C0C0C0'
  ];

  // Show username modal if no username set
  useEffect(() => {
    if (isReady && !hasUsername) {
      setShowUsernameModal(true);
    }
  }, [isReady, hasUsername]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      // Set canvas size to match the display size exactly
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Clear with DS green tint
      ctx.fillStyle = '#E8F4E8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      redrawCanvas();
    };
    
    // Initial resize
    resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas with background
    ctx.fillStyle = '#E8F4E8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all strokes
    currentStrokes.forEach(stroke => {
      if (stroke.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.slice(1).forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        
        ctx.stroke();
      }
    });
  }, [currentStrokes]);

  // Helper function for coordinate calculation
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    // Handle touch events
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return { x: 0, y: 0 };
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Handle mouse events
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    e.preventDefault(); // Prevent scrolling on touch
    setIsDrawing(true);
    setIsMouseDown(true);
    
    const point = getCanvasCoordinates(e);
    
    setCurrentStroke({
      points: [point],
      color: tool === 'eraser' ? '#E8F4E8' : color,
      width: brushSize
    });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke || !canvasRef.current) return;
    
    e.preventDefault(); // Prevent scrolling on touch
    const point = getCanvasCoordinates(e);
    
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point]
    };
    
    setCurrentStroke(updatedStroke);
    
    // Draw line immediately
    const ctx = canvasRef.current.getContext('2d');
    if (ctx && currentStroke.points.length > 0) {
      const lastPoint = currentStroke.points[currentStroke.points.length - 1];
      
      ctx.beginPath();
      ctx.strokeStyle = updatedStroke.color;
      ctx.lineWidth = updatedStroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const endDrawing = () => {
    if (!isDrawing || !currentStroke) return;
    
    if (currentStroke.points.length > 1) {
      setCurrentStrokes(prev => [...prev, currentStroke]);
    }
    
    setIsDrawing(false);
    setIsMouseDown(false);
    setCurrentStroke(null);
  };

  const clearCanvas = () => {
    setCurrentStrokes([]);
    redrawCanvas();
  };

  const handleSendMessage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const hasDrawing = currentStrokes.length > 0;
    const hasText = textInput.trim().length > 0;
    
    if (!hasDrawing && !hasText) {
      toast({
        title: "Empty message",
        description: "Draw something or type a message first!",
        variant: "destructive"
      });
      return;
    }
    
    // Convert canvas to base64
    const drawingData = hasDrawing ? canvas.toDataURL() : undefined;
    const messageText = hasText ? textInput : undefined;
    
    const success = await sendMessage(messageText, drawingData);
    
    if (success) {
      setTextInput('');
      setCurrentStrokes([]);
      redrawCanvas();
      
      // Auto-scroll to bottom
      setTimeout(() => {
        messagesRef.current?.scrollTo({
          top: messagesRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
      
      toast({
        title: "Message sent!",
        description: "Your PictoChat message was delivered.",
      });
    } else {
      toast({
        title: "Send failed",
        description: error || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUsernameSet = async (newUsername: string) => {
    const success = await setUserProfile(newUsername, color);
    if (success) {
      setShowUsernameModal(false);
      toast({
        title: "Username set!",
        description: `Welcome to the room, ${newUsername}!`,
      });
    } else {
      toast({
        title: "Username failed",
        description: error || "Failed to set username. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDown) {
        endDrawing();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isMouseDown]);

  // Redraw when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  if (!isReady) {
    return (
      <div className="w-full max-w-[800px] h-[600px] bg-gray-800 flex items-center justify-center border-4 border-red-600 rounded-lg">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Initializing PictoChat...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <UsernameModal 
        isOpen={showUsernameModal}
        currentUsername={username}
        onUsernameSet={handleUsernameSet}
      />
      
      <div 
        className="w-full max-w-[800px] h-[500px] sm:h-[600px] bg-gray-800 flex flex-col sm:flex-row border-4 border-red-600 rounded-lg shadow-2xl relative mx-4"
      >
        {/* Left Panel - Messages */}
        <div className="flex-1 flex flex-col bg-gray-900 rounded-l-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 text-white p-2 sm:p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold text-sm sm:text-base truncate">
                {roomName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{activeUsers}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMessages}
                disabled={isLoading}
                className="h-6 w-6 p-0 hover:bg-red-700"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={messagesRef}
            className="flex-1 overflow-y-auto p-2 sm:p-3 bg-green-100 space-y-2"
          >
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                Error: {error}
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-0"
                    style={{ backgroundColor: message.user_color, color: 'white' }}
                  >
                    {message.username}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
                
                {message.message_text && (
                  <p className="text-sm text-gray-800 mb-2">{message.message_text}</p>
                )}
                
                {message.drawing_data && (
                  <img 
                    src={message.drawing_data} 
                    alt="Drawing" 
                    className="max-w-full h-auto rounded border bg-green-50"
                    style={{ maxHeight: '200px' }}
                  />
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-2 sm:p-3 bg-gray-800 border-t border-gray-700">
            <div className="flex gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white text-black text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={isLoading || (!textInput.trim() && currentStrokes.length === 0)}
                className="bg-red-600 hover:bg-red-700 h-9 px-3"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Drawing Canvas */}
        <div className="w-full sm:w-64 lg:w-80 bg-green-200 flex flex-col">
          {/* Drawing Controls */}
          <div className="p-2 bg-green-300 space-y-2">
            {/* Tool Selection */}
            <div className="flex gap-1">
              <Button
                variant={tool === 'pen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('pen')}
                className="flex-1 h-8 text-xs"
              >
                <Brush className="w-3 h-3 mr-1" />
                Pen
              </Button>
              <Button
                variant={tool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('eraser')}
                className="flex-1 h-8 text-xs"
              >
                <Eraser className="w-3 h-3 mr-1" />
                Eraser
              </Button>
            </div>

            {/* Color Palette */}
            <div className="grid grid-cols-8 gap-1">
              {dsColors.map((dsColor) => (
                <button
                  key={dsColor}
                  className={`w-6 h-6 rounded border-2 ${color === dsColor ? 'border-black' : 'border-gray-400'}`}
                  style={{ backgroundColor: dsColor }}
                  onClick={() => setColor(dsColor)}
                />
              ))}
            </div>

            {/* Brush Size */}
            <div className="flex items-center gap-2">
              <span className="text-xs">Size:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-6">{brushSize}</span>
            </div>

            {/* Clear Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              className="w-full h-8 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>

          {/* Canvas */}
          <div className="flex-1 p-2 bg-green-200">
            <canvas
              ref={canvasRef}
              className="w-full h-full bg-green-50 border-2 border-gray-400 rounded cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
              onTouchCancel={endDrawing}
              style={{
                touchAction: 'none',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
