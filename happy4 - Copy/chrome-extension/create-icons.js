// Run this in browser console or with Node.js canvas to create icons
const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background - gradient blue
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3B82F6');
  gradient.addColorStop(1, '#1E40AF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Round corners
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  
  // Draw clipboard icon
  ctx.fillStyle = '#FFFFFF';
  const scale = size / 128;
  
  // Clipboard board
  ctx.fillRect(30 * scale, 25 * scale, 68 * scale, 85 * scale);
  
  // Clipboard clip
  ctx.fillStyle = '#60A5FA';
  ctx.fillRect(42 * scale, 15 * scale, 44 * scale, 20 * scale);
  
  // Lines on paper
  ctx.fillStyle = '#3B82F6';
  ctx.fillRect(45 * scale, 50 * scale, 38 * scale, 4 * scale);
  ctx.fillRect(45 * scale, 65 * scale, 38 * scale, 4 * scale);
  ctx.fillRect(45 * scale, 80 * scale, 25 * scale, 4 * scale);
  
  return canvas;
}

// Create 16x16 icon
const icon16 = createIcon(16);
fs.writeFileSync('icon16.png', icon16.toBuffer('image/png'));

// Create 48x48 icon
const icon48 = createIcon(48);
fs.writeFileSync('icon48.png', icon48.toBuffer('image/png'));

// Create 128x128 icon
const icon128 = createIcon(128);
fs.writeFileSync('icon128.png', icon128.toBuffer('image/png'));

console.log('Icons created successfully!');