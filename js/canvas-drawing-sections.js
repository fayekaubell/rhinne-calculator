// Canvas Drawing Sections Module - Section 1 and Section 2 drawing
// Part 3 of modularized canvas drawing system
// UPDATED: Removed red limitation overlays, panels now anchor to bottom of wall

// Draw Complete View - pattern + overlay + annotations - UPDATED FOR HALF-DROP
function drawCompleteViewWithOverlay(ctx, referenceCoords) {
    const { pattern, calculations } = currentPreview;
    const { scale, section1, dimensions } = referenceCoords;
    
    const offsetX = section1.patternStartX;
    const offsetY = section1.patternStartY;
    const scaledTotalWidth = dimensions.scaledTotalWidth;
    const scaledTotalHeight = dimensions.scaledTotalHeight;
    const scaledWallWidth = dimensions.scaledWallWidth;
    const scaledWallHeight = dimensions.scaledWallHeight;
    const wallOffsetX = section1.wallStartX;
    const wallOffsetY = section1.wallStartY;
    
    // Check if this is a half-drop pattern
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    
    // Step 1: Draw pattern for each panel/strip individually with half-drop offset
    if (imageLoaded && patternImage) {
        ctx.globalAlpha = 1.0;
        
        for (let i = 0; i < calculations.panelsNeeded; i++) {
            const panelX = offsetX + (i * pattern.panelWidth * scale);
            const panelWidth = pattern.panelWidth * scale;
            
            // Calculate visual offset for this panel
            const halfDropOffset = isHalfDrop ? calculateHalfDropVisualOffset(pattern, i) * scale : 0;
            
            // For all patterns, maintain consistent height
            let panelHeight = scaledTotalHeight;
            
            // Draw pattern for this specific panel
            // For patterns that repeat within the strip width, don't offset the strip position
            drawPatternInArea(ctx, panelX, offsetY, panelWidth, panelHeight, referenceCoords, false, i);
        }
    }
    
    // Step 2: Draw semi-transparent overlay on overage areas (dims them to 50%)
    drawOverageOverlay(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight,
                      wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Step 3: REMOVED - No more red limitation overlays
    
    // Step 4: Draw outlines and annotations with half-drop adjustments
    drawCompleteViewOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                           scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale, isHalfDrop);
    
    drawCompleteDimensionLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                              scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    drawPanelLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale);
}

// Draw outlines for complete view - UPDATED FOR HALF-DROP
function drawCompleteViewOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                                scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale, isHalfDrop) {
    const { pattern, calculations } = currentPreview;
    
    // Wall outline (thick, prominent)
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Panel outlines with half-drop offset
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    
    for (let i = 0; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        const width = pattern.panelWidth * scale;
        
        // All strips have the same height and position
        ctx.strokeRect(x, offsetY, width, scaledTotalHeight);
    }
    
    // Dashed lines between panels (subtle)
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    for (let i = 1; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        
        // Simple straight lines between panels
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + scaledTotalHeight);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

// Draw all dimension labels for complete view
function drawCompleteDimensionLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                                   scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale) {
    const { pattern, calculations } = currentPreview;
    
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Panel dimensions formatting
    const panelWidthFeet = Math.floor(pattern.panelWidth / 12);
    const panelWidthInches = Math.round(pattern.panelWidth % 12);
    const panelWidthDisplay = panelWidthInches > 0 ? 
        `${panelWidthFeet}'-${panelWidthInches}"` : `${panelWidthFeet}'`;
    
    // Individual panel width annotation
    if (calculations.panelsNeeded > 0) {
        const panelStartX = offsetX;
        const panelEndX = offsetX + (pattern.panelWidth * scale);
        const labelY = offsetY - 50;
        
        ctx.beginPath();
        ctx.moveTo(panelStartX, labelY);
        ctx.lineTo(panelEndX, labelY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(panelStartX, labelY - 5);
        ctx.lineTo(panelStartX, labelY + 5);
        ctx.moveTo(panelEndX, labelY - 5);
        ctx.lineTo(panelEndX, labelY + 5);
        ctx.stroke();
        
        const labelText = pattern.saleType === 'yard' ? 
            `Strip Width: ${panelWidthDisplay}` : 
            `Panel Width: ${panelWidthDisplay}`;
        ctx.fillText(labelText, (panelStartX + panelEndX) / 2, labelY - 8);
    }
    
    // Total panels width annotation
    const totalWidthFeet = Math.floor(calculations.totalWidth / 12);
    const totalWidthInches = Math.round(calculations.totalWidth % 12);
    const totalWidthDisplay = totalWidthInches > 0 ? 
        `${totalWidthFeet}'-${totalWidthInches}"` : `${totalWidthFeet}'`;
    
    const totalLabelY = offsetY - 80;
    
    ctx.beginPath();
    ctx.moveTo(offsetX, totalLabelY);
    ctx.lineTo(offsetX + scaledTotalWidth, totalLabelY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(offsetX, totalLabelY - 5);
    ctx.lineTo(offsetX, totalLabelY + 5);
    ctx.moveTo(offsetX + scaledTotalWidth, totalLabelY - 5);
    ctx.lineTo(offsetX + scaledTotalWidth, totalLabelY + 5);
    ctx.stroke();
    
    const totalLabelText = pattern.saleType === 'yard' ? 
        `All Strips: ${totalWidthDisplay}` : 
        `All Panels: ${totalWidthDisplay}`;
    ctx.fillText(totalLabelText, offsetX + scaledTotalWidth / 2, totalLabelY - 8);
    
    // Panel height annotation
    const panelHeightLineX = offsetX - 30;
    const panelHeightTextX = panelHeightLineX - 15;
    
    ctx.beginPath();
    ctx.moveTo(panelHeightLineX, offsetY);
    ctx.lineTo(panelHeightLineX, offsetY + scaledTotalHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(panelHeightLineX - 5, offsetY);
    ctx.lineTo(panelHeightLineX + 5, offsetY);
    ctx.moveTo(panelHeightLineX - 5, offsetY + scaledTotalHeight);
    ctx.lineTo(panelHeightLineX + 5, offsetY + scaledTotalHeight);
    ctx.stroke();
    
    ctx.save();
    ctx.translate(panelHeightTextX, offsetY + scaledTotalHeight / 2);
    ctx.rotate(-Math.PI/2);
    
    let heightDisplay;
    if (pattern.saleType === 'yard' && calculations.panelLengthInches !== undefined && calculations.panelLengthInches > 0) {
        heightDisplay = `Strip Height: ${calculations.panelLength}'-${calculations.panelLengthInches}"`;
    } else if (pattern.saleType === 'yard') {
        heightDisplay = `Strip Height: ${calculations.panelLength}'`;
    } else {
        heightDisplay = `Panel Height: ${calculations.panelLength}'`;
    }
    
    ctx.fillText(heightDisplay, 0, 0);
    ctx.restore();
}

// Draw panel labels (A/B/C sequence)
function drawPanelLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale) {
    const { pattern, calculations } = currentPreview;
    
    if (pattern.saleType === 'panel' && pattern.sequenceLength > 1) {
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < calculations.panelsNeeded; i++) {
            const centerX = offsetX + (i * pattern.panelWidth + pattern.panelWidth / 2) * scale;
            const sequencePosition = i % pattern.sequenceLength;
            const labelText = pattern.panelSequence[sequencePosition];
            const textY = offsetY - 25;
            
            ctx.fillText(labelText, centerX, textY);
        }
    }
}

// Draw Wall Only View with perfect pattern alignment - UPDATED: Removed red overlays
function drawWallOnlyView(ctx, referenceCoords) {
    const { pattern, wallWidth, wallHeight, calculations, wallWidthFeet, wallWidthInches, wallHeightFeet, wallHeightInches } = currentPreview;
    const { section2, dimensions } = referenceCoords;
    
    const wallOffsetX = section2.wallStartX;
    const wallOffsetY = section2.wallStartY;
    const scaledWallWidth = dimensions.scaledWallWidth;
    const scaledWallHeight = dimensions.scaledWallHeight;
    
    // Draw pattern using the same coordinate system as Section 1
    if (imageLoaded && patternImage) {
        drawPatternInArea(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, referenceCoords, true);
    }
    
    // REMOVED: No more red uncovered area drawing
    
    // Draw wall outline
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Draw wall dimensions
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial, sans-serif';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Format the dimension text - using the correct variable names
    const wallWidthText = wallWidthInches > 0 ? 
        `Wall Width: ${wallWidthFeet}'-${wallWidthInches}"` : `Wall Width: ${wallWidthFeet}'`;
    const wallHeightText = wallHeightInches > 0 ? 
        `Wall Height: ${wallHeightFeet}'-${wallHeightInches}"` : `Wall Height: ${wallHeightFeet}'`;
    
    // Wall width annotation (bottom of wall)
    const widthLineY = wallOffsetY + scaledWallHeight + 30;
    const widthTextY = widthLineY + 15;
    
    ctx.beginPath();
    ctx.moveTo(wallOffsetX, widthLineY);
    ctx.lineTo(wallOffsetX + scaledWallWidth, widthLineY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(wallOffsetX, widthLineY - 5);
    ctx.lineTo(wallOffsetX, widthLineY + 5);
    ctx.moveTo(wallOffsetX + scaledWallWidth, widthLineY - 5);
    ctx.lineTo(wallOffsetX + scaledWallWidth, widthLineY + 5);
    ctx.stroke();
    
    ctx.textAlign = 'center';
    ctx.fillText(wallWidthText, wallOffsetX + scaledWallWidth / 2, widthTextY);
    
    // Wall height annotation (left side of wall)
    const wallHeightOffset = 30;
    const heightLineX = wallOffsetX - wallHeightOffset;
    const heightTextX = heightLineX - 15;
    
    ctx.beginPath();
    ctx.moveTo(heightLineX, wallOffsetY);
    ctx.lineTo(heightLineX, wallOffsetY + scaledWallHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(heightLineX - 5, wallOffsetY);
    ctx.lineTo(heightLineX + 5, wallOffsetY);
    ctx.moveTo(heightLineX - 5, wallOffsetY + scaledWallHeight);
    ctx.lineTo(heightLineX + 5, wallOffsetY + scaledWallHeight);
    ctx.stroke();
    
    ctx.save();
    ctx.translate(heightTextX, wallOffsetY + scaledWallHeight / 2);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign = 'center';
    ctx.fillText(wallHeightText, 0, 0);
    ctx.restore();
}
