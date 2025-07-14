// Canvas Drawing Module - Main file
// This file loads all the canvas drawing sub-modules in the correct order

// The canvas drawing functionality has been split into three modules for better maintainability:
// 1. canvas-drawing-core.js - Core functions and coordinate calculations
// 2. canvas-drawing-patterns.js - Pattern drawing with half-drop support
// 3. canvas-drawing-sections.js - Section 1 and Section 2 drawing functions

// All functions are loaded into the global scope from the individual modules
console.log('📐 Canvas drawing module loaded - functions available globally');

// Main canvas drawing function - defined here after all modules are loaded
function drawPreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate reference coordinates
    const referenceCoords = calculateReferenceCoordinates();
    
    // Section 1: Complete view with half-drop support and bottom anchoring
    drawCompleteViewWithOverlay(ctx, referenceCoords);
    
    // Section 2: Wall only view
    drawWallOnlyView(ctx, referenceCoords);
}

// Export to global scope
window.drawPreview = drawPreview;

// Verify that all required functions are available - FIXED: Run after page load
function verifyCanvasDrawingFunctions() {
    const requiredFunctions = [
        'calculateReferenceCoordinates',
        'drawOverageOverlay', 
        'drawPreview',
        'calculateHalfDropVisualOffset',
        'drawPatternInArea',
        'drawCompleteViewWithOverlay',
        'drawWallOnlyView'
    ];
    
    const missingFunctions = requiredFunctions.filter(fn => typeof window[fn] !== 'function');
    
    if (missingFunctions.length > 0) {
        console.error('❌ Missing canvas drawing functions:', missingFunctions);
        
        // Try to wait a bit more and check again
        setTimeout(() => {
            const stillMissing = requiredFunctions.filter(fn => typeof window[fn] !== 'function');
            if (stillMissing.length > 0) {
                console.error('❌ Still missing canvas drawing functions after delay:', stillMissing);
            } else {
                console.log('✅ All canvas drawing functions loaded successfully (after delay)');
            }
        }, 500);
    } else {
        console.log('✅ All canvas drawing functions loaded successfully');
    }
}

// FIXED: Run verification after DOM is fully loaded and all scripts have executed
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Add a small delay to ensure all modules have finished executing
        setTimeout(verifyCanvasDrawingFunctions, 100);
    });
} else {
    // DOM already loaded
    setTimeout(verifyCanvasDrawingFunctions, 100);
}
