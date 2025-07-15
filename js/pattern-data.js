// Pattern Data Module - Data loading, CSV parsing, and calculations
// UPDATED: Simplified calculations - cap panels at max available length and anchor to bottom
// FIXED: Ensure patterns global variable is properly set

// Global variables for data
let patterns = {};
let patternsLoaded = false;
let patternImage = null;
let imageLoaded = false;

// Make patterns available globally immediately
window.patterns = patterns;

// Load patterns from CSV file
async function loadPatternsFromCSV() {
    try {
        console.log('📊 Loading patterns from CSV...');
        console.log('📍 CONFIG check:', CONFIG);
        console.log('📍 CSV path:', CONFIG.data.patternsCSV);
        
        const response = await fetch(CONFIG.data.patternsCSV);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('📄 CSV loaded, length:', csvText.length, 'chars');
        console.log('📄 CSV first 200 chars:', csvText.substring(0, 200));
        
        // Parse CSV using Papa Parse
        const parsed = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
        });
        
        if (parsed.errors.length > 0) {
            console.warn('⚠️ CSV parsing warnings:', parsed.errors);
        }
        
        console.log('📋 CSV parsed successfully:', parsed.data.length, 'patterns found');
        console.log('📋 Sample parsed row:', parsed.data[0]);
        
        // Convert CSV data to pattern objects
        patterns = {};
        let successCount = 0;
        parsed.data.forEach((row, index) => {
            try {
                const pattern = createPatternFromCSV(row);
                if (pattern) {
                    patterns[pattern.id] = pattern;
                    successCount++;
                    console.log(`✅ Pattern ${successCount}: ${pattern.name} (${pattern.id})`);
                }
            } catch (error) {
                console.error(`❌ Error processing pattern at row ${index + 1}:`, error, row);
            }
        });
        
        // Update global reference
        window.patterns = patterns;
        
        patternsLoaded = true;
        console.log(`🎉 Total patterns loaded: ${Object.keys(patterns).length}`);
        console.log('🎉 Pattern IDs:', Object.keys(patterns));
        return patterns;
        
    } catch (error) {
        console.error('❌ Error loading patterns from CSV:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        // Fall back to demo pattern
        patterns = {
            'demo-pattern': {
                id: 'demo-pattern',
                name: 'Demo Pattern',
                sku: 'DEMO-001',
                repeatWidth: 108,
                repeatHeight: 144,
                hasRepeatHeight: true,
                panelWidth: 54,
                availableLengths: [9, 12, 15],
                minOverage: 4,
                saleType: 'panel',
                panelSequence: 'AB',
                sequenceLength: 2,
                imageUrl: '',
                thumbnailUrl: '',
                product_tearsheet_url: '',
                product_page_url: '',
                product_360_url: '',
                patternMatch: 'straight'
            }
        };
        
        // Update global reference
        window.patterns = patterns;
        
        patternsLoaded = true;
        console.log('🔄 Using demo pattern as fallback');
        console.log('🔄 Demo pattern available:', patterns);
        return patterns;
    }
}

// Create pattern object from CSV row
function createPatternFromCSV(row) {
    console.log('🔨 Creating pattern from row:', row);
    
    if (!row.pattern_name || !row.sku) {
        console.warn('⚠️ Skipping row with missing required fields:', row);
        return null;
    }
    
    const defaults = CONFIG.calculator.defaults;
    
    // Create pattern ID from SKU
    const patternId = row.sku.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
    
    // Parse available lengths
    const availableLengthsStr = row.available_lengths_feet || '';
    const availableLengths = availableLengthsStr ? 
        availableLengthsStr.split(',').map(l => parseInt(l.trim())).filter(l => !isNaN(l)) :
        defaults.availableLengths;
    
    // Parse panel sequence
    const panelSequence = row.panel_sequence || (row.sale_type === 'yard' ? '' : 'AB');
    const sequenceLength = panelSequence.length;
    
    // Handle repeat height - check for "none" values
    const repeatHeightValue = row.repeat_height_inches;
    let repeatHeight = 144;
    let hasRepeatHeight = true;
    
    if (repeatHeightValue === 'none' || repeatHeightValue === 'None' || repeatHeightValue === 'NONE') {
        hasRepeatHeight = false;
        repeatHeight = 144; // Keep a default for calculations
    } else {
        repeatHeight = parseFloat(repeatHeightValue) || 144;
    }
    
    // Determine image URL
    let imageUrl = '';
    let thumbnailUrl = '';
    
    if (row.repeat_url && row.repeat_url.trim()) {
        imageUrl = row.repeat_url.trim();
        thumbnailUrl = imageUrl;
    } else {
        const filename = row.sku + '.jpg';
        imageUrl = CONFIG.data.imageBaseUrl + filename;
        thumbnailUrl = imageUrl;
    }
    
    const pattern = {
        id: patternId,
        name: row.pattern_name,
        sku: row.sku,
        repeatWidth: parseFloat(row.repeat_width_inches) || 108,
        repeatHeight: repeatHeight,
        hasRepeatHeight: hasRepeatHeight,
        minOverage: defaults.minOverage,
        imageUrl: imageUrl,
        thumbnailUrl: thumbnailUrl,
        saleType: row.sale_type || 'panel',
        panelWidth: parseFloat(row.material_width_inches) || 54,
        availableLengths: availableLengths,
        panelSequence: panelSequence,
        sequenceLength: sequenceLength,
        rollWidth: row.sale_type === 'yard' ? defaults.rollWidth : null,
        minYardOrder: row.sale_type === 'yard' ? (row.min_yard_order || defaults.minYardOrder) : null,
        patternMatch: row.pattern_match || 'straight',
        handle: patternId,
        product_tearsheet_url: row.product_tearsheet_url || '',
        product_page_url: row.product_page_url || '',
        product_360_url: row['360_view_url'] || ''
    };
    
    console.log('✅ Created pattern:', pattern.name, pattern.id);
    return pattern;
}

// Preload pattern images
function preloadPatternImage(pattern) {
    return new Promise((resolve, reject) => {
        if (!pattern.imageUrl) {
            console.warn('No image URL provided for pattern:', pattern.name);
            resolve(null);
            return;
        }
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            console.log('✅ Pattern image loaded successfully');
            patternImage = img;
            imageLoaded = true;
            resolve(img);
        };
        
        img.onerror = function() {
            console.error('⚠️ Failed to load pattern image');
            patternImage = null;
            imageLoaded = false;
            resolve(null);
        };
        
        img.src = pattern.imageUrl;
    });
}

// Calculate panel requirements - UPDATED: Restore original logic for normal cases, cap at max for tall walls
function calculatePanelRequirements(pattern, wallWidth, wallHeight) {
    if (!pattern || !pattern.saleType) {
        console.error('Invalid pattern data');
        return {
            panelsNeeded: 1,
            panelLength: 10,
            totalWidth: 54,
            totalHeight: 120,
            saleType: 'panel'
        };
    }
    
    if (pattern.saleType === 'yard') {
        return calculateYardRequirements(pattern, wallWidth, wallHeight);
    }
    
    const totalWidth = wallWidth + pattern.minOverage;
    const totalHeight = wallHeight + pattern.minOverage;
    
    const panelsNeeded = Math.ceil(totalWidth / pattern.panelWidth);
    
    // Find the appropriate panel length - RESTORED original logic
    let panelLength = 0;
    for (let length of pattern.availableLengths) {
        if (length * 12 >= totalHeight) {
            panelLength = length;
            break;
        }
    }
    
    // If no available length covers the wall, use the maximum available length
    // This is the ONLY case where we cap the panel length
    if (panelLength === 0) {
        panelLength = Math.max(...pattern.availableLengths);
        console.log(`ℹ️ Wall height ${totalHeight}" exceeds max available panel length, capping at ${panelLength}' panels`);
    }
    
    return {
        panelsNeeded,
        panelLength: panelLength,
        totalWidth: panelsNeeded * pattern.panelWidth,
        totalHeight: panelLength * 12,
        saleType: 'panel',
        patternMatch: pattern.patternMatch || 'straight'
    };
}

// Calculate yard requirements - UPDATED for multi-repeat half-drop support
function calculateYardRequirements(pattern, wallWidth, wallHeight) {
    const totalWidth = wallWidth + pattern.minOverage;
    const totalHeight = wallHeight + pattern.minOverage;
    
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    
    if (!pattern.repeatHeight || pattern.repeatHeight <= 0) {
        console.error('Invalid repeat height for yard calculation');
        return {
            panelsNeeded: 1,
            panelLength: 10,
            totalYardage: 5,
            totalWidth: pattern.panelWidth || 54,
            totalHeight: 120,
            saleType: 'yard',
            stripLengthInches: 120,
            patternMatch: pattern.patternMatch || 'straight'
        };
    }
    
    if (!pattern.panelWidth || pattern.panelWidth <= 0) {
        console.error('Invalid panel width for yard calculation');
        return {
            panelsNeeded: 1,
            panelLength: 10,
            totalYardage: 5,
            totalWidth: 54,
            totalHeight: 120,
            saleType: 'yard',
            stripLengthInches: 120,
            patternMatch: pattern.patternMatch || 'straight'
        };
    }
    
    const stripsNeeded = Math.ceil(totalWidth / pattern.panelWidth);
    const repeatsPerPanel = pattern.panelWidth / pattern.repeatWidth;
    
    // Enhanced logging for half-drop yard calculations
    if (isHalfDrop) {
        console.log(`🔄 HALF-DROP YARD CALCULATION for ${pattern.name}:`, {
            repeatsPerPanel: repeatsPerPanel,
            isMultiRepeat: repeatsPerPanel >= 2,
            totalWidth: totalWidth,
            totalHeight: totalHeight,
            stripsNeeded: stripsNeeded
        });
    }
    
    let stripLengths = [];
    let maxStripLength = 0;
    
    if (isHalfDrop) {
        if (repeatsPerPanel >= 2) {
            // UPDATED: Multi-repeat half-drop patterns
            // Panels align straight, so no extra height needed for panel offset
            // Just calculate enough height to cover the wall with proper repeats
            const repeatsNeeded = Math.ceil(totalHeight / pattern.repeatHeight);
            const stripLengthInches = repeatsNeeded * pattern.repeatHeight;
            
            console.log(`📐 Multi-repeat half-drop calculation:`, {
                repeatsNeeded: repeatsNeeded,
                stripLengthInches: stripLengthInches,
                patternHeight: pattern.repeatHeight
            });
            
            for (let i = 0; i < stripsNeeded; i++) {
                stripLengths.push(stripLengthInches);
            }
            maxStripLength = stripLengthInches;
        } else {
            // EXISTING: Single-repeat half-drop patterns (every other panel offset)
            // Need extra height to accommodate the panel offset
            const baseHeight = totalHeight;
            const withOffset = baseHeight + (pattern.repeatHeight / 2);
            const repeatsNeeded = Math.ceil(withOffset / pattern.repeatHeight);
            const stripLengthInches = repeatsNeeded * pattern.repeatHeight;
            
            console.log(`📐 Single-repeat half-drop calculation:`, {
                baseHeight: baseHeight,
                withOffset: withOffset,
                repeatsNeeded: repeatsNeeded,
                stripLengthInches: stripLengthInches
            });
            
            for (let i = 0; i < stripsNeeded; i++) {
                stripLengths.push(stripLengthInches);
            }
            maxStripLength = stripLengthInches;
        }
    } else {
        // Straight match patterns
        const repeatsNeeded = Math.ceil(totalHeight / pattern.repeatHeight);
        const stripLengthInches = repeatsNeeded * pattern.repeatHeight;
        
        for (let i = 0; i < stripsNeeded; i++) {
            stripLengths.push(stripLengthInches);
        }
        maxStripLength = stripLengthInches;
    }
    
    const totalInches = stripLengths.reduce((sum, length) => sum + length, 0);
    const totalYardageRaw = totalInches / 36;
    
    // UPDATED: Extra yardage logic for half-drop patterns
    let extraYardage = 0;
    if (isHalfDrop && repeatsPerPanel <= 1) {
        // Only add extra yardage for single-repeat half-drop patterns
        extraYardage = 1;
        console.log(`🔄 Adding extra yardage for single-repeat half-drop pattern`);
    } else if (isHalfDrop && repeatsPerPanel >= 2) {
        // Multi-repeat half-drop patterns don't need extra yardage since panels align
        console.log(`📐 No extra yardage needed for multi-repeat half-drop pattern`);
    }
    
    const totalYardage = Math.max(Math.ceil(totalYardageRaw + extraYardage), pattern.minYardOrder || 5);
    
    console.log(`✅ YARD CALCULATION COMPLETE:`, {
        totalYardageRaw: totalYardageRaw,
        extraYardage: extraYardage,
        finalTotalYardage: totalYardage,
        maxStripLength: maxStripLength
    });
    
    return {
        panelsNeeded: stripsNeeded,
        panelLength: Math.floor(maxStripLength / 12),
        panelLengthInches: maxStripLength % 12,
        totalYardage: totalYardage,
        totalWidth: stripsNeeded * pattern.panelWidth,
        totalHeight: maxStripLength,
        saleType: 'yard',
        stripLengthInches: maxStripLength,
        stripLengths: stripLengths,
        patternMatch: pattern.patternMatch || 'straight',
        isHalfDrop: isHalfDrop,
        repeatsPerPanel: repeatsPerPanel
    };
}

// Export data access functions to global scope
window.patternDataAPI = {
    patterns,
    patternImage,
    imageLoaded,
    loadPatternsFromCSV,
    preloadPatternImage,
    calculatePanelRequirements,
    calculateYardRequirements
};
