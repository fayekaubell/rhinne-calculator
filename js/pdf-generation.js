// Enhanced PDF Generation Module - Uses sequential preview numbers from Google Sheets
// Requires jsPDF library to be loaded
// UPDATED: Improved text formatting with centered alignment and consistent sizing

// PDF generation function with sequential preview numbers
async function generatePDF() {
    if (!currentPreview) {
        alert('Please generate a preview first before downloading PDF');
        return;
    }

    const downloadBtn = document.getElementById('downloadPdfBtn');
    
    try {
        console.log('🎨 Starting enhanced PDF generation with sequential numbering...');
        
        // Show processing state immediately
        updateDownloadButtonState(downloadBtn, 'processing');
        
        // Force a small delay to ensure the processing state is visible
        await new Promise(resolve => setTimeout(resolve, 100));

        // PDF dimensions at 300 DPI
        const pdfWidth = 24; // inches (landscape)
        const pdfHeight = 18; // inches
        const dpi = 300;

        // Create jsPDF instance
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'in',
            format: [pdfWidth, pdfHeight]
        });

        // Enhanced layout dimensions - maintain 0.5" right margin
        const canvasMargin = 0.25;
        const textAreaWidth = 3.5; // Increased to maintain 0.5" margin on right (was 3.25)
        const canvasAreaWidth = pdfWidth - textAreaWidth - (canvasMargin * 2); // Adjusted
        const canvasAreaHeight = pdfHeight - (canvasMargin * 2); // 17.5" tall
        
        // Generate high-resolution canvas with processing feedback
        console.log('🖼️ Generating high-resolution canvas...');
        const canvasDataUrl = await generateHighResCanvas(canvasAreaWidth * dpi, canvasAreaHeight * dpi);
        
        if (canvasDataUrl) {
            console.log('📄 Adding canvas to PDF...');
            // Add canvas to PDF
            pdf.addImage(
                canvasDataUrl, 
                'PNG', 
                canvasMargin, 
                canvasMargin, 
                canvasAreaWidth, 
                canvasAreaHeight,
                undefined,
                'FAST'
            );
        }

        console.log('📝 Adding text content to PDF...');
        // Add enhanced text content to right side with vertical centering
        await addEnhancedTextContentToPDF(pdf, canvasAreaWidth + canvasMargin, canvasMargin, textAreaWidth, canvasAreaHeight);

        // UPDATED: Generate filename with sequential preview number
        const { pattern } = currentPreview;
        const sequentialNumber = getSequentialPreviewNumber();
        const filename = `Faye-Bell-Wallpaper-Preview-${pattern.sku}-${sequentialNumber}.pdf`;

        // LOGGING: Dispatch logging event for PDF download
        if (typeof window.dispatchPDFDownloaded === 'function') {
            setTimeout(() => {
                window.dispatchPDFDownloaded({
                    filename: filename,
                    patternName: pattern.name,
                    patternSku: pattern.sku,
                    wallDimensions: `${currentPreview.formattedWidth} x ${currentPreview.formattedHeight}`,
                    sequentialNumber: sequentialNumber,
                    generated: true,
                    timestamp: new Date().toISOString()
                });
            }, 100);
        }

        console.log('💾 Saving PDF with sequential numbering:', filename);
        // Save PDF
        pdf.save(filename);
        
        console.log('✅ Enhanced PDF generated successfully with sequential number:', filename);

        // Show success state with reset functionality
        updateDownloadButtonState(downloadBtn, 'success');

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);
        
        // Show error state
        updateDownloadButtonState(downloadBtn, 'error');
    }
}

// UPDATED: Get sequential preview number from various sources
function getSequentialPreviewNumber() {
    // Priority order for getting the sequential preview number:
    // 1. From currentPreview (set by logging system)
    // 2. From calculator logger
    // 3. Fallback to timestamp-based
    
    if (window.currentPreview?.sequentialPreviewNumber) {
        console.log('📊 Using sequential preview number from currentPreview:', window.currentPreview.sequentialPreviewNumber);
        return window.currentPreview.sequentialPreviewNumber;
    }
    
    if (window.calculatorLogger?.getPreviewNumber && window.calculatorLogger.getPreviewNumber() !== '00000') {
        const number = window.calculatorLogger.getPreviewNumber();
        console.log('📊 Using sequential preview number from logger:', number);
        return number;
    }
    
    // Fallback - generate timestamp-based number
    const fallback = Date.now().toString().slice(-5);
    console.log('⚠️ Using fallback preview number:', fallback);
    return fallback;
}

// Update download button state with different messages and styles
function updateDownloadButtonState(button, state) {
    if (!button) return;
    
    // Remove any existing state classes
    button.classList.remove('btn-processing', 'btn-success', 'btn-error');
    
    switch (state) {
        case 'processing':
            button.disabled = true;
            button.textContent = 'Processing download...';
            button.classList.add('btn-processing');
            button.onclick = null; // Disable click during processing
            break;
            
        case 'success':
            button.disabled = false; // Enable the button for reset functionality
            button.textContent = 'Successfully downloaded: Click here to reset';
            button.classList.add('btn-success');
            
            // Change click handler to reset function
            button.onclick = resetCalculator;
            break;
            
        case 'error':
            button.disabled = false;
            button.textContent = 'Download failed - Try again';
            button.classList.add('btn-error');
            
            // Restore original PDF generation function
            button.onclick = generatePDF;
            
            // Reset to normal state after 5 seconds for errors
            setTimeout(() => {
                updateDownloadButtonState(button, 'ready');
            }, 5000);
            break;
            
        case 'ready':
        default:
            button.disabled = false;
            button.textContent = 'Download PDF';
            button.onclick = generatePDF; // Restore original function
            break;
    }
}

// Generate high-resolution canvas for PDF
async function generateHighResCanvas(targetWidth, targetHeight) {
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
            
            // Render the preview using existing functions
            renderHighQualityPreviewForPDF(hiResCtx, originalCanvas.width, originalCanvas.height);
            
            hiResCtx.restore();
            
            // Convert to data URL
            const dataUrl = hiResCanvas.toDataURL('image/png', 1.0);
            resolve(dataUrl);
            
        } catch (error) {
            console.error('Error generating high-res canvas:', error);
            resolve(null);
        }
    });
}

// Render high-quality preview specifically for PDF
function renderHighQualityPreviewForPDF(ctx, canvasWidth, canvasHeight) {
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
        
        // Draw both sections
        drawCompleteViewWithOverlay(ctx, referenceCoords);
        drawWallOnlyView(ctx, referenceCoords);
        
    } finally {
        // Restore original function
        document.getElementById = originalGetElementById;
    }
}

// Load logo image for PDF
async function loadLogoForPDF() {
    return new Promise((resolve) => {
        const logoUrl = CONFIG.business.logoUrl;
        
        if (!logoUrl || !logoUrl.trim()) {
            console.log('No logo URL configured, skipping logo');
            resolve(null);
            return;
        }
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            console.log('✅ Logo loaded successfully for PDF');
            resolve(img);
        };
        
        img.onerror = function() {
            console.warn('⚠️ Failed to load logo for PDF, continuing without logo');
            resolve(null);
        };
        
        img.src = logoUrl;
    });
}

// Calculate total content height for vertical centering
function calculateTotalContentHeight(pdf, maxWidth) {
    const { pattern, calculations, formattedWidth, formattedHeight } = currentPreview;
    
    const lineHeight = 0.2; // Increased for better spacing to prevent overlap
    const sectionSpacing = 0.3;
    const headerHeight = 0.7; // Increased to account for extra spacing after logo
    
    let totalHeight = headerHeight; // Title area
    
    // Pattern details section - account for pattern name + SKU on separate lines
    let patternDetailsLines = 5; // Base lines (name, wall dimensions, repeat, match, preview number, date)
    if (pattern.sku) {
        patternDetailsLines += 1; // Add line for SKU if it exists
    }
    totalHeight += lineHeight * patternDetailsLines;
    totalHeight += sectionSpacing;
    
    // Order quantity section - count lines based on pattern type (with extra spacing)
    // Add one extra line for each pattern type due to the split overage header
    if (calculations.saleType === 'yard') {
        totalHeight += lineHeight * 6; // Order lines for yard patterns + extra spacing + split header
    } else {
        totalHeight += lineHeight * 10; // Order lines for panel patterns + extra spacing + split header
    }
    totalHeight += sectionSpacing;
    
    // Contact and disclaimer section - calculate actual wrapped text height
    const disclaimerText = CONFIG.ui.text.disclaimers.results;
    const disclaimerLines = Math.ceil(disclaimerText.length / 80); // Rough estimate of wrapped lines
    totalHeight += lineHeight * (disclaimerLines + 3); // Disclaimer + contact info + spacing
    
    return totalHeight;
}

// UPDATED: Add enhanced text content to PDF with centered alignment and consistent sizing
async function addEnhancedTextContentToPDF(pdf, x, y, maxWidth, maxHeight) {
    const { pattern, calculations, formattedWidth, formattedHeight } = currentPreview;
    
    // Load logo
    const logoImg = await loadLogoForPDF();
    
    // Calculate total content height for vertical centering
    const totalContentHeight = calculateTotalContentHeight(pdf, maxWidth);
    const startY = y + (maxHeight - totalContentHeight) / 2;
    
    let currentY = startY;
    const lineHeight = 0.2; // Increased line height to prevent overlap
    const sectionSpacing = 0.3; // Increased spacing between sections
    const bodyFontSize = 11; // Consistent body font size
    const centerX = x + (maxWidth / 2); // Center position for all text
    
    // Add logo if available
    if (logoImg) {
        const logoHeight = 0.5;
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
        const logoX = x + (maxWidth - logoWidth) / 2;
        
        pdf.addImage(logoImg, 'PNG', logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 0.35; // Increased spacing after logo
    } else {
        // Add business name as header
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(CONFIG.business.name || 'Wallpaper Calculator', centerX, currentY, { align: 'center' });
        currentY += 0.45; // Increased spacing after business name
    }
    
    // Pattern Details Section
    // Pattern name in header font
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text(pattern.name, centerX, currentY, { align: 'center' });
    currentY += lineHeight;
    
    // SKU on separate line in header font (if available)
    if (pattern.sku) {
        pdf.text(pattern.sku, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    }
    
    // Wall dimensions - back to body font with label
    pdf.setFontSize(bodyFontSize);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Wall Dimensions: ${formattedWidth}w × ${formattedHeight}h`, centerX, currentY, { align: 'center' });
    currentY += lineHeight;
    
    // Pattern repeat dimensions - add "Repeat:" prefix
    const repeatWidthFeet = Math.floor(pattern.repeatWidth / 12);
    const repeatWidthInches = pattern.repeatWidth % 12;
    const repeatWidthDisplay = repeatWidthInches > 0 ? 
        `${repeatWidthFeet}'-${repeatWidthInches}"` : `${repeatWidthFeet}'`;
    
    let repeatDisplay = `Repeat: ${repeatWidthDisplay}w`;
    
    // Add height if pattern has repeat height
    if (pattern.hasRepeatHeight && pattern.repeatHeight) {
        const repeatHeightFeet = Math.floor(pattern.repeatHeight / 12);
        const repeatHeightInches = pattern.repeatHeight % 12;
        const repeatHeightDisplay = repeatHeightInches > 0 ? 
            `${repeatHeightFeet}'-${repeatHeightInches}"` : `${repeatHeightFeet}'`;
        repeatDisplay += ` × ${repeatHeightDisplay}h`;
    }
    
    pdf.text(repeatDisplay, centerX, currentY, { align: 'center' });
    currentY += lineHeight;
    
    // Pattern match information - add "Match:" prefix
    const patternMatch = pattern.patternMatch || 'straight';
    pdf.text(`Match: ${patternMatch}`, centerX, currentY, { align: 'center' });
    currentY += lineHeight;
    
    // Preview number
    const sequentialNumber = getSequentialPreviewNumber();
    pdf.text(`Preview Number: ${sequentialNumber}`, centerX, currentY, { align: 'center' });
    currentY += lineHeight;
    
    // Date
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric' 
    });
    pdf.text(`Date: ${currentDate}`, centerX, currentY, { align: 'center' });
    currentY += sectionSpacing;
    
    // Order Quantity Section - Headers in header font, content in body font
    if (calculations.saleType === 'yard') {
        // Yard-based calculations
        const totalYardage = calculations.totalYardage;
        const overageYardage = Math.ceil(totalYardage * 1.2);
        
        // Header font for section title
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Order quantity as shown:', centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        
        // Body font for content
        pdf.setFontSize(bodyFontSize);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Total yardage: ${totalYardage} yds`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        
        // Add extra line of spacing before overage section
        currentY += lineHeight;
        
        // Header font for overage section title
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Order quantity with 20%', centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        pdf.text('overage added:', centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        
        // Body font for overage content
        pdf.setFontSize(bodyFontSize);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Total yardage: ${overageYardage} yds`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        
    } else {
        // Panel-based calculations - matching the screenshot format
        const panelLength = calculations.panelLength;
        const yardagePerPanel = Math.round(panelLength / 3);
        const totalYardage = calculations.panelsNeeded * yardagePerPanel;
        const overagePanels = Math.ceil(calculations.panelsNeeded * 1.2);
        const overageYardage = overagePanels * yardagePerPanel;
        
        // Header font for section title
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Order quantity as shown:', centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        
        // Body font for content
        pdf.setFontSize(bodyFontSize);
        pdf.setFont(undefined, 'normal');
        pdf.text(`[x${calculations.panelsNeeded}] ${panelLength}' Panels`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        pdf.text(`Yardage per a panel: ${yardagePerPanel} yds`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        pdf.text(`Total yardage: ${totalYardage} yds`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        
        // Add extra line of spacing before overage section
        currentY += lineHeight;
        
        // Header font for overage section title
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Order quantity with 20%', centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        pdf.text('overage added:', centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        
        // Body font for overage content
        pdf.setFontSize(bodyFontSize);
        pdf.setFont(undefined, 'normal');
        pdf.text(`[x${overagePanels}] ${panelLength}' Panels`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        pdf.text(`Yardage per a panel: ${yardagePerPanel} yds`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        pdf.text(`Total yardage: ${overageYardage} yds`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    }
    
    currentY += sectionSpacing;
    
    // Footer/Contact/Disclaimer - All centered and same font size with proper spacing
    pdf.setFontSize(bodyFontSize); // Same size as body text
    pdf.setFont(undefined, 'italic'); // Italic for disclaimer to match original
    
    // Disclaimer - use splitTextToSize to handle wrapping properly
    const disclaimerText = CONFIG.ui.text.disclaimers.results;
    const disclaimerLines = pdf.splitTextToSize(disclaimerText, maxWidth - 0.3);
    
    // Add each line of disclaimer text with proper spacing
    for (let i = 0; i < disclaimerLines.length; i++) {
        pdf.text(disclaimerLines[i], centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    }
    
    // Add extra spacing after disclaimer
    currentY += 0.1;
    
    // Contact information - back to normal font
    pdf.setFont(undefined, 'normal');
    pdf.text(`${CONFIG.business.email} • ${CONFIG.business.website}`, centerX, currentY, { align: 'center' });
    currentY += lineHeight;
    pdf.text(`${CONFIG.business.location}`, centerX, currentY, { align: 'center' });
}

// Reset the calculator to allow new previews - UPDATED to work with quote form
function resetCalculator() {
    console.log('🔄 Resetting calculator for new preview...');
    
    // Clear current preview data
    currentPreview = null;
    patternImage = null;
    imageLoaded = false;
    
    // Hide preview section
    const previewSection = document.getElementById('previewSection');
    if (previewSection) {
        previewSection.style.display = 'none';
    }
    
    // Re-enable the generate preview button
    const generateBtn = document.getElementById('generatePreviewBtn');
    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Preview';
    }
    
    // Hide and clear the button container
    const buttonContainer = document.getElementById('buttonContainer');
    if (buttonContainer) {
        buttonContainer.style.display = 'none';
        buttonContainer.innerHTML = '';
    }
    
    // Reset quote form if it exists
    if (typeof resetQuoteForm === 'function') {
        resetQuoteForm();
    }
    
    // UPDATED: Reset the preview number in calculator logger
    if (window.calculatorLogger) {
        window.calculatorLogger.previewNumber = null;
        console.log('🔄 Reset calculator logger preview number');
    }
    
    // Scroll back to the form for convenience
    const calculatorSection = document.querySelector('.calculator-section');
    if (calculatorSection) {
        calculatorSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Trigger auto-resize update
    setTimeout(() => {
        if (window.autoResize) window.autoResize.updateHeight();
    }, 300);
    
    console.log('✅ Calculator reset complete - ready for new preview with sequential numbering');
}

// Initialize PDF generation functionality
function initializePDFGeneration() {
    console.log('📄 PDF generation module initialized with sequential numbering');
    
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
        console.warn('⚠️ jsPDF library not loaded - PDF generation will not work');
    } else {
        console.log('✅ jsPDF library available');
    }
}

// Export functions to global scope
window.pdfGenerationAPI = {
    generatePDF,
    updateDownloadButtonState,
    generateHighResCanvas,
    resetCalculator,
    initializePDFGeneration,
    getSequentialPreviewNumber
};
