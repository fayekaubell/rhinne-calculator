// Calculator Module - UI coordination and initialization with Custom Searchable Dropdown
// Data loading functions moved to pattern-data.js
// UPDATED: Removed SKU from dropdown display
// FIXED: Better error handling and config checking

// Global variables for dropdown state
let allPatterns = [];
let filteredPatterns = [];
let selectedPatternId = '';
let highlightedIndex = -1;
let isDropdownOpen = false;

// Initialize calculator with better error handling
function initializeCalculator() {
    console.log('🚀 Initializing Wallpaper Calculator with Searchable Dropdown...');
    
    try {
        // Check if CONFIG is available
        if (typeof window.CONFIG === 'undefined' || !window.CONFIG) {
            console.error('❌ CONFIG not loaded, using fallback configuration');
            // Create fallback config
            window.CONFIG = {
                data: {
                    patternsCSV: './data/patterns.csv',
                    imageBaseUrl: 'https://fayekaubell.github.io/rhinne-calculator/data/patterns/'
                },
                calculator: {
                    defaults: {
                        panelWidth: 54,
                        availableLengths: [9, 12, 15],
                        minOverage: 4,
                        rollWidth: 54,
                        minYardOrder: 3
                    },
                    limits: {
                        maxPanelHeight: 27,
                        showLimitWarning: true
                    }
                },
                ui: {
                    text: {
                        pageTitle: "Wallpaper Yardage Calculator",
                        pageSubtitle: "Enter wall dimensions to estimate how much you'll need to purchase.",
                        measuringGuide: {
                            standardWalls: "Measure total width across all walls and height at the tallest point. Include doors, windows, and other obstacles in your measurements.",
                            stairwayWalls: "Measure width at the broadest section and height from the first floor to the maximum height.",
                            ceilings: "Measure the shorter dimension for width and longer dimension for height.",
                            slopedCeilings: "Measure full width and maximum height.",
                            note: "For best results, we recommend working with a professional wallpaper installer. Confirm your measurements & calculation with your installer before ordering."
                        },
                        disclaimers: {
                            results: "Results take into consideration order minimums and at least 4\" overage. We recommend adding 10-30% overage to prevent installation snafus.",
                            panelLimit: "Our panels typically do not print longer than 27'. However, problem solving is our specialty so feel free to contact us directly at hannah@rhinne.us to see if we can come up with a solution.",
                            noRepeatHeight: "This pattern does not go to the height your wall dimensions require and will need to be scaled up. Contact us directly at hannah@rhinne.us to see if we can come up with a solution."
                        }
                    }
                },
                business: {
                    name: "Rhinne",
                    website: "rhinne.us",
                    email: "hannah@rhinne.us",
                    location: "Brooklyn, NY"
                }
            };
        }

        // Apply configuration to UI
        applyConfiguration();
        
        // Load patterns from CSV and populate dropdown
        loadAndPopulatePatterns();
        
    } catch (error) {
        console.error('❌ Error in initializeCalculator:', error);
        showErrorMessage('Failed to initialize calculator: ' + error.message);
    }
}

// Apply configuration settings to the UI with error handling
function applyConfiguration() {
    if (!window.CONFIG) {
        console.warn('⚠️ No CONFIG available for applyConfiguration');
        return;
    }
    
    try {
        const config = window.CONFIG;
        
        // Update page title and subtitle
        const pageTitle = document.getElementById('pageTitle');
        const pageSubtitle = document.getElementById('pageSubtitle');
        
        if (pageTitle && config.ui?.text?.pageTitle) {
            pageTitle.textContent = config.ui.text.pageTitle;
        }
        if (pageSubtitle && config.ui?.text?.pageSubtitle) {
            pageSubtitle.textContent = config.ui.text.pageSubtitle;
        }
        
        // Update measuring guide
        const guide = config.ui?.text?.measuringGuide;
        if (guide) {
            const standardWallsGuide = document.getElementById('standardWallsGuide');
            const stairwayWallsGuide = document.getElementById('stairwayWallsGuide');
            const ceilingsGuide = document.getElementById('ceilingsGuide');
            const slopedCeilingsGuide = document.getElementById('slopedCeilingsGuide');
            const measuringNote = document.getElementById('measuringNote');
            
            if (standardWallsGuide && guide.standardWalls) standardWallsGuide.textContent = guide.standardWalls;
            if (stairwayWallsGuide && guide.stairwayWalls) stairwayWallsGuide.textContent = guide.stairwayWalls;
            if (ceilingsGuide && guide.ceilings) ceilingsGuide.textContent = guide.ceilings;
            if (slopedCeilingsGuide && guide.slopedCeilings) slopedCeilingsGuide.textContent = guide.slopedCeilings;
            if (measuringNote && guide.note) measuringNote.textContent = guide.note;
        }
        
        console.log('✅ Configuration applied successfully');
        
    } catch (error) {
        console.error('❌ Error applying configuration:', error);
    }
}

// Load patterns and populate dropdown with better error handling
async function loadAndPopulatePatterns() {
    try {
        console.log('🔄 Starting pattern loading process...');
        
        // Check if loadPatternsFromCSV function is available
        if (typeof loadPatternsFromCSV !== 'function') {
            console.error('❌ loadPatternsFromCSV function not available');
            
            // Wait a bit and try again (in case scripts are still loading)
            setTimeout(() => {
                if (typeof loadPatternsFromCSV === 'function') {
                    console.log('🔄 Retrying pattern loading...');
                    loadAndPopulatePatterns();
                } else {
                    console.error('❌ loadPatternsFromCSV still not available after retry');
                    showErrorMessage('Pattern loading functions not available. Please refresh the page.');
                }
            }, 1000);
            return;
        }
        
        // Load patterns from CSV (function now in pattern-data.js)
        await loadPatternsFromCSV();
        
        // Check if patterns were loaded
        if (typeof patterns === 'undefined' || !patterns || Object.keys(patterns).length === 0) {
            console.error('❌ No patterns loaded');
            showErrorMessage('No wallpaper patterns found. Please check the data source.');
            return;
        }
        
        console.log('📊 Patterns loaded, checking data:', {
            totalPatterns: Object.keys(patterns).length,
            firstPattern: Object.keys(patterns)[0] ? patterns[Object.keys(patterns)[0]] : 'None'
        });
        
        // Initialize the custom dropdown
        initializeCustomDropdown();
        
        // Hide loading message and show form
        hideLoadingMessage();
        
    } catch (error) {
        console.error('❌ Failed to load patterns:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        showErrorMessage('Failed to load wallpaper patterns. Please refresh the page to try again.');
    }
}

// Initialize the custom searchable dropdown with error handling
function initializeCustomDropdown() {
    console.log('🔍 Initializing custom searchable dropdown...');
    
    try {
        // Check if patterns is available
        if (typeof patterns === 'undefined' || !patterns) {
            console.error('❌ Patterns not available for dropdown initialization');
            showErrorMessage('Pattern data not available. Please refresh the page.');
            return;
        }
        
        // Convert patterns object to array and sort
        allPatterns = Object.keys(patterns).map(patternId => {
            const pattern = patterns[patternId];
            if (!pattern) {
                console.warn('⚠️ Invalid pattern found:', patternId);
                return null;
            }
            return {
                id: patternId,
                ...pattern
            };
        }).filter(pattern => pattern !== null) // Remove any null patterns
          .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('📋 Patterns converted to array:', {
            totalPatterns: allPatterns.length,
            firstPattern: allPatterns[0] ? allPatterns[0].name : 'None'
        });
        
        if (allPatterns.length === 0) {
            console.error('❌ No valid patterns after conversion');
            showErrorMessage('No valid patterns found. Please refresh the page.');
            return;
        }
        
        filteredPatterns = [...allPatterns];
        
        // Get DOM elements
        const dropdownSelected = document.getElementById('dropdownSelected');
        const dropdownOptions = document.getElementById('dropdownOptions');
        const patternSearch = document.getElementById('patternSearch');
        const optionsList = document.getElementById('optionsList');
        const hiddenInput = document.getElementById('pattern');
        
        if (!dropdownSelected || !dropdownOptions || !patternSearch || !optionsList || !hiddenInput) {
            console.error('❌ Custom dropdown elements not found');
            showErrorMessage('Dropdown interface elements not found. Please refresh the page.');
            return;
        }
        
        // Populate initial options
        renderOptions();
        
        // Event listeners
        setupDropdownEventListeners();
        
        console.log(`✅ Custom dropdown initialized with ${allPatterns.length} patterns`);
        
    } catch (error) {
        console.error('❌ Error initializing custom dropdown:', error);
        showErrorMessage('Error setting up pattern selection. Please refresh the page.');
    }
}

// Render dropdown options with thumbnails
function renderOptions() {
    const optionsList = document.getElementById('optionsList');
    if (!optionsList) {
        console.error('❌ Options list element not found');
        return;
    }
    
    try {
        // Clear existing options
        optionsList.innerHTML = '';
        
        if (filteredPatterns.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No patterns found matching your search';
            optionsList.appendChild(noResults);
            return;
        }
        
        // Create option elements
        filteredPatterns.forEach((pattern, index) => {
            if (!pattern || !pattern.name) {
                console.warn('⚠️ Skipping invalid pattern at index', index);
                return;
            }
            
            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.dataset.patternId = pattern.id;
            option.dataset.index = index;
            
            // Create thumbnail
            const thumbnail = document.createElement('img');
            thumbnail.className = 'option-thumbnail loading';
            thumbnail.alt = pattern.name;
            
            // Handle thumbnail loading
            if (pattern.thumbnailUrl || pattern.imageUrl) {
                const imgSrc = pattern.thumbnailUrl || pattern.imageUrl;
                thumbnail.onload = function() {
                    this.classList.remove('loading');
                };
                thumbnail.onerror = function() {
                    this.classList.remove('loading');
                    this.style.display = 'none';
                };
                thumbnail.src = imgSrc;
            } else {
                thumbnail.style.display = 'none';
            }
            
            // Create text content - Only show pattern name, no SKU
            const textDiv = document.createElement('div');
            textDiv.className = 'option-text';
            textDiv.textContent = pattern.name;
            
            // Assemble option
            option.appendChild(thumbnail);
            option.appendChild(textDiv);
            
            // Click handler
            option.addEventListener('click', () => selectPattern(pattern.id));
            
            optionsList.appendChild(option);
        });
        
        // Reset highlighted index
        highlightedIndex = -1;
        
    } catch (error) {
        console.error('❌ Error rendering options:', error);
        optionsList.innerHTML = '<div class="no-results">Error loading patterns</div>';
    }
}

// Setup all event listeners for the dropdown
function setupDropdownEventListeners() {
    try {
        const dropdownSelected = document.getElementById('dropdownSelected');
        const dropdownOptions = document.getElementById('dropdownOptions');
        const patternSearch = document.getElementById('patternSearch');
        
        if (!dropdownSelected || !dropdownOptions || !patternSearch) {
            console.error('❌ Dropdown elements not found for event listeners');
            return;
        }
        
        // Toggle dropdown on click
        dropdownSelected.addEventListener('click', toggleDropdown);
        
        // Handle keyboard navigation on dropdown
        dropdownSelected.addEventListener('keydown', handleDropdownKeydown);
        
        // Search input handler
        patternSearch.addEventListener('input', handleSearch);
        patternSearch.addEventListener('keydown', handleSearchKeydown);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-dropdown')) {
                closeDropdown();
            }
        });
        
        // Prevent dropdown from closing when clicking inside options
        dropdownOptions.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        console.log('✅ Dropdown event listeners set up successfully');
        
    } catch (error) {
        console.error('❌ Error setting up dropdown event listeners:', error);
    }
}

// Toggle dropdown open/closed
function toggleDropdown() {
    if (isDropdownOpen) {
        closeDropdown();
    } else {
        openDropdown();
    }
}

// Open dropdown
function openDropdown() {
    const dropdownSelected = document.getElementById('dropdownSelected');
    const dropdownOptions = document.getElementById('dropdownOptions');
    const patternSearch = document.getElementById('patternSearch');
    
    if (!dropdownSelected || !dropdownOptions || !patternSearch) return;
    
    isDropdownOpen = true;
    dropdownSelected.classList.add('open');
    dropdownSelected.setAttribute('aria-expanded', 'true');
    dropdownOptions.classList.add('open');
    
    // Focus search input
    setTimeout(() => {
        patternSearch.focus();
    }, 100);
    
    // Trigger auto-resize
    setTimeout(() => {
        if (window.autoResize) window.autoResize.updateHeight();
    }, 200);
}

// Close dropdown
function closeDropdown() {
    const dropdownSelected = document.getElementById('dropdownSelected');
    const dropdownOptions = document.getElementById('dropdownOptions');
    const patternSearch = document.getElementById('patternSearch');
    
    if (!dropdownSelected || !dropdownOptions || !patternSearch) return;
    
    isDropdownOpen = false;
    dropdownSelected.classList.remove('open');
    dropdownSelected.setAttribute('aria-expanded', 'false');
    dropdownOptions.classList.remove('open');
    
    // Clear search
    patternSearch.value = '';
    filteredPatterns = [...allPatterns];
    renderOptions();
    
    // Remove highlight
    highlightedIndex = -1;
    updateHighlight();
    
    // Trigger auto-resize
    setTimeout(() => {
        if (window.autoResize) window.autoResize.updateHeight();
    }, 200);
}

// Handle search input
function handleSearch(e) {
    try {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            filteredPatterns = [...allPatterns];
        } else {
            filteredPatterns = allPatterns.filter(pattern => {
                if (!pattern || !pattern.name) return false;
                
                const nameMatch = pattern.name.toLowerCase().includes(searchTerm);
                // Keep SKU matching for search functionality even though we don't display it
                const skuMatch = pattern.sku && pattern.sku.toLowerCase().includes(searchTerm);
                return nameMatch || skuMatch;
            });
        }
        
        renderOptions();
        highlightedIndex = -1;
        updateHighlight();
        
    } catch (error) {
        console.error('❌ Error in search handler:', error);
    }
}

// Handle keyboard navigation in search
function handleSearchKeydown(e) {
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (filteredPatterns.length > 0) {
                highlightedIndex = 0;
                updateHighlight();
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (filteredPatterns.length > 0) {
                highlightedIndex = filteredPatterns.length - 1;
                updateHighlight();
            }
            break;
        case 'Enter':
            e.preventDefault();
            if (highlightedIndex >= 0 && filteredPatterns[highlightedIndex]) {
                selectPattern(filteredPatterns[highlightedIndex].id);
            }
            break;
        case 'Escape':
            e.preventDefault();
            closeDropdown();
            break;
    }
}

// Handle keyboard navigation on dropdown
function handleDropdownKeydown(e) {
    switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            toggleDropdown();
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (!isDropdownOpen) {
                openDropdown();
            }
            break;
        case 'Escape':
            e.preventDefault();
            closeDropdown();
            break;
    }
}

// Update visual highlight
function updateHighlight() {
    const options = document.querySelectorAll('.dropdown-option');
    options.forEach((option, index) => {
        option.classList.toggle('highlighted', index === highlightedIndex);
    });
    
    // Scroll highlighted option into view
    if (highlightedIndex >= 0 && options[highlightedIndex]) {
        options[highlightedIndex].scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
        });
    }
}

// Select a pattern
function selectPattern(patternId) {
    try {
        if (!patternId || typeof patterns === 'undefined' || !patterns[patternId]) {
            console.error('❌ Invalid pattern selection:', patternId);
            return;
        }
        
        const pattern = patterns[patternId];
        selectedPatternId = patternId;
        
        // Update visual display - Only show pattern name, no SKU
        const selectedText = document.getElementById('dropdownSelected')?.querySelector('.selected-text');
        const hiddenInput = document.getElementById('pattern');
        
        if (selectedText) {
            selectedText.textContent = pattern.name;
            selectedText.classList.remove('placeholder');
        }
        
        if (hiddenInput) {
            hiddenInput.value = patternId;
            // Trigger change event for form validation
            hiddenInput.dispatchEvent(new Event('change'));
        }
        
        // Close dropdown
        closeDropdown();
        
        console.log('✅ Pattern selected:', pattern.name);
        
    } catch (error) {
        console.error('❌ Error selecting pattern:', error);
    }
}

// Get selected pattern (utility function for compatibility)
function getSelectedPattern() {
    return selectedPatternId;
}

// Show/hide UI elements
function hideLoadingMessage() {
    const loadingMessage = document.getElementById('loadingMessage');
    const calculatorForm = document.getElementById('calculatorForm');
    
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }
    if (calculatorForm) {
        calculatorForm.style.display = 'block';
    }
    
    console.log('✅ Loading message hidden, calculator form shown');
}

function showErrorMessage(message) {
    const errorElement = document.getElementById('errorMessage');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }
    
    console.error('❌ Error message shown:', message);
}

// Export calculator API functions to global scope for compatibility
window.calculatorAPI = {
    initializeCalculator,
    getSelectedPattern,
    hideLoadingMessage,
    showErrorMessage,
    selectPattern,
    initializeCustomDropdown,
    loadAndPopulatePatterns,
    applyConfiguration
};

// Also export individual functions to global scope for backward compatibility
window.initializeCalculator = initializeCalculator;
window.getSelectedPattern = getSelectedPattern;
window.hideLoadingMessage = hideLoadingMessage;
window.showErrorMessage = showErrorMessage;
window.selectPattern = selectPattern;

console.log('✅ Calculator module loaded with enhanced error handling');
