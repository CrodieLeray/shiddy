"use client";

import { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Eraser, Undo2, Redo2, Brush, BookOpen, Move, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

export default function BookWidget() {
  // State hooks
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const { toast } = useToast();
  
  // Mount effect
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Early return for server-side rendering
  if (!isMounted) {
    return null;
  }

  // Handle zoom with mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isOpen) return;
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 0.1;
      setScale(prev => Math.min(Math.max(0.5, prev + delta), 3));
    };

    const book = bookRef.current;
    if (book) {
      book.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (book) {
        book.removeEventListener('wheel', handleWheel as any);
      }
    };
  }, [isOpen]);

  // Handle panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 1) return; // Only middle mouse button
    e.preventDefault();
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startPos]);

  // Drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
        redrawCanvas();
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8f3e6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.strokeStyle = stroke.tool === 'eraser' ? '#f8f3e6' : stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e as React.MouseEvent).clientX ? 
      (e as React.MouseEvent).clientX - rect.left : 
      (e as React.TouchEvent).touches[0].clientX - rect.left;
    const y = (e as React.MouseEvent).clientY ? 
      (e as React.MouseEvent).clientY - rect.top : 
      (e as React.TouchEvent).touches[0].clientY - rect.top;

    const newStroke: Stroke = {
      points: [{ x, y }],
      color: tool === 'eraser' ? '#f8f3e6' : color,
      width: brushSize,
      tool
    };

    setCurrentStroke(newStroke);
    setIsDrawing(true);
    
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1));
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke || !canvasRef.current) return;
    
    e.preventDefault();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e as React.MouseEvent).clientX ? 
      (e as React.MouseEvent).clientX - rect.left : 
      (e as React.TouchEvent).touches[0].clientX - rect.left;
    const y = (e as React.MouseEvent).clientY ? 
      (e as React.MouseEvent).clientY - rect.top : 
      (e as React.TouchEvent).touches[0].clientY - rect.top;

    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, { x, y }]
    };

    setCurrentStroke(updatedStroke);
    
    const ctx = canvasRef.current.getContext('2d');
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
      const updatedStrokes = [...strokes, currentStroke];
      setStrokes(updatedStrokes);
      setHistory([...history, updatedStrokes]);
      setHistoryIndex(historyIndex + 1);
    }
    
    setIsDrawing(false);
    setCurrentStroke(null);
  };

  const clearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      setStrokes([]);
      setHistory([...history, []]);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex] || []);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex] || []);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `shiddy-coloring-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataURL;
    link.click();
    
    toast({
      title: "Image downloaded!",
      description: "Your artwork has been saved as a PNG file.",
    });
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
      >
        <BookOpen className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div 
      ref={bookRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      <div 
        className="relative w-full max-w-4xl h-[80vh] bg-amber-800 rounded-lg shadow-2xl overflow-hidden border-8 border-amber-900 transform transition-transform duration-300"
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Book Spine */}
        <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-b from-amber-900 to-amber-800 border-r-2 border-amber-700"></div>
        
        {/* Book Cover */}
        <div className="ml-8 h-full flex flex-col">
          {/* Header */}
          <div className="bg-amber-700 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src="/shiddy.gif" 
                alt="Shiddy" 
                className="w-8 h-8 object-contain"
              />
              <h2 className="text-white font-bold">Shiddy's Coloring Book</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-amber-600"
                onClick={resetView}
              >
                <Move className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-amber-600"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col p-4 bg-amber-50">
            {/* Canvas Container */}
            <div 
              ref={containerRef}
              className="relative flex-1 bg-white rounded border border-amber-200 overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                style={{
                  touchAction: 'none',
                }}
              />
              
              {/* Watermark */}
              <div className="absolute bottom-2 right-2 opacity-10 pointer-events-none">
                <img 
                  src="/shiddy.gif" 
                  alt="Shiddy" 
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
            
            {/* Tools */}
            <div className="mt-4 bg-amber-100 rounded-lg p-2 border border-amber-200">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={tool === 'pen' ? 'default' : 'outline'} 
                        size="sm"
                        className="h-10 w-10 p-0"
                        onClick={() => setTool('pen')}
                      >
                        <Brush className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Pen</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={tool === 'eraser' ? 'default' : 'outline'} 
                        size="sm"
                        className="h-10 w-10 p-0"
                        onClick={() => setTool('eraser')}
                      >
                        <Eraser className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eraser</p>
                    </TooltipContent>
                  </Tooltip>

                  <div className="w-px h-6 bg-amber-200 mx-1"></div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-10 w-10 p-0"
                        onClick={undo}
                        disabled={historyIndex <= 0}
                      >
                        <Undo2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Undo</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-10 w-10 p-0"
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                      >
                        <Redo2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Redo</p>
                    </TooltipContent>
                  </Tooltip>

                  <div className="w-px h-6 bg-amber-200 mx-1"></div>

                  <div className="flex items-center space-x-2">
                    <div className="w-24">
                      <Slider
                        value={[brushSize]}
                        min={1}
                        max={50}
                        step={1}
                        onValueChange={([value]) => setBrushSize(value)}
                        className="h-2"
                      />
                      <div className="text-xs text-center text-amber-800">{brushSize}px</div>
                    </div>

                    <div className="w-8">
                      <div className="relative">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer opacity-0 absolute"
                          disabled={tool === 'eraser'}
                        />
                        <div className="w-8 h-8 rounded border border-amber-300 flex items-center justify-center">
                          <div 
                            className="w-5 h-5 rounded-full border border-amber-400"
                            style={{ backgroundColor: tool === 'eraser' ? '#f8f3e6' : color }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-px h-6 bg-amber-200 mx-1"></div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-10 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300"
                        onClick={clearCanvas}
                      >
                        Clear
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear Canvas</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-10 bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300"
                        onClick={downloadImage}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save Drawing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
