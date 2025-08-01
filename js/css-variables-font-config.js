// Enhanced CSS Variables Font Configuration System for Wallpaper Calculator
// Now reads presets from CONFIG.js while maintaining flexibility
// UPDATED: Changed default preset to use Georgia fonts
// UPDATED: Changed background color to #fdfaf3

class CSSVariablesFontConfig {
    constructor() {
        this.config = window.CONFIG || {};
        this.stylingConfig = this.config.styling || {};
        this.presets = this.stylingConfig.presets || {};
        this.defaultPreset = this.stylingConfig.defaultPreset || 'georgia-default'; // UPDATED: Changed default
        
        // UPDATED: Fallback defaults now use Georgia fonts and new background color #fdfaf3
        this.fallbackDefaults = {
            fonts: {
                headingFamily: 'Georgia, "Times New Roman", Times, serif',
                headingWeight: '700',
                headingStyle: 'normal',
                headingScale: '1.0',
                bodyFamily: 'Georgia, "Times New Roman", Times, serif',
                bodyWeight: '400',
                bodyWeightBold: '700',
                bodyStyle: 'normal',
                bodyScale: '1.0'
            },
            colors: {
                background: '#fdfaf3', // UPDATED: New background color
                text: '#333333',
                buttonBackground: '#F8F9FA',
                buttonText: '#333333',
                buttonOutline: '#DEE2E6',
                shadow: '#6C757D',
                border: '#E9ECEF',
                accent: '#007BFF'
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('🎨 Initializing Enhanced CSS Variables Font Configuration with Georgia fonts and new background...');
        console.log('🎨 Available presets:', Object.keys(this.presets));
        console.log('🎨 Default preset:', this.defaultPreset);
        console.log('🎨 New background color: #fdfaf3');
        
        let finalStyling = {};
        
        // Method 1: Try to read from URL parameters first (highest priority)
        finalStyling = this.readFromURLParameters();
        
        // Method 2: Try to read from parent window (if in iframe)
        if (Object.keys(finalStyling).length === 0) {
            finalStyling = this.readFromParentWindow();
        }
        
        // Method 3: Use configured default preset (now Georgia-based with new background)
        if (Object.keys(finalStyling).length === 0) {
            finalStyling = this.getPresetStyling(this.defaultPreset);
            console.log(`🎨 Using configured default preset: ${this.defaultPreset}`);
        }
        
        // Method 4: Use fallback defaults if all else fails (now Georgia fonts with new background)
        if (Object.keys(finalStyling).length === 0) {
            finalStyling = this.fallbackDefaults;
            console.log('🎨 Using Georgia-based fallback default styling with new background #fdfaf3');
        }
        
        // Apply the styling
        this.applyStyling(finalStyling);
        
        // Store current configuration
        this.currentStyling = finalStyling;
        
        console.log('🎨 Final Georgia-based styling applied with new background:', finalStyling);
    }
    
    readFromURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        let styling = { fonts: {}, colors: {} };
        let hasParams = false;
        
        // Check for preset first (highest priority URL parameter)
        const preset = urlParams.get('preset') || urlParams.get('fontPreset') || urlParams.get('stylePreset');
        if (preset && this.presets[preset]) {
            styling = this.getPresetStyling(preset);
            console.log(`🎨 Applied preset from URL: ${preset}`);
            return styling;
        }
        
        // Check for individual styling parameters
        const fontParams = {
            'fontHeadingFamily': 'headingFamily',
            'fontHeadingWeight': 'headingWeight',
            'fontHeadingStyle': 'headingStyle',
            'fontHeadingScale': 'headingScale',
            'fontBodyFamily': 'bodyFamily',
            'fontBodyWeight': 'bodyWeight',
            'fontBodyWeightBold': 'bodyWeightBold',
            'fontBodyStyle': 'bodyStyle',
            'fontBodyScale': 'bodyScale',
            
            // Alternative parameter names
            'headingFamily': 'headingFamily',
            'bodyFamily': 'bodyFamily',
            'headingWeight': 'headingWeight',
            'bodyWeight': 'bodyWeight'
        };
        
        const colorParams = {
            'colorBackground': 'background',
            'colorText': 'text',
            'colorButtonBackground': 'buttonBackground',
            'colorButtonText': 'buttonText',
            'colorButtonOutline': 'buttonOutline',
            'colorShadow': 'shadow',
            'colorBorder': 'border',
            'colorAccent': 'accent',
            
            // Alternative parameter names
            'backgroundColor': 'background',
            'textColor': 'text',
            'buttonColor': 'buttonBackground',
            'accentColor': 'accent'
        };
        
        // Check font parameters
        for (const [param, key] of Object.entries(fontParams)) {
            const value = urlParams.get(param);
            if (value) {
                styling.fonts[key] = decodeURIComponent(value);
                hasParams = true;
                console.log(`🎨 Font parameter from URL: ${key} = ${styling.fonts[key]}`);
            }
        }
        
        // Check color parameters
        for (const [param, key] of Object.entries(colorParams)) {
            const value = urlParams.get(param);
            if (value) {
                styling.colors[key] = decodeURIComponent(value);
                hasParams = true;
                console.log(`🎨 Color parameter from URL: ${key} = ${styling.colors[key]}`);
            }
        }
        
        return hasParams ? styling : {};
    }
    
    readFromParentWindow() {
        let styling = { fonts: {}, colors: {} };
        let hasValues = false;
        
        try {
            // Check if we're in an iframe
            if (window !== window.parent) {
                console.log('🔍 Attempting to read CSS variables from parent window...');
                
                // Try to access parent window's computed styles
                const parentRoot = window.parent.document.documentElement;
                const parentStyles = window.parent.getComputedStyle(parentRoot);
                
                // Map of CSS variables to our internal structure
                const cssVarMapping = {
                    // Font variables
                    '--font-heading-family': ['fonts', 'headingFamily'],
                    '--font-heading-weight': ['fonts', 'headingWeight'],
                    '--font-heading-style': ['fonts', 'headingStyle'],
                    '--font-heading-scale': ['fonts', 'headingScale'],
                    '--font-body-family': ['fonts', 'bodyFamily'],
                    '--font-body-weight': ['fonts', 'bodyWeight'],
                    '--font-body-weight-bold': ['fonts', 'bodyWeightBold'],
                    '--font-body-style': ['fonts', 'bodyStyle'],
                    '--font-body-scale': ['fonts', 'bodyScale'],
                    
                    // Color variables
                    '--color-background': ['colors', 'background'],
                    '--color-text': ['colors', 'text'],
                    '--color-button-background': ['colors', 'buttonBackground'],
                    '--color-button-text': ['colors', 'buttonText'],
                    '--color-button-outline': ['colors', 'buttonOutline'],
                    '--color-shadow': ['colors', 'shadow'],
                    '--color-border': ['colors', 'border'],
                    '--color-accent': ['colors', 'accent']
                };
                
                for (const [cssVar, [category, key]] of Object.entries(cssVarMapping)) {
                    const value = parentStyles.getPropertyValue(cssVar);
                    if (value && value.trim()) {
                        styling[category][key] = value.trim();
                        hasValues = true;
                        console.log(`🎨 Inherited from parent: ${cssVar} = ${value.trim()}`);
                    }
                }
                
                if (hasValues) {
                    console.log('✅ Successfully inherited CSS variables from parent');
                }
            }
        } catch (error) {
            console.log('⚠️ Cannot access parent window (CORS restriction):', error.message);
            console.log('💡 Use URL parameters instead for cross-origin embedding');
        }
        
        return hasValues ? styling : {};
    }
    
    getPresetStyling(presetName) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.warn(`⚠️ Preset '${presetName}' not found`);
            return {};
        }
        
        return {
            fonts: { ...preset.fonts },
            colors: { ...preset.colors }
        };
    }
    
    applyStyling(styling) {
        // Convert our internal structure to CSS variables
        const cssVariables = this.convertToCSSVariables(styling);
        
        // Set CSS variables on the root element
        const root = document.documentElement;
        for (const [cssVar, value] of Object.entries(cssVariables)) {
            root.style.setProperty(cssVar, value);
        }
        
        // Apply the CSS that uses these variables
        this.applyCSSStyles();
        
        console.log('✅ CSS Variables and styles applied with Georgia fonts and new background #fdfaf3');
    }
    
    convertToCSSVariables(styling) {
        const cssVars = {};
        
        // Convert fonts
        if (styling.fonts) {
            const fontMap = {
                'headingFamily': '--font-heading-family',
                'headingWeight': '--font-heading-weight',
                'headingStyle': '--font-heading-style',
                'headingScale': '--font-heading-scale',
                'bodyFamily': '--font-body-family',
                'bodyWeight': '--font-body-weight',
                'bodyWeightBold': '--font-body-weight-bold',
                'bodyStyle': '--font-body-style',
                'bodyScale': '--font-body-scale'
            };
            
            for (const [key, cssVar] of Object.entries(fontMap)) {
                if (styling.fonts[key]) {
                    cssVars[cssVar] = styling.fonts[key];
                }
            }
        }
        
        // Convert colors
        if (styling.colors) {
            const colorMap = {
                'background': '--color-background',
                'text': '--color-text',
                'buttonBackground': '--color-button-background',
                'buttonText': '--color-button-text',
                'buttonOutline': '--color-button-outline',
                'shadow': '--color-shadow',
                'border': '--color-border',
                'accent': '--color-accent'
            };
            
            for (const [key, cssVar] of Object.entries(colorMap)) {
                if (styling.colors[key]) {
                    cssVars[cssVar] = styling.colors[key];
                }
            }
        }
        
        return cssVars;
    }
    
    applyCSSStyles() {
        // Create or update the style element
        let styleElement = document.getElementById('css-variables-font-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'css-variables-font-styles';
            document.head.appendChild(styleElement);
        }
        
        const css = `
            /* Enhanced CSS Variables Font & Color Configuration - UPDATED: Georgia Font Defaults + New Background */
            
            /* Headings - Georgia serif fonts */
            h1, h2, h3, h4, h5, h6,
            .page-title h1,
            .title-container h2,
            .preview-info h3,
            .measuring-guide summary h3,
            .form-group h3 {
                font-family: var(--font-heading-family, Georgia, "Times New Roman", Times, serif) !important;
                font-style: var(--font-heading-style, normal) !important;
                font-weight: var(--font-heading-weight, 700) !important;
                letter-spacing: calc(var(--font-heading-scale, 1) * 0.06rem) !important;
                color: var(--color-text, #333333) !important;
                line-height: calc(1 + 0.3 / max(1, var(--font-heading-scale, 1))) !important;
                word-break: break-word !important;
            }
            
            /* Body text - Georgia serif fonts */
            body,
            p,
            .guide-content p,
            .order-line,
            .disclaimer p,
            .loading-message {
                font-family: var(--font-body-family, Georgia, "Times New Roman", Times, serif) !important;
                font-style: var(--font-body-style, normal) !important;
                font-weight: var(--font-body-weight, 400) !important;
                font-size: calc(1rem * var(--font-body-scale, 1)) !important;
                color: var(--color-text, #333333) !important;
            }
            
            /* Background colors - UPDATED: Page background #fdfaf3, containers white */
            body {
                background: var(--color-background, #fdfaf3) !important;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                line-height: 1.6;
            }
            
            /* Container backgrounds - WHITE for content areas */
            .calculator-section,
            .preview-section,
            .measuring-guide {
                background: #FFFFFF !important;
                border: 1px solid var(--color-border, #E9ECEF) !important;
            }
            
            /* Form inputs - Georgia fonts with WHITE backgrounds */
            .form-group select,
            .form-group input,
            .form-group textarea {
                font-family: var(--font-body-family, Georgia, "Times New Roman", Times, serif) !important;
                font-style: var(--font-body-style, normal) !important;
                font-weight: var(--font-body-weight, 400) !important;
                background: #FFFFFF !important;
                color: var(--color-text, #333333) !important;
                border: 2px solid var(--color-border, #E9ECEF) !important;
            }
            
            .form-group select:focus,
            .form-group input:focus,
            .form-group textarea:focus {
                border-color: var(--color-accent, #007BFF) !important;
            }
            
            /* Dropdown options - Georgia fonts with WHITE backgrounds */
            .dropdown-selected,
            .dropdown-option,
            .option-text,
            .dropdown-search input {
                font-family: var(--font-body-family, Georgia, "Times New Roman", Times, serif) !important;
                font-weight: var(--font-body-weight, 400) !important;
            }
            
            .dropdown-selected {
                background: #FFFFFF !important;
            }
            
            .dropdown-options {
                background: #FFFFFF !important;
            }
            
            .dropdown-search {
                background: #f8f9fa !important;
            }
            
            .dropdown-search input {
                background: #FFFFFF !important;
            }
            
            .selected-text {
                font-family: var(--font-body-family, Georgia, "Times New Roman", Times, serif) !important;
            }
            
            /* Buttons - Georgia fonts */
            .btn {
                font-family: var(--font-body-family, Georgia, "Times New Roman", Times, serif) !important;
                font-weight: var(--font-body-weight-bold, 700) !important;
                background: var(--color-button-background, #F8F9FA) !important;
                color: var(--color-button-text, #333333) !important;
                border: 2px solid var(--color-button-outline, #DEE2E6) !important;
                letter-spacing: 0.05em;
            }
            
            .btn:hover:not(:disabled) {
                background: var(--color-accent, #007BFF) !important;
                color: #FFFFFF !important;
                border-color: var(--color-accent, #007BFF) !important;
                box-shadow: 0 4px 12px var(--color-shadow, rgba(0,0,0,0.15)) !important;
            }
            
            /* UI elements - Georgia fonts */
            .dimension-input span {
                font-family: var(--font-body-family, Georgia, "Times New Roman", Times, serif) !important;
                font-weight: var(--font-body-weight-bold, 700) !important;
                color: var(--color-text, #333333) !important;
            }
            
            /* Bold elements */
            strong,
            .order-line strong {
                font-weight: var(--font-body-weight-bold, 700) !important;
                color: var(--color-text, #333333) !important;
            }
            
            /* Canvas and preview styling */
            #previewCanvas {
                border: 2px solid var(--color-border, #E9ECEF) !important;
            }
            
            #previewCanvas:hover {
                border-color: var(--color-accent, #007BFF) !important;
                box-shadow: 0 4px 8px var(--color-shadow, rgba(0,0,0,0.1)) !important;
            }
            
            /* Responsive font sizes */
            .page-title h1 {
                font-size: calc(1.75rem * var(--font-heading-scale, 1)) !important;
                margin-bottom: 0.5rem;
            }
            
            .form-group h3 {
                font-size: calc(1rem * var(--font-heading-scale, 1)) !important;
                margin-bottom: 15px;
            }
            
            .title-container h2 {
                font-size: calc(1.25rem * var(--font-heading-scale, 1)) !important;
            }
            
            .preview-info h3 {
                font-size: calc(1.1rem * var(--font-heading-scale, 1)) !important;
            }
            
            .measuring-guide summary h3 {
                font-size: calc(1rem * var(--font-heading-scale, 1)) !important;
            }
            
            .page-title p {
                font-size: calc(1rem * var(--font-body-scale, 1)) !important;
                font-family: var(--font-body-family, Georgia, "Times New Roman", Times, serif) !important;
                color: var(--color-text, #333333) !important;
                opacity: 0.7;
            }
            
            /* Quote form elements - Georgia fonts with WHITE backgrounds */
            .quote-form h3,
            .quote-form label,
            .quote-form input,
            .quote-form textarea,
            .checkbox-group label {
                font-family: var(--font-body-family, Georgia, "Times New Roman", Times, serif) !important;
            }
            
            .quote-form {
                background: #f8f9fa !important;
            }
            
            .quote-form input,
            .quote-form textarea {
                background: #FFFFFF !important;
            }
            
            /* Product links - Georgia fonts */
            .product-links a {
                font-family: var(--font-heading-family, Georgia, "Times New Roman", Times, serif) !important;
            }
        `;
        
        styleElement.textContent = css;
    }
    
    // Public API methods
    getCurrentStyling() {
        return this.currentStyling || this.fallbackDefaults;
    }
    
    updateStyling(newStyling) {
        const styling = this.mergeDeep(this.currentStyling, newStyling);
        this.applyStyling(styling);
        this.currentStyling = styling;
        console.log('🎨 Styling updated:', styling);
    }
    
    getAvailablePresets() {
        return Object.keys(this.presets).map(key => ({
            key,
            ...this.presets[key]
        }));
    }
    
    applyPreset(presetName) {
        const styling = this.getPresetStyling(presetName);
        if (Object.keys(styling).length > 0) {
            this.applyStyling(styling);
            this.currentStyling = styling;
            console.log(`🎨 Applied preset: ${presetName}`);
            return true;
        }
        return false;
    }
    
    // Utility method for deep merging objects
    mergeDeep(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.mergeDeep(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.cssVariablesFontConfig = new CSSVariablesFontConfig();
    console.log('🎨 Enhanced CSS Variables Font Configuration initialized with Georgia fonts and new background #fdfaf3');
    
    // Debug functions for console testing
    window.testCSSPreset = function(preset) {
        return window.cssVariablesFontConfig.applyPreset(preset);
    };
    
    window.showCurrentStyling = function() {
        console.table(window.cssVariablesFontConfig.getCurrentStyling());
    };
    
    window.showAvailablePresets = function() {
        console.table(window.cssVariablesFontConfig.getAvailablePresets());
    };
    
    // NEW: Convenience function to force Georgia fonts
    window.applyGeorgiaFonts = function() {
        const georgiaConfig = {
            fonts: {
                headingFamily: 'Georgia, "Times New Roman", Times, serif',
                headingWeight: '700',
                bodyFamily: 'Georgia, "Times New Roman", Times, serif',
                bodyWeight: '400',
                bodyWeightBold: '700'
            }
        };
        window.cssVariablesFontConfig.updateStyling(georgiaConfig);
        console.log('🎨 Georgia fonts applied everywhere!');
    };
    
    // NEW: Convenience function to apply new background color
    window.applyNewBackground = function() {
        const backgroundConfig = {
            colors: {
                background: '#fdfaf3'
            }
        };
        window.cssVariablesFontConfig.updateStyling(backgroundConfig);
        console.log('🎨 New background color #fdfaf3 applied!');
    };
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSVariablesFontConfig;
} else {
    window.CSSVariablesFontConfig = CSSVariablesFontConfig;
}
