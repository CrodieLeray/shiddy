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
  Loader2,
  Undo2
} from 'lucide-react';
import styles from '../app/shiddy.module.css';
import { useToast } from "@/components/ui/use-toast";
import { useShiddyChat } from "@/hooks/useShiddyChat";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface ShiddyChatProps {
  roomName?: string;
}

export default function ShiddyChat({ 
  roomName = "Global Shiddy Board"
}: ShiddyChatProps) {
  
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
  } = useShiddyChat(roomName);

  // Local drawing state
  const [currentStrokes, setCurrentStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000080');
  const [brushSize, setBrushSize] = useState(3);
  const [textInput, setTextInput] = useState('');
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [showBrushPreview, setShowBrushPreview] = useState(false);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Shiddy Color palette
  const shiddyColors = [
    '#000080', '#FF0000', '#00FF00', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#000000', '#FFFFFF',
    '#800000', '#008000', '#0000FF', '#808000',
    '#800080', '#008080', '#808080', '#C0C0C0'
  ];

  // Helper functions for proper canvas coordinate handling
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    // Handle touch events
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Handle mouse events
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // The canvas is scaled by devicePixelRatio, so we need to adjust the coordinates
    const scaleX = canvas.width / (rect.width * (window.devicePixelRatio || 1));
    const scaleY = canvas.height / (rect.height * (window.devicePixelRatio || 1));
    
    // We also need to multiply by devicePixelRatio to get the correct coordinates on the scaled canvas
    const x = (clientX - rect.left) * scaleX * (window.devicePixelRatio || 1);
    const y = (clientY - rect.top) * scaleY * (window.devicePixelRatio || 1);
    
    return { x, y };
  };

  const drawBrushPreview = (ctx: CanvasRenderingContext2D, point: Point) => {
    ctx.save();
    ctx.strokeStyle = tool === 'eraser' ? '#ff0000' : color;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(point.x, point.y, brushSize / 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  };

  // No need for username modal - auto-generated!

  // Initialize canvas with proper DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;
    
    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!ctx || !overlayCtx) return;
    
    const resizeCanvas = () => {
      // Force a small delay to ensure layout has settled
      setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual size in memory (scaled for high DPI) for both canvases
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        overlayCanvas.width = rect.width * dpr;
        overlayCanvas.height = rect.height * dpr;
        
        // Scale both canvases back down using CSS
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        overlayCanvas.style.width = rect.width + 'px';
        overlayCanvas.style.height = rect.height + 'px';
        
        // Scale the drawing contexts so everything draws at the correct size
        ctx.scale(dpr, dpr);
        overlayCtx.scale(dpr, dpr);
        
        // Clear with light green background
        ctx.fillStyle = '#E8F4E8';
        ctx.fillRect(0, 0, rect.width, rect.height);
        
        redrawCanvas();
      }, 10);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Force resize on mount and when layout might change
    const handleLayoutChange = () => resizeCanvas();
    window.addEventListener('orientationchange', handleLayoutChange);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', handleLayoutChange);
    };
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Clear canvas
    ctx.fillStyle = '#E8F4E8';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
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

  // Force canvas resize when switching between mobile/desktop layouts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleMediaChange = () => {
      // Delay to ensure the layout transition has completed
      setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        const ctx = canvas.getContext('2d');
        const overlayCanvas = overlayCanvasRef.current;
        const overlayCtx = overlayCanvas?.getContext('2d');
        
        if (ctx && overlayCanvas && overlayCtx) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          overlayCanvas.width = rect.width * dpr;
          overlayCanvas.height = rect.height * dpr;
          
          canvas.style.width = rect.width + 'px';
          canvas.style.height = rect.height + 'px';
          overlayCanvas.style.width = rect.width + 'px';
          overlayCanvas.style.height = rect.height + 'px';
          
          ctx.scale(dpr, dpr);
          overlayCtx.scale(dpr, dpr);
          
          ctx.fillStyle = '#E8F4E8';
          ctx.fillRect(0, 0, rect.width, rect.height);
          
          redrawCanvas();
        }
      }, 100);
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [redrawCanvas]);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    e.preventDefault(); // Prevent scrolling on touch
    setIsDrawing(true);
    setIsMouseDown(true);
    setShowBrushPreview(false);
    
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
      const newStrokes = [...currentStrokes, currentStroke];
      setCurrentStrokes(newStrokes);
      setHistory(prev => [...prev.slice(0, historyIndex + 1), newStrokes]);
      setHistoryIndex(prev => prev + 1);
    }
    
    setIsDrawing(false);
    setIsMouseDown(false);
    setCurrentStroke(null);
    setShowBrushPreview(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    setMousePos(point);
    
    if (isDrawing) {
      draw(e);
    } else if (showBrushPreview && 'touches' in e === false) {
      // Update brush preview (only for mouse, not touch)
      updateBrushPreview(point);
    }
  };

  const handleMouseEnter = () => {
    setShowBrushPreview(true);
  };

  const handleMouseLeave = () => {
    setShowBrushPreview(false);
    setMousePos(null);
    if (isDrawing) {
      endDrawing();
    }
  };

  const updateBrushPreview = (point: Point) => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;
    
    // Clear previous preview
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    // Draw brush preview
    drawBrushPreview(ctx, point);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentStrokes(history[newIndex]);
    } else if (historyIndex === 0) {
      // If at the first real state, undo to the initial empty state
      setHistoryIndex(-1);
      setCurrentStrokes([]);
    }
  };

  const clearCanvas = () => {
    if (currentStrokes.length > 0) {
      setHistory(prev => [...prev.slice(0, historyIndex + 1), []]);
      setHistoryIndex(prev => prev + 1);
    }
    setCurrentStrokes([]);
    redrawCanvas();
  };

  const handleSendMessage = async () => {
    if (!hasUsername) return;
    
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
    
    const drawingData = hasDrawing ? canvas.toDataURL() : undefined;
    const messageText = hasText ? textInput : undefined;
    
    const success = await sendMessage(messageText, drawingData);
    
    if (success) {
      setTextInput('');
      setCurrentStrokes([]);
      redrawCanvas();
      
      setTimeout(() => {
        messagesRef.current?.scrollTo({
          top: messagesRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
      
      toast({
        title: "Message sent!",
        description: "Your ShiddyChat message was delivered.",
      });
    } else {
      toast({
        title: "Send failed",
        description: error || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Auto-generated usernames - no manual setup needed!

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

  // Update brush preview when brush size or color changes
  useEffect(() => {
    if (showBrushPreview && mousePos) {
      updateBrushPreview(mousePos);
    }
  }, [brushSize, color, tool, showBrushPreview, mousePos]);

  if (!isReady) {
    return (
      <div className="w-full max-w-[800px] h-[600px] bg-gray-800 flex items-center justify-center border-4 border-red-600 rounded-lg">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Initializing ShiddyChat...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full max-w-sm sm:max-w-md md:max-w-4xl h-[700px] sm:h-[750px] md:h-[500px] bg-gray-800 flex flex-col md:flex-row border-4 border-red-600 rounded-lg shadow-2xl relative mx-auto overflow-hidden"
    >
        {/* Messages Panel */}
        <div className="w-full h-72 md:h-auto md:flex-1 flex flex-col bg-gray-900 md:rounded-l-lg rounded-t-lg md:rounded-t-none overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 text-white p-2 sm:p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold text-sm sm:text-base truncate">
                ShiddyChat
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
            className="flex-1 overflow-y-auto p-1 sm:p-2 md:p-3 bg-green-100 space-y-1 sm:space-y-2"
          >
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-2 sm:px-4 sm:py-3 rounded text-xs sm:text-sm">
                Error: {error}
              </div>
            )}
            
                         {!hasUsername && (
               <div className="bg-blue-100 border border-blue-400 text-blue-700 px-2 py-2 sm:px-4 sm:py-3 rounded text-xs sm:text-sm text-center">
                 Welcome to ShiddyChat! Your username is being generated...
               </div>
             )}
            
            {messages.map((message) => (
              <div key={message.id} className="bg-white rounded-md p-1.5 sm:p-2 md:p-3 shadow-sm border">
                <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-1.5 py-0 sm:px-2"
                    style={{ backgroundColor: message.user_color, color: 'white' }}
                  >
                    {message.username}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
                
                {message.message_text && (
                  <p className="text-xs sm:text-sm text-gray-800 mb-1 sm:mb-2 leading-tight">{message.message_text}</p>
                )}
                
                {message.drawing_data && (
                  <img 
                    src={message.drawing_data} 
                    alt="Drawing" 
                    className="max-w-full h-auto rounded border bg-green-50 max-h-[120px] sm:max-h-[200px]"
                  />
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center justify-center py-2 sm:py-4">
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-gray-500" />
                <span className="ml-2 text-xs sm:text-sm text-gray-500">Loading...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-1.5 sm:p-2 md:p-3 bg-gray-800 border-t border-gray-700 rounded-bl-lg md:rounded-bl-lg md:rounded-br-none">
            <div className="flex gap-1.5 sm:gap-2">
                             <Input
                 value={textInput}
                 onChange={(e) => setTextInput(e.target.value)}
                 placeholder={hasUsername ? "Type a message..." : "Loading..."}
                 className="flex-1 bg-white text-black text-xs sm:text-sm h-8 sm:h-9"
                 onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                 disabled={isLoading || !hasUsername}
               />
              <Button 
                onClick={handleSendMessage}
                disabled={isLoading || !hasUsername || (!textInput.trim() && currentStrokes.length === 0)}
                className="bg-red-600 hover:bg-red-700 h-8 sm:h-9 px-2 sm:px-3"
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

        {/* Drawing Panel */}
        <div className="flex-1 md:w-80 lg:w-96 bg-green-200 flex flex-col md:rounded-r-lg rounded-b-lg md:rounded-b-none">
          {/* Drawing Controls */}
          <div className="p-1.5 sm:p-2 bg-green-300 space-y-1.5 sm:space-y-2">
            {/* Tool Selection */}
            <div className="flex gap-1">
              <Button
                variant={tool === 'pen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('pen')}
                className="flex-1 h-7 sm:h-8 text-xs"
              >
                <Brush className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Pen</span>
              </Button>
              <Button
                variant={tool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('eraser')}
                className="flex-1 h-7 sm:h-8 text-xs"
              >
                <Eraser className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Eraser</span>
              </Button>
            </div>

            {/* Color Palette */}
            <div className="grid grid-cols-8 gap-1">
              {shiddyColors.map((shiddyColor) => (
                <button
                  key={shiddyColor}
                  className={`w-7 h-7 md:w-6 md:h-6 rounded border-2 ${color === shiddyColor ? 'border-black' : 'border-gray-400'} touch-manipulation`}
                  style={{ backgroundColor: shiddyColor }}
                  onClick={() => setColor(shiddyColor)}
                />
              ))}
            </div>

            {/* Brush Size */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Size:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1 touch-manipulation"
                style={{ minHeight: '24px' }}
              />
              <span className="text-xs font-bold w-6 text-center">{brushSize}</span>
            </div>

            {/* Clear and Undo Buttons */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                className="w-full h-7 sm:h-8 text-xs"
              >
                <Trash2 className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                className="w-full h-7 sm:h-8 text-xs"
                disabled={historyIndex < 0}
              >
                <Undo2 className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Undo</span>
              </Button>
            </div>
          </div>

                     {/* Canvas */}
           <div className="flex-1 p-1.5 sm:p-2 bg-green-200 relative">
             <div className="relative w-full h-full">
               <canvas
                 ref={canvasRef}
                 className="absolute inset-0 w-full h-full bg-green-50 border-2 border-gray-400 rounded"
                 style={{ imageRendering: 'pixelated' }}
               />
               <canvas
                 ref={overlayCanvasRef}
                 className="absolute inset-0 w-full h-full pointer-events-none"
                 style={{ imageRendering: 'pixelated' }}
               />
                             <div
                className="absolute inset-0 w-full h-full cursor-none touch-none"
                onMouseDown={startDrawing}
                onMouseMove={handleMouseMove}
                onMouseUp={endDrawing}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={startDrawing}
                onTouchMove={handleMouseMove}
                onTouchEnd={endDrawing}
                onTouchCancel={endDrawing}
                style={{
                  touchAction: 'none', // Prevent scrolling, zooming, and other gestures
                  WebkitTouchCallout: 'none', // Disable callout on iOS
                  WebkitUserSelect: 'none', // Disable text selection
                  userSelect: 'none'
                }}
              />
             </div>
           </div>
        </div>
      </div>
  );
}
