from PIL import Image, ImageDraw

# Create a 512x512 icon with clipboard design
size = 512
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Gradient blue background circle
for i in range(100):
    alpha = int(255 * (1 - i/100))
    radius = size//2 - i
    color = (59, 130, 246, alpha)
    draw.ellipse([size//2-radius, size//2-radius, size//2+radius, size//2+radius], fill=color)

# Clipboard shape
clipboard_color = (255, 255, 255, 255)
# Top clip
draw.rectangle([size//2-50, size//4, size//2+50, size//4+30], fill=clipboard_color)
# Main board
draw.rectangle([size//2-80, size//4+20, size//2+80, size*3//4], fill=clipboard_color)

# Save
img.save('/app/electron/assets/icon.png')
print("Icon created successfully")
