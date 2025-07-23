// Preview Module - Main orchestration with new tab high-res view
// UPDATED: Simplified warning logic - removed red overlay complexity
// UPDATED: Added Google Sheets logging integration
// UPDATED: Added product links functionality
// UPDATED: Changed titles, kept overage section, removed disclaimer
// UPDATED: Removed SKU from preview titles
// UPDATED: Added pattern description below title

// Generate preview function - main coordination logic
async function generatePreview() {
    try {
        console.log('🎨 Resetting preview state completely...');
        currentPreview = null;
        patternImage = null;
        imageLoaded = false;
        
        // Get DOM elements once at the top
        const previewSection = document.getElementById('previewSection');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const previewTitle = document.getElementById('previewTitle');
        
        if (previewSection) {
            previewSection.style.display = 'none';
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const patternId = getSelectedPattern();
        const widthFeet = parseInt(document.getElementById('widthFeet').value) || 0;
        const widthInches = parseFloat(document.getElementById('widthInches').value) || 0;
        const heightFeet = parseInt(document.getElementById('heightFeet').value) || 0;
        const heightInches = parseFloat(document.getElementById('heightInches').value) || 0;
        
        console.log('🎯 Generate preview called with:', { patternId, widthFeet, widthInches, heightFeet, heightInches });
        
        // Validation
        if (!patternId) {
            alert('Please select a wallpaper pattern');
            return;
        }
        
        if (widthFeet === 0 && widthInches === 0) {
            alert('Please enter wall width');
            return;
        }
        
        if (heightFeet === 0 && heightInches === 0) {
            alert('Please enter wall height');
            return;
        }
        
        const pattern = patterns[patternId];
        if (!pattern) {
            alert('Pattern not found: ' + patternId);
            return;
        }
        
        const wallWidth = (widthFeet * 12) + widthInches;
        const wallHeight = (heightFeet * 12) + heightInches;
        
        console.log('🔢 Calculating requirements for:', { wallWidth, wallHeight });
        const calculations = calculatePanelRequirements(pattern, wallWidth, wallHeight);
        
        // UPDATED: Simplified special case checking
        let showWarning = false;
        let warningMessage = '';
        
        if (pattern.saleType === 'panel') {
            const maxAvailableLength = Math.max(...pattern.availableLengths);
            const totalHeightNeeded = wallHeight + pattern.minOverage;
            
            if (!pattern.hasRepeatHeight && calculations.panelLength === maxAvailableLength && totalHeightNeeded > (maxAvailableLength * 12)) {
                // Non-repeating pattern that doesn't cover the full wall height
                showWarning = true;
                warningMessage = CONFIG.ui.text.disclaimers.noRepeatHeight;
            } else if (totalHeightNeeded > (CONFIG.calculator.limits.maxPanelHeight * 12)) {
                // Wall exceeds the general height limit
                showWarning = true;
                warningMessage = CONFIG.ui.text.disclaimers.panelLimit;
            }
        }
        
        const formattedWidth = widthInches > 0 ? `${widthFeet}'${widthInches}"` : `${widthFeet}'`;
        const formattedHeight = heightInches > 0 ? `${heightFeet}'${heightInches}"` : `${heightFeet}'`;
        
        // Set up currentPreview object for use by other modules
        currentPreview = {
            pattern,
            wallWidth,
            wallHeight,
            calculations,
            wallWidthFeet: widthFeet,
            wallWidthInches: widthInches,
            wallHeightFeet: heightFeet,
            wallHeightInches: heightInches,
            formattedWidth: formattedWidth,
            formattedHeight: formattedHeight
        };
        
        // UPDATED: Preview title without SKU
        if (previewTitle) {
            previewTitle.textContent = `${pattern.name}: ${formattedWidth}w x ${formattedHeight}h Wall`;
        }
        
        // Add product links after setting the preview title
        addProductLinksToPreview();
        
        // UPDATED: Add pattern description after product links
        addPatternDescriptionToPreview();
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        if (previewSection) {
            previewSection.style.display = 'block';
            previewSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        console.log('🖼️ Preloading image:', pattern.imageUrl);
        await preloadPatternImage(pattern);
        
        // Update the preview info section
        updatePreviewInfo();
        
        // Draw the canvas preview (function now in canvas-drawing.js)
        drawPreview();
        
        // UPDATED: Simplified warning display with explicit red styling
        const warningElement = document.getElementById('panelLimitWarning');
        if (warningElement) {
            if (showWarning) {
                warningElement.innerHTML = `<p><em>${warningMessage}</em></p>`;
                warningElement.style.display = 'block';
                warningElement.style.color = '#dc3545';
                warningElement.style.backgroundColor = '#f8d7da';
                warningElement.style.border = '1px solid #f5c6cb';
                warningElement.style.borderRadius = '8px';
                warningElement.style.padding = '15px';
                warningElement.style.margin = '15px 0';
                warningElement.style.fontWeight = '600';
            } else {
                warningElement.style.display = 'none';
            }
        }
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // Add click handler for canvas high-res view in new tab
        const canvas = document.getElementById('previewCanvas');
        canvas.style.cursor = 'zoom-in';
        canvas.onclick = openHighResInNewTab;
        canvas.title = 'Click to open high-resolution view in new tab';
        
        // LOGGING: Dispatch logging event for preview generation
        if (typeof window.dispatchPreviewGenerated === 'function') {
            setTimeout(() => {
                window.dispatchPreviewGenerated({
                    patternName: pattern.name,
                    patternSku: pattern.sku,
                    wallDimensions: `${formattedWidth} x ${formattedHeight}`,
                    calculationsData: calculations,
                    timestamp: new Date().toISOString()
                });
            }, 200); // Small delay to ensure preview is fully rendered
        }
        
        console.log('✅ Preview generation complete with logging enabled');
        
    } catch (error) {
        console.error('❌ Error in generatePreview:', error);
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        alert('An error occurred: ' + error.message);
    }
}

// NEW: Add pattern description to preview section
function addPatternDescriptionToPreview() {
    if (!currentPreview || !currentPreview.pattern) {
        console.warn('No current preview data available for pattern description');
        return;
    }
    
    const { pattern } = currentPreview;
    
    // Find the title container
    const titleContainer = document.querySelector('.title-container');
    if (!titleContainer) {
        console.warn('Title container not found for pattern description');
        return;
    }
    
    // Remove any existing pattern description
    const existingDescription = titleContainer.querySelector('.pattern-description');
    if (existingDescription) {
        existingDescription.remove();
    }
    
    // Check if pattern has a description
    if (!pattern.description || !pattern.description.trim()) {
        console.log('ℹ️ No description available for this pattern');
        return;
    }
    
    // Create pattern description container
    const descriptionContainer = document.createElement('div');
    descriptionContainer.className = 'pattern-description';
    descriptionContainer.style.cssText = `
        text-align: center;
        margin: 20px auto;
        max-width: 600px;
        padding: 0 20px;
    `;
    
    // Create description paragraph with disclaimer styling
    const descriptionParagraph = document.createElement('p');
    descriptionParagraph.className = 'pattern-description-text';
    descriptionParagraph.textContent = pattern.description.trim();
    descriptionParagraph.style.cssText = `
        margin: 0;
        font-style: italic;
        opacity: 0.8;
        font-weight: 400;
        line-height: 1.6;
        font-family: var(--font-body-family, Georgia, "Times New Roman", Times, serif);
        font-size: calc(1rem * var(--font-body-scale, 1));
        color: var(--color-text, #333333);
    `;
    
    descriptionContainer.appendChild(descriptionParagraph);
    
    // Insert the description after the title and product links
    // Find the best insertion point (after product links if they exist, otherwise after title)
    const productLinks = titleContainer.querySelector('.product-links');
    const titleH2 = titleContainer.querySelector('h2');
    
    if (productLinks) {
        // Insert after product links
        productLinks.insertAdjacentElement('afterend', descriptionContainer);
    } else if (titleH2) {
        // Insert after title
        titleH2.insertAdjacentElement('afterend', descriptionContainer);
    } else {
        // Fallback: append to title container
        titleContainer.appendChild(descriptionContainer);
    }
    
    console.log('✅ Pattern description added to preview interface');
    
    // Trigger auto-resize after adding description
    setTimeout(() => {
        if (window.autoResize) window.autoResize.updateHeight();
    }, 100);
}

// NEW: Add product links to preview section
function addProductLinksToPreview() {
    if (!currentPreview || !currentPreview.pattern) {
        console.warn('No current preview data available for product links');
        return;
    }
    
    const { pattern } = currentPreview;
    
    // Find or create the container for product links
    const titleContainer = document.querySelector('.title-container');
    if (!titleContainer) {
        console.warn('Title container not found for product links');
        return;
    }
    
    // Remove any existing product links
    const existingLinks = titleContainer.querySelector('.product-links');
    if (existingLinks) {
        existingLinks.remove();
    }
    
    // Create product links container
    const linksContainer = document.createElement('div');
    linksContainer.className = 'product-links';
    linksContainer.style.cssText = `
        text-align: center;
        margin-top: 20px;
        margin-bottom: 10px;
        font-family: var(--font-heading-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
        font-weight: var(--font-heading-weight, 600);
        font-style: var(--font-heading-style, normal);
        line-height: 1.5;
    `;
    
    let hasAnyLinks = false;
    
    // Check and add product tearsheet link
    if (pattern.product_tearsheet_url && pattern.product_tearsheet_url.trim()) {
        const tearsheetLink = document.createElement('a');
        tearsheetLink.href = pattern.product_tearsheet_url.trim();
        tearsheetLink.target = '_blank';
        tearsheetLink.rel = 'noopener noreferrer';
        tearsheetLink.textContent = 'Product Tearsheet >';
        tearsheetLink.style.cssText = `
            display: block;
            color: var(--color-text, #333333);
            text-decoration: none;
            font-size: calc(1rem * var(--font-heading-scale, 1));
            margin-bottom: 8px;
            transition: opacity 0.3s ease;
        `;
        
        // Add hover effect
        tearsheetLink.addEventListener('mouseenter', function() {
            this.style.opacity = '0.7';
        });
        tearsheetLink.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
        
        linksContainer.appendChild(tearsheetLink);
        hasAnyLinks = true;
        console.log('✅ Added product tearsheet link');
    }
    
    // Check and add product page link
    if (pattern.product_page_url && pattern.product_page_url.trim()) {
        const pageLink = document.createElement('a');
        pageLink.href = pattern.product_page_url.trim();
        pageLink.target = '_blank';
        pageLink.rel = 'noopener noreferrer';
        pageLink.textContent = 'Product Page >';
        pageLink.style.cssText = `
            display: block;
            color: var(--color-text, #333333);
            text-decoration: none;
            font-size: calc(1rem * var(--font-heading-scale, 1));
            margin-bottom: 8px;
            transition: opacity 0.3s ease;
        `;
        
        // Add hover effect
        pageLink.addEventListener('mouseenter', function() {
            this.style.opacity = '0.7';
        });
        pageLink.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
        
        linksContainer.appendChild(pageLink);
        hasAnyLinks = true;
        console.log('✅ Added product page link');
    }
    
    // Check and add 360 view link
    if (pattern.product_360_url && pattern.product_360_url.trim()) {
        const view360Link = document.createElement('a');
        view360Link.href = pattern.product_360_url.trim();
        view360Link.target = '_blank';
        view360Link.rel = 'noopener noreferrer';
        view360Link.textContent = '360 View >';
        view360Link.style.cssText = `
            display: block;
            color: var(--color-text, #333333);
            text-decoration: none;
            font-size: calc(1rem * var(--font-heading-scale, 1));
            margin-bottom: 8px;
            transition: opacity 0.3s ease;
        `;
        
        // Add hover effect
        view360Link.addEventListener('mouseenter', function() {
            this.style.opacity = '0.7';
        });
        view360Link.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
        
        linksContainer.appendChild(view360Link);
        hasAnyLinks = true;
        console.log('✅ Added 360 view link');
    }
    
    // Only add the container if we have links
    if (hasAnyLinks) {
        titleContainer.appendChild(linksContainer);
        console.log('✅ Product links added to preview interface');
        
        // Trigger auto-resize after adding links
        setTimeout(() => {
            if (window.autoResize) window.autoResize.updateHeight();
        }, 100);
    } else {
        console.log('ℹ️ No product links available for this pattern');
    }
}

// UPDATED: Update preview info display - handles the order quantities section with new titles
function updatePreviewInfo() {
    const { calculations } = currentPreview;
    
    const orderQuantity = document.getElementById('orderQuantity');
    const orderQuantityWithOverage = document.getElementById('orderQuantityWithOverage');
    const yardagePerPanel = document.getElementById('yardagePerPanel');
    const totalYardage = document.getElementById('totalYardage');
    const yardagePerPanelOverage = document.getElementById('yardagePerPanelOverage');
    const totalYardageOverage = document.getElementById('totalYardageOverage');
    
    // UPDATED: Update section headers with new titles via JavaScript
    const orderSections = document.querySelectorAll('.order-section h3');
    if (orderSections.length >= 1) {
        orderSections[0].textContent = 'Minimum Yardage Needed (no excess included) =';
    }
    if (orderSections.length >= 2) {
        orderSections[1].textContent = 'It is standard to order 20% excess to address any installation issues =';
    }
    
    // Show all elements and their parent containers
    const overageElements = [
        orderQuantityWithOverage,
        yardagePerPanelOverage,
        totalYardageOverage
    ];
    
    overageElements.forEach(element => {
        if (element) {
            const parentElement = element.parentElement;
            if (parentElement) {
                parentElement.style.display = 'block';
            }
        }
    });
    
    // Show the overage section and dividers
    const orderSectionsDiv = document.querySelectorAll('.order-section');
    if (orderSectionsDiv.length > 1) {
        // Show the second order section (overage section)
        orderSectionsDiv[1].style.display = 'block';
    }
    
    // Show any dividers between sections
    const dividers = document.querySelectorAll('.divider');
    dividers.forEach(divider => {
        divider.style.display = 'block';
    });
    
    if (calculations.saleType === 'yard') {
        // Yard-based display
        const totalYardageValue = calculations.totalYardage;
        const overageTotalYardage = Math.ceil(totalYardageValue * 1.2);
        
        if (orderQuantity) {
            orderQuantity.textContent = `Total yardage: ${totalYardageValue} yds`;
        }
        
        // Hide panel-specific lines for yard patterns
        const yardagePerPanelEl = yardagePerPanel ? yardagePerPanel.parentElement : null;
        const totalYardageEl = totalYardage ? totalYardage.parentElement : null;
        if (yardagePerPanelEl) yardagePerPanelEl.style.display = 'none';
        if (totalYardageEl) totalYardageEl.style.display = 'none';
        
        if (orderQuantityWithOverage) {
            orderQuantityWithOverage.textContent = `Total yardage: ${overageTotalYardage} yds`;
        }
        
        const yardagePerPanelOverageEl = yardagePerPanelOverage ? yardagePerPanelOverage.parentElement : null;
        const totalYardageOverageEl = totalYardageOverage ? totalYardageOverage.parentElement : null;
        if (yardagePerPanelOverageEl) yardagePerPanelOverageEl.style.display = 'none';
        if (totalYardageOverageEl) totalYardageOverageEl.style.display = 'none';
    } else {
        // Panel-based display - UPDATED: Simplified, no more complex length calculations
        const panelLength = calculations.panelLength;
        const yardagePerPanelValue = Math.round(panelLength / 3);
        const totalYardageValue = calculations.panelsNeeded * yardagePerPanelValue;
        const overagePanels = Math.ceil(calculations.panelsNeeded * 1.2);
        const overageTotalYardage = overagePanels * yardagePerPanelValue;
        
        if (orderQuantity) {
            orderQuantity.textContent = `[x${calculations.panelsNeeded}] ${panelLength}' Panels`;
        }
        
        // Show panel-specific lines for panel patterns
        const yardagePerPanelEl = yardagePerPanel ? yardagePerPanel.parentElement : null;
        const totalYardageEl = totalYardage ? totalYardage.parentElement : null;
        if (yardagePerPanelEl) yardagePerPanelEl.style.display = 'block';
        if (totalYardageEl) totalYardageEl.style.display = 'block';
        
        if (yardagePerPanel) {
            yardagePerPanel.textContent = `${yardagePerPanelValue} yds`;
        }
        if (totalYardage) {
            totalYardage.textContent = `${totalYardageValue} yds`;
        }
        
        if (orderQuantityWithOverage) {
            orderQuantityWithOverage.textContent = `[x${overagePanels}] ${panelLength}' Panels`;
        }
        
        const yardagePerPanelOverageEl = yardagePerPanelOverage ? yardagePerPanelOverage.parentElement : null;
        const totalYardageOverageEl = totalYardageOverage ? totalYardageOverage.parentElement : null;
        if (yardagePerPanelOverageEl) yardagePerPanelOverageEl.style.display = 'block';
        if (totalYardageOverageEl) totalYardageOverageEl.style.display = 'block';
        
        if (yardagePerPanelOverage) {
            yardagePerPanelOverage.textContent = `${yardagePerPanelValue} yds`;
        }
        if (totalYardageOverage) {
            totalYardageOverage.textContent = `${overageTotalYardage} yds`;
        }
    }
}

// NEW: Open high-resolution preview in new tab using existing PDF generation code
async function openHighResInNewTab() {
    if (!currentPreview) {
        console.error('No current preview data available for high-res rendering');
        alert('Please generate a preview first');
        return;
    }
    
    try {
        console.log('🔍 Generating high-resolution preview for new tab...');
        
        // Show loading cursor
        const canvas = document.getElementById('previewCanvas');
        const originalCursor = canvas.style.cursor;
        canvas.style.cursor = 'wait';
        canvas.title = 'Generating high-resolution view...';
        
        // Generate high-resolution canvas using existing PDF generation code
        // Ultra high resolution: 4K+ for maximum sharpness and detail
        const targetWidth = 4800;  // 600 DPI equivalent for 8" width - much sharper
        const targetHeight = 3600; // 600 DPI equivalent for 6" height - much sharper
        
        console.log('📐 Generating canvas at:', targetWidth, 'x', targetHeight);
        
        // Reuse the existing generateHighResCanvas function from PDF generation
        const canvasDataUrl = await generateHighResCanvasForViewing(targetWidth, targetHeight);
        
        if (!canvasDataUrl) {
            throw new Error('Failed to generate high-resolution canvas');
        }
        
        // Create the content for the new tab (UPDATED: No SKU in title)
        const { pattern, formattedWidth, formattedHeight } = currentPreview;
        const title = `${pattern.name} - ${formattedWidth}w x ${formattedHeight}h`;
        
        // UPDATED: Generate product links HTML for the new tab
        const productLinksHtml = generateProductLinksHtml(pattern);
        
        // UPDATED: Generate pattern description HTML for the new tab
        const patternDescriptionHtml = generatePatternDescriptionHtml(pattern);
        
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: #1a1a1a;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 20px;
            overflow-x: auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            max-width: 90vw;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
            line-height: 1.3;
            word-break: break-word;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.8;
            margin-bottom: 15px;
        }
        
        .product-links {
            margin-bottom: 20px;
        }
        
        .product-links a {
            display: block;
            color: #ffffff;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            transition: opacity 0.3s ease;
        }
        
        .product-links a:hover {
            opacity: 0.7;
        }
        
        .pattern-description {
            margin-bottom: 30px;
            max-width: 600px;
            padding: 0 20px;
        }
        
        .pattern-description p {
            font-style: italic;
            opacity: 0.8;
            font-size: 16px;
            line-height: 1.6;
            color: #ffffff;
        }
        
        .image-container {
            max-width: 95vw;
            max-height: 80vh;
            overflow: auto;
            border: 2px solid #333;
            border-radius: 8px;
            background: white;
            padding: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        
        .preview-image {
            display: block;
            max-width: 100%;
            height: auto;
            cursor: zoom-in;
        }
        
        .preview-image.zoomed {
            cursor: zoom-out;
            max-width: none;
            width: auto;
            height: auto;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            opacity: 0.6;
            font-size: 14px;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 20px;
            }
            
            .btn {
                width: 200px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${pattern.name}</h1>
        <p>${formattedWidth}w x ${formattedHeight}h Wall</p>
        ${productLinksHtml}
        ${patternDescriptionHtml}
    </div>
    
    <div class="image-container">
        <img id="previewImage" class="preview-image" src="${canvasDataUrl}" alt="High-resolution wallpaper preview">
    </div>
    
    <div class="footer">
        <p>Generated by ${CONFIG.business.name} Wallpaper Calculator</p>
        <p>Right-click image to save • Click image to zoom • Z = zoom, D = download, Escape = close</p>
    </div>
    
    <script>
        let isZoomed = false;
        
        function toggleZoom() {
            const img = document.getElementById('previewImage');
            const container = img.parentElement;
            
            if (isZoomed) {
                // Zoom out - restore to fit container
                img.classList.remove('zoomed');
                container.style.overflow = 'auto';
                isZoomed = false;
            } else {
                // Zoom in - center on current visible area
                
                // Get current scroll position relative to container
                const containerRect = container.getBoundingClientRect();
                const currentScrollLeft = container.scrollLeft;
                const currentScrollTop = container.scrollTop;
                
                // Calculate the center point of the currently visible area
                const visibleCenterX = currentScrollLeft + (container.clientWidth / 2);
                const visibleCenterY = currentScrollTop + (container.clientHeight / 2);
                
                // Get current image dimensions (before zoom)
                const currentImgWidth = img.offsetWidth;
                const currentImgHeight = img.offsetHeight;
                
                // Calculate the relative position as percentage of current image
                const centerXPercent = visibleCenterX / currentImgWidth;
                const centerYPercent = visibleCenterY / currentImgHeight;
                
                // Apply zoom
                img.classList.add('zoomed');
                container.style.overflow = 'scroll';
                
                // Wait for the image to resize, then adjust scroll position
                setTimeout(() => {
                    // Get new image dimensions (after zoom)
                    const newImgWidth = img.offsetWidth;
                    const newImgHeight = img.offsetHeight;
                    
                    // Calculate where the center point is now located
                    const newCenterX = centerXPercent * newImgWidth;
                    const newCenterY = centerYPercent * newImgHeight;
                    
                    // Calculate new scroll position to keep the center point visible
                    const newScrollLeft = newCenterX - (container.clientWidth / 2);
                    const newScrollTop = newCenterY - (container.clientHeight / 2);
                    
                    // Apply the scroll position (browser will handle bounds automatically)
                    container.scrollLeft = Math.max(0, newScrollLeft);
                    container.scrollTop = Math.max(0, newScrollTop);
                    
                    console.log('🔍 Zoom centered on:', {
                        originalCenter: { x: visibleCenterX, y: visibleCenterY },
                        percentages: { x: centerXPercent, y: centerYPercent },
                        newCenter: { x: newCenterX, y: newCenterY },
                        newScroll: { left: newScrollLeft, top: newScrollTop }
                    });
                }, 50); // Small delay to ensure CSS changes are applied
                
                isZoomed = true;
            }
        }
        
        function downloadImage() {
            const link = document.createElement('a');
            link.download = '${pattern.name.replace(/[^a-zA-Z0-9]/g, '-')}-preview-${Date.now()}.png';
            link.href = '${canvasDataUrl}';
            link.click();
        }
        
        // Click image to zoom
        document.getElementById('previewImage').onclick = toggleZoom;
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                window.close();
            } else if (e.key === 'z' || e.key === 'Z') {
                toggleZoom();
            } else if (e.key === 'd' || e.key === 'D') {
                downloadImage();
            }
        });
        
        console.log('High-resolution wallpaper preview loaded');
        console.log('Keyboard shortcuts: Z = zoom, D = download, Escape = close');
    </script>
</body>
</html>`;
        
        // Open in new tab
        const newTab = window.open('', '_blank');
        if (!newTab) {
            // Popup blocked - fallback to download
            console.warn('Popup blocked, offering download instead');
            const link = document.createElement('a');
            link.download = `${pattern.name.replace(/[^a-zA-Z0-9]/g, '-')}-preview-${Date.now()}.png`;
            link.href = canvasDataUrl;
            link.click();
            
            alert('Popup blocked. High-resolution image has been downloaded instead.');
        } else {
            newTab.document.write(htmlContent);
            newTab.document.close();
            console.log('✅ High-resolution preview opened in new tab with product links and description');
        }
        
        // Restore canvas cursor and title
        canvas.style.cursor = originalCursor;
        canvas.title = 'Click to open high-resolution view in new tab';
        
    } catch (error) {
        console.error('❌ Error generating high-res preview:', error);
        
        // Restore canvas cursor
        const canvas = document.getElementById('previewCanvas');
        canvas.style.cursor = 'zoom-in';
        canvas.title = 'Click to open high-resolution view in new tab';
        
        alert('Error generating high-resolution preview: ' + error.message);
    }
}

// NEW: Generate product links HTML for the new tab view
function generateProductLinksHtml(pattern) {
    let linksHtml = '';
    
    // Check if we have any product links
    const hasTearsheet = pattern.product_tearsheet_url && pattern.product_tearsheet_url.trim();
    const hasProductPage = pattern.product_page_url && pattern.product_page_url.trim();
    const has360View = pattern.product_360_url && pattern.product_360_url.trim();
    
    if (hasTearsheet || hasProductPage || has360View) {
        linksHtml = '<div class="product-links">';
        
        if (hasTearsheet) {
            linksHtml += `<a href="${pattern.product_tearsheet_url.trim()}" target="_blank" rel="noopener noreferrer">Product Tearsheet ></a>`;
        }
        
        if (hasProductPage) {
            linksHtml += `<a href="${pattern.product_page_url.trim()}" target="_blank" rel="noopener noreferrer">Product Page ></a>`;
        }
        
        if (has360View) {
            linksHtml += `<a href="${pattern.product_360_url.trim()}" target="_blank" rel="noopener noreferrer">360 View ></a>`;
        }
        
        linksHtml += '</div>';
    }
    
    return linksHtml;
}

// NEW: Generate pattern description HTML for the new tab view
function generatePatternDescriptionHtml(pattern) {
    if (!pattern.description || !pattern.description.trim()) {
        return '';
    }
    
    return `<div class="pattern-description">
        <p>${pattern.description.trim()}</p>
    </div>`;
}

// Generate high-resolution canvas specifically for viewing (adapted from PDF generation)
async function generateHighResCanvasForViewing(targetWidth, targetHeight) {
    return new Promise((resolve) => {
        try {
            // Create high-resolution canvas
            const hiResCanvas = document.createElement('canvas');
            hiResCanvas.width = targetWidth;
            hiResCanvas.height = targetHeight;
            const hiResCtx = hiResCanvas.getContext('2d');
            
            // Enable high-quality rendering
            hiResCtx.imageSmoothingEnabled = true;
            hiResCtx.imageSmoothingQuality = 'high';
            
            // Calculate scale factor
            const originalCanvas = document.getElementById('previewCanvas');
            const scaleX = targetWidth / originalCanvas.width;
            const scaleY = targetHeight / originalCanvas.height;
            
            // Use the smaller scale to maintain aspect ratio
            const scale = Math.min(scaleX, scaleY);
            
            // Calculate centered position
            const scaledWidth = originalCanvas.width * scale;
            const scaledHeight = originalCanvas.height * scale;
            const offsetX = (targetWidth - scaledWidth) / 2;
            const offsetY = (targetHeight - scaledHeight) / 2;
            
            // Fill background
            hiResCtx.fillStyle = '#ffffff';
            hiResCtx.fillRect(0, 0, targetWidth, targetHeight);
            
            // Scale and render
            hiResCtx.save();
            hiResCtx.translate(offsetX, offsetY);
            hiResCtx.scale(scale, scale);
            
            // Render the preview using existing high-quality rendering from PDF module
            renderHighQualityPreviewForViewing(hiResCtx, originalCanvas.width, originalCanvas.height);
            
            hiResCtx.restore();
            
            // Convert to data URL with high quality
            const dataUrl = hiResCanvas.toDataURL('image/png', 1.0);
            resolve(dataUrl);
            
        } catch (error) {
            console.error('Error generating high-res canvas for viewing:', error);
            resolve(null);
        }
    });
}

// Render high-quality preview for viewing (reuses PDF rendering logic)
function renderHighQualityPreviewForViewing(ctx, canvasWidth, canvasHeight) {
    if (!currentPreview) return;
    
    // Temporarily override canvas reference for coordinate calculations
    const tempCanvas = { width: canvasWidth, height: canvasHeight };
    const originalGetElementById = document.getElementById;
    document.getElementById = function(id) {
        if (id === 'previewCanvas') return tempCanvas;
        return originalGetElementById.call(document, id);
    };
    
    try {
        // Calculate reference coordinates
        const referenceCoords = calculateReferenceCoordinates();
        
        // Draw both sections using existing canvas drawing functions
        drawCompleteViewWithOverlay(ctx, referenceCoords);
        drawWallOnlyView(ctx, referenceCoords);
        
    } finally {
        // Restore original function
        document.getElementById = originalGetElementById;
    }
}

// Make generatePreview globally accessible
window.generatePreview = generatePreview;
