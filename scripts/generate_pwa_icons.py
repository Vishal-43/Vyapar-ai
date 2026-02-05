#!/usr/bin/env python3
"""
Generate placeholder PWA icons for the AgriTech platform.
This script creates simple colored PNG icons with the app logo/text.
For production, replace with professionally designed icons.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Icon sizes required for PWA
ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# Theme color from manifest
THEME_COLOR = (16, 185, 129)  # #10b981 (emerald-500)
WHITE = (255, 255, 255)
TEXT_COLOR = WHITE

def create_icon(size: int, output_path: str):
    """Create a single icon with the specified size."""
    # Create image with theme color background
    img = Image.new('RGB', (size, size), THEME_COLOR)
    draw = ImageDraw.Draw(img)
    
    # Draw a simple agriculture-themed icon (leaf/plant shape)
    # Create a circle in the center
    padding = size // 6
    circle_box = [padding, padding, size - padding, size - padding]
    draw.ellipse(circle_box, fill=WHITE, outline=THEME_COLOR, width=size//40 or 1)
    
    # Draw a leaf shape inside
    leaf_padding = size // 4
    leaf_points = [
        (size // 2, leaf_padding),  # Top
        (size - leaf_padding - size//10, size // 2),  # Right
        (size // 2, size - leaf_padding),  # Bottom
        (leaf_padding + size//10, size // 2),  # Left
    ]
    draw.polygon(leaf_points, fill=THEME_COLOR)
    
    # Draw stem
    stem_width = size // 20 or 2
    stem_start = size // 2 - stem_width // 2
    stem_end = size // 2 + stem_width // 2
    stem_top = size // 2 - size // 10
    stem_bottom = size - leaf_padding + size // 20
    draw.rectangle([stem_start, stem_top, stem_end, stem_bottom], fill=THEME_COLOR)
    
    # Try to add text (may fail if font not available)
    try:
        font_size = size // 5
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejavuSans-Bold.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
            except:
                font = ImageFont.load_default()
        
        text = "AT"  # AgriTech
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        text_x = (size - text_width) // 2
        text_y = size - padding // 2 - text_height
        
        # Don't draw text if it's too small (for small icons)
        if size >= 128:
            draw.text((text_x, text_y), text, fill=TEXT_COLOR, font=font)
    except Exception as e:
        print(f"Warning: Could not add text to icon: {e}")
    
    # Save the icon
    img.save(output_path, 'PNG', optimize=True)
    print(f"Created icon: {output_path} ({size}x{size})")

def main():
    # Create icons directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(os.path.dirname(script_dir), 'frontend')
    icons_dir = os.path.join(frontend_dir, 'public', 'icons')
    
    os.makedirs(icons_dir, exist_ok=True)
    
    print("Generating PWA icons...")
    print(f"Output directory: {icons_dir}")
    print()
    
    # Generate all icon sizes
    for size in ICON_SIZES:
        output_path = os.path.join(icons_dir, f'icon-{size}x{size}.png')
        create_icon(size, output_path)
    
    # Also create a favicon
    favicon_path = os.path.join(frontend_dir, 'public', 'favicon.ico')
    create_icon(32, favicon_path.replace('.ico', '-32x32.png'))
    create_icon(16, favicon_path.replace('.ico', '-16x16.png'))
    
    print()
    print("✓ Icon generation complete!")
    print()
    print("Note: These are placeholder icons. For production, create professional")
    print("icons using a design tool or service like:")
    print("  - Figma, Adobe Illustrator, or Canva")
    print("  - https://realfavicongenerator.net/")
    print("  - https://www.favicon-generator.org/")

if __name__ == '__main__':
    main()
