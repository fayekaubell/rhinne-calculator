// Canvas Drawing Core Module - Core functions and coordinate calculations
// UPDATED: Panel anchoring - panels now anchor to bottom of wall

// Calculate the reference coordinate system for consistent pattern positioning
function calculateReferenceCoordinates() {
    const canvas = document.getElementById('previewCanvas');
    const { wallWidth, wallHeight, calculations, pattern } = currentPreview;
    
    // Use the same layout constants as the main drawing function
    const leftMargin = 120;
    const rightMargin = 120;
    const topMargin = 140;
    const bottomMargin = 120;
    const sectionGap = 60;
    
    const maxWidth = canvas.width - leftMargin - rightMargin;
    const maxHeight = canvas.height - topMargin - bottomMargin;
    
    // Determine if we should use bottom-anchoring
    const shouldBottomAnchor = pattern.saleType === 'panel' && 
                               wallHeight + pattern.minOverage > calculations.panelLength * 12;
    
    // Calculate dimensions for both sections - ensuring pattern alignment
    const wallOnlyHeight = wallHeight;
    
    // For Section 1, use the appropriate height based on anchoring
    let completeViewHeight = calculations.totalHeight;
    if (calculations.stripLengths && calculations.stripLengths.length > 0) {
        // Use the maximum strip length for layout calculation
        const maxStripLength = Math.max(...calculations.stripLengths);
        completeViewHeight = maxStripLength;
    }
    
    // For normal cases, ensure we show enough height to include wall + overage
    if (!shouldBottomAnchor) {
        completeViewHeight = Math.max(completeViewHeight, wallHeight + pattern.minOverage);
    }
    
    const totalContentHeight = completeViewHeight + wallOnlyHeight + sectionGap;
    
    const effectiveWidth = Math.max(calculations.totalWidth, wallWidth);
    
    // Calculate scale
    const widthScale = maxWidth / effectiveWidth;
    const heightScale = maxHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    // Calculate vertical positioning
    const actualContentHeight = (completeViewHeight * scale) + (wallOnlyHeight * scale) + sectionGap;
    const section1StartY = topMargin + (maxHeight - actualContentHeight) / 2;
    
    // Pattern coverage area in Section 1
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    // Section 1 coordinates
    const section1OffsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    const section1OffsetY = section1StartY;
    
    // CONDITIONAL: Wall positioning based on whether we need bottom anchoring
    let section1WallOffsetX, section1WallOffsetY;
    
    if (shouldBottomAnchor) {
        // Bottom-anchored: Panel bottom aligns with wall bottom
        const panelBottomY = section1OffsetY + scaledTotalHeight;
        const wallBottomY = panelBottomY;
        const wallTopY = wallBottomY - scaledWallHeight;
        
        section1WallOffsetX = section1OffsetX + (scaledTotalWidth - scaledWallWidth) / 2;
        section1WallOffsetY = wallTopY;
        
        console.log('🔻 Using bottom-anchored positioning - panel too short for wall');
    } else {
        // Normal positioning: Wall centered within panel area with overage
        section1WallOffsetX = section1OffsetX + (scaledTotalWidth - scaledWallWidth) / 2;
        section1WallOffsetY = section1OffsetY + ((completeViewHeight * scale) - scaledWallHeight) / 2;
        
        console.log('📐 Using normal positioning - panel covers wall with overage');
    }
    
    // Section 2 coordinates
    const section2StartY = section1StartY + completeViewHeight * scale + sectionGap;
    const section2WallOffsetX = leftMargin + (maxWidth - scaledWallWidth) / 2;
    const section2WallOffsetY = section2StartY;
    
    return {
        scale,
        shouldBottomAnchor,
        section1: {
            patternStartX: section1OffsetX,
            patternStartY: section1OffsetY,
            wallStartX: section1WallOffsetX,
            wallStartY: section1WallOffsetY
        },
        section2: {
            wallStartX: section2WallOffsetX,
            wallStartY: section2WallOffsetY
        },
        dimensions: {
            scaledTotalWidth,
            scaledTotalHeight,
            scaledWallWidth,
            scaledWallHeight
        }
    };
}

// Draw overage overlay rectangles to dim non-wall areas
function drawOverageOverlay(ctx, panelStartX, panelStartY, panelTotalWidth, panelTotalHeight, 
                           wallStartX, wallStartY, wallWidth, wallHeight) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // 50% white overlay to dim
    
    // Left overage
    if (wallStartX > panelStartX) {
        const overageWidth = wallStartX - panelStartX;
        ctx.fillRect(panelStartX, panelStartY, overageWidth, panelTotalHeight);
    }
    
    // Right overage
    if (wallStartX + wallWidth < panelStartX + panelTotalWidth) {
        const overageStartX = wallStartX + wallWidth;
        const overageWidth = (panelStartX + panelTotalWidth) - overageStartX;
        ctx.fillRect(overageStartX, panelStartY, overageWidth, panelTotalHeight);
    }
    
    // Top overage - show if panel extends above wall
    if (wallStartY > panelStartY) {
        const overageHeight = wallStartY - panelStartY;
        ctx.fillRect(wallStartX, panelStartY, wallWidth, overageHeight);
    }
    
    // Bottom overage - show if panel extends below wall
    if (wallStartY + wallHeight < panelStartY + panelTotalHeight) {
        const overageStartY = wallStartY + wallHeight;
        const overageHeight = (panelStartY + panelTotalHeight) - overageStartY;
        ctx.fillRect(wallStartX, overageStartY, wallWidth, overageHeight);
    }
}

// Helper function to get wall position within Section 1 for consistent non-repeating pattern alignment
function getWallPositionInSection1(referenceCoords) {
    const { wallHeight } = currentPreview;
    return {
        wallStartY: referenceCoords.section1.wallStartY,
        wallHeight: wallHeight
    };
}

// Export functions to global scope for use in other modules
window.calculateReferenceCoordinates = calculateReferenceCoordinates;
window.drawOverageOverlay = drawOverageOverlay;
window.getWallPositionInSection1 = getWallPositionInSection1;
