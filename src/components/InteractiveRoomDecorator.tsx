'use client'

import React, { useState, useRef, useCallback, ChangeEvent, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { UploadIcon, XIcon, PlusIcon, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
type ArtPiece = { 
  id: number, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  aspectRatio: number,
  isPlaced: boolean,
  frameColor: string,
  image: string | null
}

const ArtThumbnail = React.memo(({ art, onDelete, onDoubleClick }: { art: ArtPiece; onDelete: () => void; onDoubleClick: () => void }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div 
      className="relative aspect-square bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center cursor-pointer select-none overflow-hidden group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onDoubleClick={onDoubleClick}
    >
      {art.image && (
        <img 
          src={art.image} 
          alt={`Art ${art.id}`} 
          className="w-full h-full object-cover pointer-events-none"
        />
      )}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300" />
      {isHovering && (
        <button
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white bg-opacity-50 rounded-full opacity-100 transition-all duration-300 hover:bg-opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X className="h-4 w-4 text-gray-700" />
          <span className="sr-only">Delete Art {art.id}</span>
        </button>
      )}
    </div>
  );
});

ArtThumbnail.displayName = 'ArtThumbnail';

export default function Component() {
  const [artPieces, setArtPieces] = useState<ArtPiece[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<{ direction: ResizeDirection; artId: number } | null>(null)
  const [isHovering, setIsHovering] = useState<number | null>(null)
  const roomRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef<{ x: number, y: number }>({ x: 0, y: 0 })
  const [roomImage, setRoomImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const artFileInputRef = useRef<HTMLInputElement>(null)
  const innerRoomRef = useRef<HTMLDivElement>(null)
  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const FRAME_WIDTH = 10 // Reduced from 20 to 10 pixels
  const MAX_ART_PIECES = 4

  useEffect(() => {
    console.log("roomImage state changed:", roomImage ? "Image set" : "No image")
  }, [roomImage])

  const handleUploadArt = useCallback(() => {
    if (artPieces.length < MAX_ART_PIECES) {
      artFileInputRef.current?.click();
    }
  }, [artPieces])

  const handleArtFileChange = useCallback((input: ChangeEvent<HTMLInputElement> | string) => {
    const processImage = (imageSource: string) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const newArt: ArtPiece = {
          id: Date.now(),
          x: 0,
          y: 0,
          width: 150,
          height: 150 / aspectRatio,
          aspectRatio,
          isPlaced: false,
          frameColor: 'black',
          image: imageSource
        };
        setArtPieces(prev => [...prev, newArt]);
      };
      img.src = imageSource;
    };

    if (typeof input === 'string') {
      // Handle generated image URL
      processImage(input);
    } else {
      // Handle file upload
      const files = input.target.files;
      if (!files) return;

      Array.from(files).forEach((file, index) => {
        if (artPieces.length + index < MAX_ART_PIECES) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              processImage(event.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }, [artPieces, MAX_ART_PIECES]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, artId: number) => {
    e.dataTransfer.setData('text/plain', artId.toString())
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const artId = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (roomRef.current) {
      const roomRect = roomRef.current.getBoundingClientRect()
      const x = e.clientX - roomRect.left - FRAME_WIDTH
      const y = e.clientY - roomRect.top - FRAME_WIDTH
      
      setArtPieces(prev => prev.map(art => 
        art.id === artId ? { ...art, x, y, isPlaced: true } : art
      ))
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, artId: number) => {
    e.preventDefault()
    if (roomRef.current) {
      const roomRect = roomRef.current.getBoundingClientRect()
      dragStartPos.current = {
        x: e.clientX - roomRect.left,
        y: e.clientY - roomRect.top
      }
      setIsDragging(artId)
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!roomRef.current) return

    const roomRect = roomRef.current.getBoundingClientRect()
    const mouseX = e.clientX - roomRect.left
    const mouseY = e.clientY - roomRect.top

    if (isDragging !== false) {
      const deltaX = mouseX - dragStartPos.current.x
      const deltaY = mouseY - dragStartPos.current.y
      setArtPieces(prev => prev.map(art => 
        art.id === isDragging ? { ...art, x: art.x + deltaX, y: art.y + deltaY } : art
      ))
      dragStartPos.current = { x: mouseX, y: mouseY }
    } else if (isResizing) {
      const { direction, artId } = isResizing
      setArtPieces(prev => prev.map(art => {
        if (art.id !== artId) return art
        
        let newWidth = art.width
        let newHeight = art.height
        let newX = art.x
        let newY = art.y

        if (direction.includes('e')) newWidth = mouseX - art.x - FRAME_WIDTH
        if (direction.includes('s')) newHeight = mouseY - art.y - FRAME_WIDTH
        if (direction.includes('w')) {
          newWidth = art.x + art.width - mouseX + FRAME_WIDTH
          newX = mouseX - FRAME_WIDTH
        }
        if (direction.includes('n')) {
          newHeight = art.y + art.height - mouseY + FRAME_WIDTH
          newY = mouseY - FRAME_WIDTH
        }

        // Maintain aspect ratio
        if (direction.includes('n') || direction.includes('s')) {
          newWidth = newHeight * art.aspectRatio
        } else {
          newHeight = newWidth / art.aspectRatio
        }

        // Ensure minimum size
        if (newWidth < 50 || newHeight < 50) return art

        return { ...art, x: newX, y: newY, width: newWidth, height: newHeight }
      }))
    }
  }, [isDragging, isResizing])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(null)
  }, [])

  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>, direction: ResizeDirection, artId: number) => {
    e.stopPropagation()
    setIsResizing({ direction, artId })
  }, [])

  const handleDeleteArt = useCallback((artId: number) => {
    setArtPieces(prev => prev.filter(art => art.id !== artId))
  }, [])

  const handleRemovePlacedArt = useCallback((artId: number) => {
    setArtPieces(prev => prev.map(art => 
      art.id === artId ? { ...art, isPlaced: false } : art
    ))
  }, [])

  const handleFrameColorChange = useCallback((color: string, artId: number) => {
    setArtPieces(prev => prev.map(art => 
      art.id === artId ? { ...art, frameColor: color === 'none' ? 'transparent' : color } : art
    ))
  }, [])

  const resizeHandles: { direction: ResizeDirection; className: string }[] = [
    { direction: 'n', className: 'top-0 left-1/2 -translate-x-1/2 h-1 w-8 cursor-n-resize' },
    { direction: 's', className: 'bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 cursor-s-resize' },
    { direction: 'e', className: 'right-0 top-1/2 -translate-y-1/2 w-1 h-8 cursor-e-resize' },
    { direction: 'w', className: 'left-0 top-1/2 -translate-y-1/2 w-1 h-8 cursor-w-resize' },
    { direction: 'ne', className: 'top-0 right-0 h-2 w-2 cursor-ne-resize' },
    { direction: 'nw', className: 'top-0 left-0 h-2 w-2 cursor-nw-resize' },
    { direction: 'se', className: 'bottom-0 right-0 h-2 w-2 cursor-se-resize' },
    { direction: 'sw', className: 'bottom-0 left-0 h-2 w-2 cursor-sw-resize' },
  ]

  const handleUploadRoom = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        console.log("Room image loaded:", result.slice(0, 50) + "...")
        setRoomImage(result)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleSaveRoomImage = async () => {
    if (innerRoomRef.current) {
      // Wait for all images to load
      const images = innerRoomRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const canvas = await html2canvas(innerRoomRef.current, {
        useCORS: true, // Add this line
        backgroundColor: null,
      });
      const image = canvas.toDataURL('image/jpeg', 0.9);
      
      // Generate timestamp
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const day = now.getDate().toString().padStart(2, '0')
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      
      const timestamp = `${year}${month}${day} ${hours}${minutes}`
      const fileName = `Room w art ${timestamp}.jpg`

      const link = document.createElement('a')
      link.href = image
      link.download = fileName
      link.click()
    }
  }

  const handleDoubleClick = useCallback((artId: number) => {
    if (roomRef.current) {
      const roomRect = roomRef.current.getBoundingClientRect()
      const centerX = (roomRect.width - FRAME_WIDTH * 2) / 2
      const centerY = (roomRect.height - FRAME_WIDTH * 2) / 2

      setArtPieces(prev => prev.map(art => 
        art.id === artId ? { 
          ...art, 
          isPlaced: !art.isPlaced, 
          x: art.isPlaced ? 0 : centerX - art.width / 2,
          y: art.isPlaced ? 0 : centerY - art.height / 2
        } : art
      ))
    }
  }, [])

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.images && result.images.length > 0) {
        setGeneratedImage(result.images[0].url);
      } else {
        throw new Error('No image URL in the response');
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      setGeneratedImage(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddGeneratedArt = useCallback(() => {
    if (generatedImage && artPieces.length < MAX_ART_PIECES) {
      handleArtFileChange(generatedImage);
      setGeneratedImage(null);
    }
  }, [generatedImage, artPieces, handleArtFileChange]);

  const handleSaveGeneratedImage = () => {
    if (generatedImage) {
      fetch(generatedImage)
        .then(response => response.blob())
        .then(blob => {
          const fileName = `generated_art_${Date.now()}.png`;
          saveAs(blob, fileName);
        });
    }
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenerateImage();
    }
  };

  return (
    <div className="container mx-auto p-2 space-y-4 pt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
        <h1 className="text-xl font-bold">Interactive Room Decorator</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleUploadRoom}>
            <UploadIcon className="mr-1 h-3 w-3" />
            Upload room
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUploadArt}
            disabled={artPieces.length >= MAX_ART_PIECES}
          >
            <UploadIcon className="mr-1 h-3 w-3" />
            Upload art
          </Button>
          <input
            type="file"
            ref={artFileInputRef}
            onChange={handleArtFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSaveRoomImage}
            disabled={!roomImage}
          >
            Save room image
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4">
        <div 
          ref={roomRef}
          className="w-full lg:w-2/3 aspect-[4/3] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative select-none overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {roomImage ? (
            <img 
              src={roomImage} 
              alt="Room" 
              className="w-full h-full object-cover"
              onLoad={() => console.log("Room image loaded successfully in UI")}
              onError={(e) => console.error("Error loading room image in UI:", e)}
              style={{border: '2px solid red'}} // Add this line for debugging
            />
          ) : (
            <p className="text-gray-500 pointer-events-none">No Room Image Uploaded</p>
          )}
          <p className="absolute top-0 left-0 bg-white text-black p-1 z-10">
            Room Image: {roomImage ? 'Set' : 'Not Set'}
          </p>
          {artPieces.filter(art => art.isPlaced).map(art => (
            <div 
              key={art.id}
              className="absolute cursor-move select-none group"
              style={{ 
                left: `${art.x}px`, 
                top: `${art.y}px`, 
                width: `${art.width + (art.frameColor !== 'transparent' ? FRAME_WIDTH * 2 : 0)}px`, 
                height: `${art.height + (art.frameColor !== 'transparent' ? FRAME_WIDTH * 2 : 0)}px`,
                boxShadow: art.frameColor !== 'transparent' 
                  ? `0 2px 4px rgba(0,0,0,0.1), 0 0 0 ${FRAME_WIDTH}px ${art.frameColor}, 0 0 0 ${FRAME_WIDTH + 1}px #000`
                  : 'none',
                transition: 'box-shadow 0.3s ease-in-out',
                backgroundColor: art.frameColor !== 'transparent' ? 'white' : 'transparent',
              }}
              onMouseDown={(e) => handleMouseDown(e, art.id)}
              onMouseEnter={() => setIsHovering(art.id)}
              onMouseLeave={() => setIsHovering(null)}
              onDoubleClick={() => handleDoubleClick(art.id)}
            >
              <div 
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{
                  left: art.frameColor !== 'transparent' ? `${FRAME_WIDTH}px` : '0',
                  top: art.frameColor !== 'transparent' ? `${FRAME_WIDTH}px` : '0',
                  width: art.frameColor !== 'transparent' ? `${art.width}px` : '100%',
                  height: art.frameColor !== 'transparent' ? `${art.height}px` : '100%',
                }}
              >
                {art.image ? (
                  <img 
                    src={art.image} 
                    alt={`Art ${art.id + 1}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="pointer-events-none text-gray-500">Art {art.id + 1}</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300" />
              {isHovering === art.id && (
                <button
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white bg-opacity-50 rounded-full opacity-100 transition-all duration-300 hover:bg-opacity-100"
                  onClick={() => handleRemovePlacedArt(art.id)}
                >
                  <X className="h-4 w-4 text-gray-700" />
                  <span className="sr-only">Remove Art {art.id + 1}</span>
                </button>
              )}
              {resizeHandles.map(({ direction, className }) => (
                <div
                  key={direction}
                  className={`absolute ${className} bg-yellow-400 opacity-0 group-hover:opacity-100`}
                  onMouseDown={(e) => handleResizeStart(e, direction, art.id)}
                />
              ))}
            </div>
          ))}
        </div>
        
        <div className="w-full lg:w-1/3 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Uploaded Art</h2>
            <div className="w-full max-w-xs mb-2">
              <Select 
                onValueChange={(color) => {
                  const placedArt = artPieces.find(art => art.isPlaced)
                  if (placedArt) handleFrameColorChange(color, placedArt.id)
                }} 
                value={artPieces.find(art => art.isPlaced)?.frameColor}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select frame" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No frame</SelectItem>
                  <SelectItem value="black">Black frame</SelectItem>
                  <SelectItem value="brown">Brown frame</SelectItem>
                  <SelectItem value="white">White frame</SelectItem>
                  <SelectItem value="gold">Gold frame</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: MAX_ART_PIECES }).map((_, index) => {
                const art = artPieces[index];
                return art ? (
                  <ArtThumbnail
                    key={art.id}
                    art={art}
                    onDelete={() => handleDeleteArt(art.id)}
                    onDoubleClick={() => handleDoubleClick(art.id)}
                  />
                ) : (
                  <div 
                    key={index}
                    className="aspect-square bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center"
                  >
                    <PlusIcon className="h-6 w-6 text-gray-400" />
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Generate Image</h2>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handlePromptKeyDown}
                className="w-full"
              />
              <Button 
                className="w-full" 
                onClick={handleGenerateImage}
                disabled={isGenerating || !prompt}
              >
                {isGenerating ? 'Generating...' : 'Generate Image'}
              </Button>
            </div>
          </div>
          
          {generatedImage && (
            <div className="mt-4">
              <img src={generatedImage} alt="Generated Art" className="w-full h-auto" />
              <div className="flex justify-between mt-2">
                <Button onClick={handleAddGeneratedArt} className="w-1/2 mr-1">
                  Add to Art Pieces
                </Button>
                <Button onClick={handleSaveGeneratedImage} className="w-1/2 ml-1">
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}