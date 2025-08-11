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
  MessageSquare
} from 'lucide-react';
import styles from '../app/shiddy.module.css';
import { useToast } from "@/components/ui/use-toast";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface Message {
  id: string;
  user: string;
  userColor: string;
  timestamp: Date;
  type: 'drawing' | 'text' | 'mixed';
  content: {
    text?: string;
    drawing?: string; // base64 image data
    strokes?: Stroke[];
  };
}

interface PictoChatProps {
  roomName?: string;
  userName?: string;
}

export default function PictoChat({ 
  roomName = "Room 1", 
  userName = "Guest" 
}: PictoChatProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStrokes, setCurrentStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000080'); // DS blue
  const [brushSize, setBrushSize] = useState(3);
  const [textInput, setTextInput] = useState('');
  const [connectedUsers] = useState(['You', 'Friend1', 'Friend2']);

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
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    // Clear with DS background
    ctx.fillStyle = '#E8F4E8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid pattern (like DS)
    ctx.strokeStyle = '#D0E0D0';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw all strokes
    currentStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  }, [currentStrokes]);

  // Drawing handlers
  const getPointFromEvent = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Calculate the scaling factor between canvas size and display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const point = getPointFromEvent(e);
    
    const newStroke: Stroke = {
      points: [point],
      color: tool === 'eraser' ? '#E8F4E8' : color,
      width: brushSize
    };
    
    setCurrentStroke(newStroke);
    setIsDrawing(true);
    setIsMouseDown(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return;
    
    e.preventDefault();
    const point = getPointFromEvent(e);
    
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point]
    };
    
    setCurrentStroke(updatedStroke);
    
    // Draw in real-time
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const points = updatedStroke.points;
    if (points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = updatedStroke.color;
    ctx.lineWidth = updatedStroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
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

  const handleMouseEnter = (e: React.MouseEvent) => {
    // Check if mouse button is still pressed when re-entering canvas
    if (isMouseDown && e.buttons === 1 && !isDrawing && currentStroke) {
      // Resume drawing with the existing stroke
      const point = getPointFromEvent(e);
      
      // Add the new point to the existing stroke
      const updatedStroke = {
        ...currentStroke,
        points: [...currentStroke.points, point]
      };
      
      setCurrentStroke(updatedStroke);
      setIsDrawing(true);
    }
  };

  const handleMouseLeave = () => {
    // Only pause drawing, don't end it if mouse is still down
    if (isDrawing && isMouseDown) {
      setIsDrawing(false);
      // Keep currentStroke and isMouseDown so we can resume
      // Don't clear currentStroke here - we need it to continue
    }
  };

  const clearCanvas = () => {
    setCurrentStrokes([]);
    redrawCanvas();
  };

  const sendMessage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const hasDrawing = currentStrokes.length > 0;
    const hasText = textInput.trim().length > 0;
    
    if (!hasDrawing && !hasText) {
      toast({
        title: "Empty message",
        description: "Draw something or type a message first!",
      });
      return;
    }
    
    const newMessage: Message = {
      id: Date.now().toString(),
      user: userName,
      userColor: '#0066CC',
      timestamp: new Date(),
      type: hasDrawing && hasText ? 'mixed' : hasDrawing ? 'drawing' : 'text',
      content: {
        text: hasText ? textInput : undefined,
        drawing: hasDrawing ? canvas.toDataURL() : undefined,
        strokes: hasDrawing ? currentStrokes : undefined
      }
    };
    
    setMessages(prev => [...prev, newMessage]);
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
  };



  // Global mouse up listener to handle mouse release outside canvas
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

  return (
    <div 
      className="w-full max-w-[800px] h-[500px] sm:h-[600px] bg-gray-800 flex flex-col sm:flex-row border-4 border-red-600 rounded-lg shadow-2xl relative mx-4"
      style={{
        fontFamily: '"Courier New", monospace',
        background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
      }}
    >
      {/* Header - DS Style with Red Theme */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-red-600 to-red-800 p-2 text-white border-b-4 border-red-900 rounded-t">
        <div className="flex items-center justify-center">
          <div className="bg-white/20 rounded-full p-1 mr-2">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h1 className="text-sm font-bold">PictoChat - {roomName}</h1>
        </div>
      </div>

      {/* Main Layout - Responsive */}
      <div className="flex-1 flex flex-col sm:flex-row pt-12">
        {/* Messages Panel */}
        <div className="flex-1 bg-gray-100">
          <div className="h-6 bg-gradient-to-r from-red-300 to-red-400 border-b-2 border-red-500 flex items-center px-2">
            <span className="text-xs font-bold text-red-800">GLOBAL BOARD</span>
          </div>
          
          <div 
            ref={messagesRef}
            className="overflow-y-auto p-2 space-y-1"
            style={{ height: '280px' }}
          >
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-16">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold">No messages yet</p>
                <p className="text-xs">Start drawing or typing!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className="bg-white rounded border border-gray-300 p-2 shadow-sm"
                  style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '2px solid #d1d5db'
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span 
                      className="font-bold text-xs"
                      style={{ color: message.userColor }}
                    >
                      {message.user}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {message.content.drawing && (
                    <div className="mb-1">
                      <img 
                        src={message.content.drawing} 
                        alt="Drawing"
                        className="border border-gray-300 rounded pixelated max-w-full"
                        style={{ 
                          imageRendering: 'pixelated',
                          maxHeight: '60px'
                        }}
                      />
                    </div>
                  )}
                  
                  {message.content.text && (
                    <p className="text-xs text-gray-800 font-mono">
                      {message.content.text}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Drawing Area */}
        <div className="w-80 bg-gray-200 flex flex-col border-l-2 border-red-600">
          <div className="h-6 bg-gradient-to-r from-red-300 to-red-400 border-b-2 border-red-500 flex items-center px-2">
            <span className="text-xs font-bold text-red-800">DRAW</span>
          </div>
          
          {/* Canvas */}
          <div className="p-2 bg-red-50">
            <div className="bg-white border-2 border-red-600 rounded overflow-hidden shadow-inner">
                <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
                className="block cursor-crosshair w-full"
                style={{ 
                  height: '150px',
                  touchAction: 'none',
                  imageRendering: 'pixelated'
                }}
              />
            </div>
          </div>

          {/* Tools */}
          <div className="p-2 bg-red-100 border-t border-red-400">
              <div className="flex gap-1 mb-2">
                <Button 
                  variant={tool === 'pen' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTool('pen')}
                  className="text-xs flex-1 px-1"
                >
                  <Brush className="w-3 h-3" />
                </Button>
                <Button 
                  variant={tool === 'eraser' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTool('eraser')}
                  className="text-xs flex-1 px-1"
                >
                  <Eraser className="w-3 h-3" />
                </Button>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-8 gap-0.5 mb-2">
                {dsColors.slice(0, 8).map((c, i) => (
                  <button
                    key={i}
                    className={`w-4 h-4 rounded border ${color === c ? 'border-black border-2' : 'border-gray-400'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearCanvas}
                className="w-full text-xs h-6"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>

          {/* Text Input */}
          <div className="p-2 bg-red-100 border-t border-red-300">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type message..."
              className="mb-2 text-xs font-mono h-7"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
            />
            
            <Button 
              onClick={sendMessage}
              className="w-full bg-red-600 hover:bg-red-700 h-7 text-xs"
              size="sm"
            >
              <Send className="w-3 h-3 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
