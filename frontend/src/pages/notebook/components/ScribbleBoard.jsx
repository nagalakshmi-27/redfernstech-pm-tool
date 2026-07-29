import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Eraser, Undo, Redo, Sparkles, PenTool, Check, X, MousePointer2, ZoomIn, ZoomOut, Download } from "lucide-react";

const COLORS = ["#ffffff", "#ef4444", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

export default function ScribbleBoard({ item, onClose, token }) {
  const [title, setTitle] = useState(item.title);
  const [saving, setSaving] = useState(false);
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  
  const [isEraser, setIsEraser] = useState(false);
  const [eraserSize, setEraserSize] = useState(40);
  const [showEraserSizes, setShowEraserSizes] = useState(false);
  
  const [penSize, setPenSize] = useState(3);
  const [showPenSizes, setShowPenSizes] = useState(false);
  const [penStyle, setPenStyle] = useState("normal"); // "normal" or "shining"
  
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Floating Image State
  const [floatingImage, setFloatingImage] = useState(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  // Undo stack stores base64 image data strings
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  
  // State to trigger re-renders for buttons
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateStackStates = () => {
    setCanUndo(undoStack.current.length > 1);
    setCanRedo(redoStack.current.length > 0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 64; // subtract header height
    
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    contextRef.current = context;
    
    // Fill background if new
    context.fillStyle = "#13131a";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Load existing image if available
    if (item.content) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0);
        saveState(); // Save initial state for undo
      };
      img.src = item.content;
    } else {
      saveState();
    }
  }, []);

  useEffect(() => {
    if (!contextRef.current) return;
    const ctx = contextRef.current;
    
    if (isEraser) {
      ctx.strokeStyle = "#13131a"; // Erase by drawing background color
      ctx.lineWidth = eraserSize;
      ctx.shadowBlur = 0; // Disable neon for eraser
    } else {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = penSize;
      
      if (penStyle === "shining") {
        ctx.shadowBlur = 15;
        ctx.shadowColor = activeColor;
      } else {
        ctx.shadowBlur = 0;
      }
    }
  }, [activeColor, isEraser, eraserSize, penSize, penStyle]);

  const saveState = (clearRedo = true) => {
    if (!canvasRef.current) return;
    undoStack.current.push(canvasRef.current.toDataURL());
    if (clearRedo) {
      redoStack.current = []; // Clear redo stack on new action
    }
    // Limit stack size to prevent memory issues
    if (undoStack.current.length > 20) {
      undoStack.current.shift();
    }
    updateStackStates();
  };

  const handleUndo = () => {
    if (undoStack.current.length <= 1) return; 
    const currentState = undoStack.current.pop(); 
    redoStack.current.push(currentState); // Save for redo
    
    updateStackStates();    
    const previousState = undoStack.current[undoStack.current.length - 1];
    
    const img = new Image();
    img.onload = () => {
      const context = canvasRef.current.getContext("2d");
      const prevShadow = context.shadowBlur;
      context.shadowBlur = 0;
      
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context.drawImage(img, 0, 0);
      
      context.shadowBlur = prevShadow;
    };
    img.src = previousState;
  };

  const handleRedo = () => {
    if (redoStack.current.length === 0) return;
    const nextState = redoStack.current.pop();
    updateStackStates();
    
    const img = new Image();
    img.onload = () => {
      const context = canvasRef.current.getContext("2d");
      const prevShadow = context.shadowBlur;
      context.shadowBlur = 0;
      
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context.drawImage(img, 0, 0);
      
      context.shadowBlur = prevShadow;
      saveState(false); // Push to undo stack, don't clear redo stack
    };
    img.src = nextState;
  };

  const startDrawing = ({ nativeEvent }) => {
    if (floatingImage) return; // Disable drawing while placing image
    
    const { offsetX, offsetY } = nativeEvent;
    let x = offsetX, y = offsetY;
    if (nativeEvent.touches) {
      const rect = canvasRef.current.getBoundingClientRect();
      x = nativeEvent.touches[0].clientX - rect.left;
      y = nativeEvent.touches[0].clientY - rect.top;
    }
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    contextRef.current.closePath();
    setIsDrawing(false);
    saveState();
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    nativeEvent.preventDefault(); // Prevent scrolling on touch
    
    const { offsetX, offsetY } = nativeEvent;
    let x = offsetX, y = offsetY;
    if (nativeEvent.touches) {
      const rect = canvasRef.current.getBoundingClientRect();
      x = nativeEvent.touches[0].clientX - rect.left;
      y = nativeEvent.touches[0].clientY - rect.top;
    }

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  // --- FLOATING IMAGE LOGIC ---
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          // Scale down if too large
          let w = img.width;
          let h = img.height;
          const maxW = canvas.width * 0.8;
          const maxH = canvas.height * 0.8;
          if (w > maxW) { h = h * (maxW / w); w = maxW; }
          if (h > maxH) { w = w * (maxH / h); h = maxH; }
          
          setFloatingImage({
            src: event.target.result,
            x: (canvas.width / 2) - (w / 2),
            y: (canvas.height / 2) - (h / 2),
            width: w,
            height: h,
            imgElement: img // Cache the image element for stamping
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const stampFloatingImage = () => {
    if (!floatingImage) return;
    const ctx = contextRef.current;
    
    // Disable shadow before stamping image
    const prevShadow = ctx.shadowBlur;
    ctx.shadowBlur = 0;
    
    ctx.drawImage(
      floatingImage.imgElement, 
      floatingImage.x, 
      floatingImage.y, 
      floatingImage.width, 
      floatingImage.height
    );
    
    ctx.shadowBlur = prevShadow; // Restore shadow
    
    setFloatingImage(null);
    saveState();
  };

  const cancelFloatingImage = () => {
    setFloatingImage(null);
  };

  const handleImageMouseDown = (e) => {
    setIsDraggingImage(true);
    dragStartPos.current = {
      x: e.clientX - floatingImage.x,
      y: e.clientY - floatingImage.y
    };
  };

  const handleImageMouseMove = (e) => {
    if (!isDraggingImage) return;
    setFloatingImage({
      ...floatingImage,
      x: e.clientX - dragStartPos.current.x,
      y: e.clientY - dragStartPos.current.y
    });
  };

  const handleImageMouseUp = () => {
    setIsDraggingImage(false);
  };

  const scaleFloatingImage = (factor) => {
    if (!floatingImage) return;
    setFloatingImage(prev => ({
      ...prev,
      width: prev.width * factor,
      height: prev.height * factor,
      x: prev.x - (prev.width * factor - prev.width) / 2,
      y: prev.y - (prev.height * factor - prev.height) / 2
    }));
  };
  // -----------------------------

  const saveToBackend = async (isClosing = false) => {
    setSaving(true);
    try {
      // If there's a floating image, stamp it before saving
      if (floatingImage && isClosing) {
        stampFloatingImage();
      }
      
      const imageData = canvasRef.current.toDataURL();
      await fetch(`${import.meta.env.VITE_API_URL}/notebooks/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, content: imageData })
      });
      if (isClosing) onClose();
    } catch (err) {
      console.error("Failed to save scribble", err);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!canvasRef.current) return;
    
    // Create a temporary canvas to add the background color (since it might be transparent if they erased)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const tempCtx = tempCanvas.getContext("2d");
    
    // Fill background
    tempCtx.fillStyle = "#13131a";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw actual scribble
    tempCtx.drawImage(canvasRef.current, 0, 0);
    
    const url = tempCanvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'Scribble'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-[#13131a] z-50 flex flex-col touch-none select-none">
      <div className="min-h-[4rem] py-2 sm:py-0 bg-[#1e1e2d] border-b border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between px-2 sm:px-6 z-20 gap-y-2">
        <div className="flex items-center w-[60%] sm:w-auto sm:flex-1 order-1 sm:order-none">
          <button 
            onClick={() => saveToBackend(true)}
            className="text-slate-400 hover:text-white mr-2 sm:mr-4 p-2 rounded-full hover:bg-slate-700 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Board Title..."
            className="bg-transparent border-none outline-none text-lg sm:text-xl font-semibold text-white w-full sm:w-64 placeholder-slate-600 truncate"
          />
        </div>
        
        <div className="flex justify-start sm:justify-center items-center space-x-1 order-3 sm:order-none w-full sm:w-auto sm:flex-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <button 
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${!canUndo ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            title="Undo"
          >
            <Undo className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${!canRedo ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            title="Redo"
          >
            <Redo className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-slate-700 mx-1"></div>
          
          {/* ERASER TOOL */}
          <div className="relative flex items-center">
            <button 
              onClick={() => {
                if (isEraser) {
                  setShowEraserSizes(!showEraserSizes);
                } else {
                  setIsEraser(true);
                  setShowEraserSizes(true);
                  setShowPenSizes(false);
                }
              }}
              className={`p-2 rounded-lg transition-colors ${isEraser ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
              title="Eraser"
            >
              <Eraser className="w-5 h-5" />
            </button>
            
            {showEraserSizes && isEraser && (
              <div className="absolute top-12 left-0 bg-slate-800 rounded-lg p-2 flex flex-col space-y-2 border border-slate-700 shadow-xl z-30">
                <button onClick={() => { setEraserSize(10); setShowEraserSizes(false); }} className={`flex items-center px-3 py-1.5 rounded hover:bg-slate-700 ${eraserSize===10?'bg-slate-700 text-white':'text-slate-300'}`}>Small</button>
                <button onClick={() => { setEraserSize(40); setShowEraserSizes(false); }} className={`flex items-center px-3 py-1.5 rounded hover:bg-slate-700 ${eraserSize===40?'bg-slate-700 text-white':'text-slate-300'}`}>Medium</button>
                <button onClick={() => { setEraserSize(100); setShowEraserSizes(false); }} className={`flex items-center px-3 py-1.5 rounded hover:bg-slate-700 ${eraserSize===100?'bg-slate-700 text-white':'text-slate-300'}`}>Large</button>
              </div>
            )}
          </div>

          {/* PEN TOOL (Thickness & Style) */}
          <div className="relative flex items-center">
            <button 
              onClick={() => {
                if (!isEraser) {
                  setShowPenSizes(!showPenSizes);
                } else {
                  setIsEraser(false);
                  setShowPenSizes(true);
                  setShowEraserSizes(false);
                }
              }}
              className={`p-2 rounded-lg transition-colors ${!isEraser ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
              title="Pen Settings"
            >
              <PenTool className="w-5 h-5" />
            </button>
            
            {showPenSizes && !isEraser && (
              <div className="absolute top-12 left-0 w-48 bg-slate-800 rounded-lg p-3 flex flex-col space-y-4 border border-slate-700 shadow-xl z-30">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-2 block uppercase tracking-wider">Thickness</label>
                  <div className="flex justify-between space-x-1">
                    <button onClick={() => setPenSize(3)} className={`flex-1 py-1 rounded hover:bg-slate-700 flex justify-center items-center ${penSize===3?'bg-slate-700':''}`}><div className="w-1 h-1 bg-white rounded-full"></div></button>
                    <button onClick={() => setPenSize(8)} className={`flex-1 py-1 rounded hover:bg-slate-700 flex justify-center items-center ${penSize===8?'bg-slate-700':''}`}><div className="w-2 h-2 bg-white rounded-full"></div></button>
                    <button onClick={() => setPenSize(16)} className={`flex-1 py-1 rounded hover:bg-slate-700 flex justify-center items-center ${penSize===16?'bg-slate-700':''}`}><div className="w-4 h-4 bg-white rounded-full"></div></button>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-2 block uppercase tracking-wider">Style</label>
                  <div className="flex space-x-2">
                    <button onClick={() => setPenStyle("normal")} className={`flex-1 text-xs py-1.5 rounded transition ${penStyle==="normal"?'bg-indigo-600 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Normal</button>
                    <button onClick={() => setPenStyle("shining")} className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center transition ${penStyle==="shining"?'bg-indigo-600 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}><Sparkles className="w-3 h-3 mr-1"/> Neon</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-1 ml-4 bg-[#13131a] p-1.5 rounded-xl border border-slate-800">
            {COLORS.map(color => (
              <button
                key={color}
                onClick={() => {
                  setActiveColor(color);
                  setIsEraser(false);
                  setShowEraserSizes(false);
                  setShowPenSizes(false);
                }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform relative ${activeColor === color && !isEraser ? 'scale-110 shadow-md ring-2 ring-white/30 z-10' : ''}`}
                style={{ backgroundColor: color, boxShadow: activeColor === color && penStyle === "shining" && !isEraser ? `0 0 10px ${color}` : 'none' }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 order-2 sm:order-none w-[40%] sm:w-auto sm:flex-1 shrink-0">
          <button 
            onClick={handleExport}
            className="flex items-center p-2 sm:px-4 sm:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            title="Export to PNG"
          >
            <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Export</span>
          </button>
          
          <button 
            onClick={() => saveToBackend(true)}
            className="flex items-center p-2 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            title="Save"
          >
            {saving ? <><Save className="w-4 h-4 sm:mr-2 animate-pulse" /> <span className="hidden sm:inline">Saving...</span></> : <><Save className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Save</span></>}
          </button>
        </div>
      </div>
      
      <div 
        className={`flex-1 w-full relative overflow-hidden bg-[#13131a] ${floatingImage ? 'cursor-default' : (isEraser ? 'cursor-cell' : 'cursor-crosshair')}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseOut={finishDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={finishDrawing}
          onTouchCancel={finishDrawing}
          onTouchMove={draw}
          className="absolute inset-0 z-0"
        />
        
        {/* FLOATING IMAGE OVERLAY */}
        {floatingImage && (
          <div 
            className="absolute z-10 cursor-move border-2 border-indigo-500/50 shadow-2xl group"
            style={{ 
              left: floatingImage.x, 
              top: floatingImage.y, 
              width: floatingImage.width, 
              height: floatingImage.height 
            }}
            onMouseDown={handleImageMouseDown}
          >
            {/* Drag Handle Indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 pointer-events-none transition-opacity">
              <MousePointer2 className="w-12 h-12 text-white/50" />
            </div>
            
            <img 
              src={floatingImage.src} 
              alt="Floating" 
              className="w-full h-full object-contain pointer-events-none" 
            />
            
            {/* Action Buttons */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => e.stopPropagation()}>
              <button 
                onClick={() => scaleFloatingImage(0.9)}
                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg border border-slate-600"
                title="Shrink"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scaleFloatingImage(1.1)}
                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg border border-slate-600"
                title="Grow"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              
              <div className="w-px h-6 bg-slate-600 self-center mx-1"></div>

              <button 
                onClick={cancelFloatingImage}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
              <button 
                onClick={stampFloatingImage}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg font-medium flex items-center"
                title="Place Image"
              >
                <Check className="w-5 h-5 mr-1" /> Stamp
              </button>
            </div>
          </div>
        )}
        
      </div>
      
      {/* Global Mouse Handlers for Dragging Image outside its bounds */}
      {floatingImage && isDraggingImage && (
        <div 
          className="fixed inset-0 z-50 cursor-move" 
          onMouseMove={handleImageMouseMove}
          onMouseUp={handleImageMouseUp}
          onMouseLeave={handleImageMouseUp}
        />
      )}
    </div>
  );
}
