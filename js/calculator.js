// Calculator Module - UI coordination and initialization with Custom Searchable Dropdown
// Data loading functions moved to pattern-data.js

// Global variables for dropdown state
let allPatterns = [];
let filteredPatterns = [];
let selectedPatternId = '';
let highlightedIndex = -1;
let isDropdownOpen = false;

// Initialize calculator
function initializeCalculator() {
    console.log('🚀 Initializing Wallpaper Calculator with Searchable Dropdown...');
    
    // Apply configuration to UI
    applyConfiguration();
    
    // Load patterns from CSV and populate dropdown
    loadAndPopulatePatterns();
}

// Apply configuration settings to the UI
function applyConfiguration() {
    if (!window.CONFIG) {
        console.error('Configuration not loaded');
        return;
    }
    
    const config = window.CONFIG;
    
    // Update page title and subtitle
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    if (pageTitle) {
        pageTitle.textContent = config.ui.text.pageTitle;
    }
    if (pageSubtitle) {
        pageSubtitle.textContent = config.ui.text.pageSubtitle;
    }
    
    // Update measuring guide
    const guide = config.ui.text.measuringGuide;
    const standardWallsGuide = document.getElementById('standardWallsGuide');
    const stairwayWallsGuide = document.getElementById('stairwayWallsGuide');
    const ceilingsGuide = document.getElementById('ceilingsGuide');
    const slopedCeilingsGuide = document.getElementById('slopedCeilingsGuide');
    const measuringNote = document.getElementById('measuringNote');
    
    if (standardWallsGuide) standardWallsGuide.textContent = guide.standardWalls;
    if (stairwayWallsGuide) stairwayWallsGuide.textContent = guide.stairwayWalls;
    if (ceilingsGuide) ceilingsGuide.textContent = guide.ceilings;
    if (slopedCeilingsGuide) slopedCeilingsGuide.textContent = guide.slopedCeilings;
    if (measuringNote) measuringNote.textContent = guide.note;
    
    // Update disclaimers
    const resultsDisclaimer = document.getElementById('resultsDisclaimer');
    if (resultsDisclaimer) {
        resultsDisclaimer.textContent = config.ui.text.disclaimers.results;
    }
}

// Load patterns and populate dropdown
async function loadAndPopulatePatterns() {
    try {
        // Load patterns from CSV (function now in pattern-data.js)
        await loadPatternsFromCSV();
        
        // Initialize the custom dropdown
        initializeCustomDropdown();
        
        // Hide loading message and show form
        hideLoadingMessage();
        
    } catch (error) {
        console.error('❌ Failed to load patterns:', error);
        showErrorMessage('Failed to load wallpaper patterns. Please refresh the page to try again.');
    }
}

// Initialize the custom searchable dropdown
function initializeCustomDropdown() {
    console.log('🔍 Initializing custom searchable dropdown...');
    
    // Convert patterns object to array and sort
    allPatterns = Object.keys(patterns).map(patternId => ({
        id: patternId,
        ...patterns[patternId]
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    filteredPatterns = [...allPatterns];
    
    // Get DOM elements
    const dropdownSelected = document.getElementById('dropdownSelected');
    const dropdownOptions = document.getElementById('dropdownOptions');
    const patternSearch = document.getElementById('patternSearch');
    const optionsList = document.getElementById('optionsList');
    const hiddenInput = document.getElementById('pattern');
    
    if (!dropdownSelected || !dropdownOptions || !patternSearch || !optionsList || !hiddenInput) {
        console.error('❌ Custom dropdown elements not found');
        return;
    }
    
    // Populate initial options
    renderOptions();
    
    // Event listeners
    setupDropdownEventListeners();
    
    console.log(`✅ Custom dropdown initialized with ${allPatterns.length} patterns`);
}

// Render dropdown options with thumbnails
function renderOptions() {
    const optionsList = document.getElementById('optionsList');
    if (!optionsList) return;
    
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
        
        // Create text content
        const textDiv = document.createElement('div');
        textDiv.className = 'option-text';
        textDiv.textContent = pattern.name;
        
        const skuSpan = document.createElement('span');
        skuSpan.className = 'option-sku';
        skuSpan.textContent = pattern.sku ? `/ ${pattern.sku}` : '';
        
        // Assemble option
        option.appendChild(thumbnail);
        option.appendChild(textDiv);
        if (pattern.sku) {
            textDiv.appendChild(skuSpan);
        }
        
        // Click handler
        option.addEventListener('click', () => selectPattern(pattern.id));
        
        optionsList.appendChild(option);
    });
    
    // Reset highlighted index
    highlightedIndex = -1;
}

// Setup all event listeners for the dropdown
function setupDropdownEventListeners() {
    const dropdownSelected = document.getElementById('dropdownSelected');
    const dropdownOptions = document.getElementById('dropdownOptions');
    const patternSearch = document.getElementById('patternSearch');
    
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
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredPatterns = [...allPatterns];
    } else {
        filteredPatterns = allPatterns.filter(pattern => {
            const nameMatch = pattern.name.toLowerCase().includes(searchTerm);
            const skuMatch = pattern.sku && pattern.sku.toLowerCase().includes(searchTerm);
            return nameMatch || skuMatch;
        });
    }
    
    renderOptions();
    highlightedIndex = -1;
    updateHighlight();
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
    const pattern = patterns[patternId];
    if (!pattern) return;
    
    selectedPatternId = patternId;
    
    // Update visual display
    const selectedText = document.getElementById('dropdownSelected').querySelector('.selected-text');
    const hiddenInput = document.getElementById('pattern');
    
    selectedText.textContent = pattern.sku ? `${pattern.name} / ${pattern.sku}` : pattern.name;
    selectedText.classList.remove('placeholder');
    
    hiddenInput.value = patternId;
    
    // Close dropdown
    closeDropdown();
    
    // Trigger change event for form validation
    hiddenInput.dispatchEvent(new Event('change'));
    
    console.log('✅ Pattern selected:', pattern.name);
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
}

// Export calculator API functions to global scope for compatibility
window.calculatorAPI = {
    getSelectedPattern,
    hideLoadingMessage,
    showErrorMessage,
    selectPattern,
    initializeCustomDropdown
};
