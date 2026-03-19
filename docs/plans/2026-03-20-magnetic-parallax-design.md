# Magnetic Parallax Interaction Design

## Overview
This design document outlines the implementation of a "Magnetic Parallax" interaction for the World Tour photo exhibition. The goal is to provide a minimalist yet highly engaging 3D interaction where gallery images react organically to mouse movements without disrupting the existing scroll and layout patterns.

## Target Audience & Aesthetics
- **Style:** Extreme minimalism, matching high-end portfolio sites (e.g., Awwwards, Apple TVOS).
- **Core Feeling:** Pictures should feel like physical objects suspended in space that subtly pull toward the user when inspected.

## Interaction Mechanics
The interaction relies on calculating the distance between the mouse pointer and the center of the individual image planes within the WebGL context. The behavior shifts across two zones:

1. **Attraction Zone (Magnetic Pull):** 
   - When the mouse cursor is near the image bounds (e.g., within 200-300px), a "gravitational" pull is exerted.
   - The image's X and Y coordinates softly drift toward the mouse coordinates.
   
2. **Hover Zone (Tilt & Depth):**
   - When the cursor is directly over the image, the image pops out forward along the Z-axis (Depth/Scale).
   - The image tilts (rotates across X and Y axes) relative to the normalized local mouse coordinates (-1 to 1). 
   - A subtle lighting or specular effect might optionally be placed later to enhance the tilt visibility, though simple rotation will provide the immediate 3D feel.

## Technical Architecture & Mathematical Approach
Instead of adding heavy physics libraries or large 3D dependencies, we will rely directly on Three.js primitives and Math utilities inside the existing `GalleryPlane.tsx` component.

- **Component:** `src/components/Three/GalleryPlane.tsx`
- **State Reading:** Uses the global `@react-three/fiber` `useThree` hook to obtain `state.pointer` (normalized mouse coordinates) and view port dimensions.
- **Raycasting/Bounds Calculation:** Converting normalized pointer coordinates into world space, we find the distance between the mouse ray and the mesh's center. 
- **Interpolation (Lerp):** All movements (position, scale, rotation) will be wrapped in `THREE.MathUtils.lerp(current, target, factor)` within the `useFrame` loop. This guarantees butter-smooth transitions indistinguishable from spring-based physics libraries, while keeping the bundle size zero.

## Performance Considerations
- Calculations should ideally only be mathematically heavy if the item is currently visible in the viewport (or we use simple checks to reject distant images quickly).
- Given the lightweight nature of coordinate lerping, evaluating this over 20-30 planes per frame will stay well within performance budgets on modern devices, easily holding 60fps.

## Fallback & Mobile Strategy
- Since this relies on a precise pointer (mouse), touch devices will ignore the hover logic. On mobile configurations (`!isMobile`), the default GSAP scrolling logic will remain undisturbed.

## Next Steps
Proceeding to the implementation plan via the `writing-plans` skill.
