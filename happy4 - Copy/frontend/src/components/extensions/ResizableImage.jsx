import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { GripVertical, Trash2, MoveIcon } from 'lucide-react';

// React component for the resizable image
const ResizableImageComponent = ({ node, updateAttributes, deleteNode, selected }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: node.attrs.width || 300,
    height: node.attrs.height || 200,
  });
  const [position, setPosition] = useState({
    x: node.attrs.x || 0,
    y: node.attrs.y || 0,
  });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, posX: 0, posY: 0 });
  const imageRef = useRef(null);

  // Handle resize start
  const handleResizeStart = (e, corner) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(corner);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height,
    });
  };

  // Handle drag start
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    });
  };

  // Handle mouse move for resizing and dragging
  useEffect(() => {
    if (!isResizing && !isDragging) return;

    const handleMouseMove = (e) => {
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;

        // Calculate new dimensions based on corner
        if (isResizing.includes('e')) {
          newWidth = Math.max(100, resizeStart.width + deltaX);
        }
        if (isResizing.includes('w')) {
          newWidth = Math.max(100, resizeStart.width - deltaX);
        }
        if (isResizing.includes('s')) {
          newHeight = Math.max(100, resizeStart.height + deltaY);
        }
        if (isResizing.includes('n')) {
          newHeight = Math.max(100, resizeStart.height - deltaY);
        }

        setDimensions({ width: newWidth, height: newHeight });
      } else if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        setPosition({
          x: dragStart.posX + deltaX,
          y: dragStart.posY + deltaY,
        });
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        updateAttributes({
          width: dimensions.width,
          height: dimensions.height,
        });
        setIsResizing(false);
      }
      if (isDragging) {
        updateAttributes({
          x: position.x,
          y: position.y,
        });
        setIsDragging(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isDragging, resizeStart, dragStart, dimensions, position]);

  return (
    <NodeViewWrapper className="resizable-image-wrapper">
      <div
        ref={imageRef}
        className={`resizable-image-container ${showControls || selected ? 'selected' : ''} ${
          isDragging ? 'dragging' : ''
        }`}
        style={{
          position: 'relative',
          display: 'inline-block',
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default',
          transition: isDragging || isResizing ? 'none' : 'transform 0.2s ease',
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isResizing && !isDragging && setShowControls(false)}
      >
        {/* Image */}
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            objectFit: 'contain',
            display: 'block',
            borderRadius: '8px',
            transition: isResizing ? 'none' : 'all 0.2s ease',
            boxShadow: showControls || selected ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
          }}
        />

        {/* Control Buttons */}
        {(showControls || selected) && !isResizing && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-lg p-1 z-10"
            style={{ pointerEvents: 'auto' }}
          >
            <button
              onMouseDown={handleDragStart}
              className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing"
              title="Drag to move"
            >
              <MoveIcon className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode();
              }}
              className="p-1.5 rounded hover:bg-red-500/80 transition-colors"
              title="Delete image"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Resize Handles */}
        {(showControls || selected) && (
          <>
            {/* Corner Handles */}
            <div
              className="resize-handle resize-handle-nw"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
              style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: '2px solid #3b82f6',
                borderRadius: '50%',
                cursor: 'nw-resize',
                zIndex: 20,
              }}
            />
            <div
              className="resize-handle resize-handle-ne"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: '2px solid #3b82f6',
                borderRadius: '50%',
                cursor: 'ne-resize',
                zIndex: 20,
              }}
            />
            <div
              className="resize-handle resize-handle-sw"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '-4px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: '2px solid #3b82f6',
                borderRadius: '50%',
                cursor: 'sw-resize',
                zIndex: 20,
              }}
            />
            <div
              className="resize-handle resize-handle-se"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                width: '12px',
                height: '12px',
                background: 'white',
                border: '2px solid #3b82f6',
                borderRadius: '50%',
                cursor: 'se-resize',
                zIndex: 20,
              }}
            />

            {/* Edge Handles */}
            <div
              className="resize-handle resize-handle-n"
              onMouseDown={(e) => handleResizeStart(e, 'n')}
              style={{
                position: 'absolute',
                top: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '24px',
                height: '8px',
                background: 'white',
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                cursor: 'n-resize',
                zIndex: 20,
              }}
            />
            <div
              className="resize-handle resize-handle-s"
              onMouseDown={(e) => handleResizeStart(e, 's')}
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '24px',
                height: '8px',
                background: 'white',
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                cursor: 's-resize',
                zIndex: 20,
              }}
            />
            <div
              className="resize-handle resize-handle-w"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
              style={{
                position: 'absolute',
                top: '50%',
                left: '-4px',
                transform: 'translateY(-50%)',
                width: '8px',
                height: '24px',
                background: 'white',
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                cursor: 'w-resize',
                zIndex: 20,
              }}
            />
            <div
              className="resize-handle resize-handle-e"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
              style={{
                position: 'absolute',
                top: '50%',
                right: '-4px',
                transform: 'translateY(-50%)',
                width: '8px',
                height: '24px',
                background: 'white',
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                cursor: 'e-resize',
                zIndex: 20,
              }}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// TipTap Image Extension
export const ResizableImage = Node.create({
  name: 'resizableImage',

  group: 'block',

  atom: true,

  draggable: false,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      width: {
        default: 300,
      },
      height: {
        default: 200,
      },
      x: {
        default: 0,
      },
      y: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'resizable-image',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['resizable-image', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
