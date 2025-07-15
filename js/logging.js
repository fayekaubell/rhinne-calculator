// Logging Module - Google Sheets Integration for Wallpaper Calculator
// CORS-FREE VERSION: Uses GET requests with URL parameters to avoid CORS issues
// UPDATED: Sequential preview numbers from Google Sheets
// UPDATED: Remove SKU from filename generation

class CalculatorLogger {
    constructor() {
        this.config = window.CONFIG?.logging || {};
        this.enabled = this.config.enabled || false;
        this.webhookUrl = this.config.webhookUrl || '';
        this.retryAttempts = this.config.retryAttempts || 3;
        this.retryDelay = this.config.retryDelay || 1000;
        
        // Privacy settings
        this.enablePreviewLogging = this.config.enablePreviewLogging !== false; // Default true
        this.enablePDFLogging = this.config.enablePDFLogging !== false; // Default true  
        this.enableQuoteLogging = this.config.enableQuoteLogging !== false; // Default true
        
        // UPDATED: Preview number will be assigned by Google Apps Script
        this.previewNumber = null; // Will be set when preview is generated
        
        // Error tracking
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 5;
        this.temporarilyDisabled = false;
        
        this.init();
    }
    
    init() {
        if (!this.enabled) {
            console.log('📊 Calculator logging is disabled');
            return;
        }
        
        if (!this.webhookUrl) {
            console.warn('⚠️ Logging enabled but no webhook URL configured');
            return;
        }
        
        console.log('📊 Calculator logging initialized (CORS-free version):', {
            webhookUrl: this.webhookUrl ? 'Configured' : 'Missing',
            previewLogging: this.enablePreviewLogging,
            pdfLogging: this.enablePDFLogging,
            quoteLogging: this.enableQuoteLogging,
            sequentialNumbers: 'Enabled',
            method: 'GET (CORS-free)'
        });
        
        this.setupEventListeners();
        
        // Test webhook connection on initialization
        this.testWebhookConnection();
    }
    
    setupEventListeners() {
        // Listen for preview generation
        document.addEventListener('previewGenerated', (event) => {
            if (this.enablePreviewLogging && !this.temporarilyDisabled) {
                this.logGeneratePreview(event.detail || {});
            }
        });
        
        // Listen for PDF downloads
        document.addEventListener('pdfDownloaded', (event) => {
            if (this.enablePDFLogging && !this.temporarilyDisabled) {
                this.logDownloadPDF(event.detail || {});
            }
        });
        
        // Listen for quote submissions
        document.addEventListener('quoteSubmitted', (event) => {
            if (this.enableQuoteLogging && !this.temporarilyDisabled) {
                this.logSubmitQuote(event.detail || {});
            }
        });
        
        console.log('📊 Logging event listeners attached');
    }
    
    // ADDED: Test webhook connection using GET request
    async testWebhookConnection() {
        try {
            console.log('🔗 Testing webhook connection (CORS-free)...');
            
            const testUrl = `${this.webhookUrl}?action=test&timestamp=${new Date().toISOString()}`;
            
            const response = await fetch(testUrl, {
                method: 'GET',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Webhook connection test successful:', result);
                this.consecutiveErrors = 0;
                this.temporarilyDisabled = false;
            } else {
                console.warn('⚠️ Webhook connection test failed with status:', response.status);
            }
            
        } catch (error) {
            console.warn('⚠️ Webhook connection test failed:', error.message);
            // Don't disable logging on initial test failure - it might work for actual requests
        }
    }
    
    getCurrentTimestamp() {
        return new Date().toISOString();
    }
    
    getUserAgent() {
        if (!this.config.includeUserAgent) return '';
        return navigator.userAgent || '';
    }
    
    getWallDimensions() {
        if (!window.currentPreview) return { width: '', height: '' };
        
        const { wallWidthFeet, wallWidthInches, wallHeightFeet, wallHeightInches } = window.currentPreview;
        
        const widthStr = wallWidthInches > 0 ? 
            `${wallWidthFeet}' ${wallWidthInches}"` : `${wallWidthFeet}' 0"`;
        const heightStr = wallHeightInches > 0 ? 
            `${wallHeightFeet}' ${wallHeightInches}"` : `${wallHeightFeet}' 0"`;
            
        return {
            width: widthStr,
            height: heightStr
        };
    }
    
    getPatternInfo() {
        if (!window.currentPreview?.pattern) return { name: '', sku: '', display: '' };
        
        const { pattern } = window.currentPreview;
        // UPDATED: Display only shows pattern name, no SKU
        const display = pattern.name;
        
        return {
            name: pattern.name || '',
            sku: pattern.sku || '',
            display: display
        };
    }
    
    getTotalYardage() {
        if (!window.currentPreview?.calculations) return '';
        
        const { calculations } = window.currentPreview;
        
        if (calculations.saleType === 'yard') {
            return `${calculations.totalYardage} yards`;
        } else {
            // Panel-based calculation
            const yardagePerPanel = Math.round(calculations.panelLength / 3);
            const totalYardage = calculations.panelsNeeded * yardagePerPanel;
            return `${totalYardage} yards`;
        }
    }
    
    // UPDATED: Generate preview logging using GET request - ONLY action that gets NEW preview number
    async logGeneratePreview(eventData = {}) {
        if (this.temporarilyDisabled) {
            console.log('📊 Logging temporarily disabled due to errors, skipping preview log');
            return;
        }
        
        try {
            const wallDimensions = this.getWallDimensions();
            const patternInfo = this.getPatternInfo();
            const totalYardage = this.getTotalYardage();
            
            const params = {
                action: 'generate_preview',
                timestamp: this.getCurrentTimestamp(),
                wallWidth: wallDimensions.width,
                wallHeight: wallDimensions.height,
                patternSelected: patternInfo.display,
                totalYardage: totalYardage,
                userAgent: this.getUserAgent()
                // NOTE: No previewNumber sent - Google Apps Script will generate it
            };
            
            const response = await this.sendToWebhook(params);
            
            // UPDATED: Get the NEW preview number from the response
            if (response && response.previewNumber) {
                this.previewNumber = response.previewNumber;
                console.log('📊 NEW preview number assigned:', this.previewNumber);
                
                // Store the preview number globally for PDF generation and quote submission
                if (window.currentPreview) {
                    window.currentPreview.sequentialPreviewNumber = this.previewNumber;
                }
            } else {
                console.warn('⚠️ No preview number returned from webhook, using fallback');
                this.previewNumber = this.generateFallbackPreviewNumber();
                if (window.currentPreview) {
                    window.currentPreview.sequentialPreviewNumber = this.previewNumber;
                }
            }
            
            // Reset error counter on success
            this.consecutiveErrors = 0;
            this.temporarilyDisabled = false;
            
        } catch (error) {
            console.error('❌ Failed to log preview generation:', error);
            this.handleLoggingError('preview generation');
            
            // Set fallback preview number
            this.previewNumber = this.generateFallbackPreviewNumber();
            if (window.currentPreview) {
                window.currentPreview.sequentialPreviewNumber = this.previewNumber;
            }
        }
    }
    
    // UPDATED: PDF download logging - REUSES existing preview number
    async logDownloadPDF(eventData = {}) {
        if (this.temporarilyDisabled) {
            console.log('📊 Logging temporarily disabled due to errors, skipping PDF log');
            return;
        }
        
        try {
            const wallDimensions = this.getWallDimensions();
            const patternInfo = this.getPatternInfo();
            const totalYardage = this.getTotalYardage();
            
            // Generate PDF filename with sequential number
            const pdfFilename = eventData.filename || this.generatePDFFilename();
            
            // IMPORTANT: Use existing preview number, don't generate new one
            const currentPreviewNumber = this.previewNumber || 
                                       window.currentPreview?.sequentialPreviewNumber || 
                                       this.generateFallbackPreviewNumber();
            
            const params = {
                action: 'download_pdf',
                timestamp: this.getCurrentTimestamp(),
                wallWidth: wallDimensions.width,
                wallHeight: wallDimensions.height,
                patternSelected: patternInfo.display,
                totalYardage: totalYardage,
                pdfFilename: pdfFilename,
                previewNumber: currentPreviewNumber, // REUSE existing number
                userAgent: this.getUserAgent()
            };
            
            await this.sendToWebhook(params);
            console.log('📊 PDF download logged with EXISTING preview number:', currentPreviewNumber);
            
            // Reset error counter on success
            this.consecutiveErrors = 0;
            this.temporarilyDisabled = false;
            
        } catch (error) {
            console.error('❌ Failed to log PDF download:', error);
            this.handleLoggingError('PDF download');
        }
    }
    
    // UPDATED: Quote submission logging - REUSES existing preview number
    async logSubmitQuote(eventData = {}) {
        if (this.temporarilyDisabled) {
            console.log('📊 Logging temporarily disabled due to errors, skipping quote log');
            return;
        }
        
        try {
            const wallDimensions = this.getWallDimensions();
            const patternInfo = this.getPatternInfo();
            const totalYardage = this.getTotalYardage();
            
            // Get customer information from form or event data
            const customerName = eventData.fullName || document.getElementById('fullName')?.value || '';
            const customerEmail = eventData.emailAddress || document.getElementById('emailAddress')?.value || '';
            const customerBusiness = eventData.businessName || document.getElementById('businessName')?.value || '';
            const additionalNotes = eventData.additionalNotes || document.getElementById('additionalNotes')?.value || '';
            const newsletter = eventData.newsletter !== undefined ? eventData.newsletter : 
                              (document.getElementById('newsletterSignup')?.checked || false);
            
            const pdfFilename = eventData.pdfFilename || this.generatePDFFilename();
            
            // IMPORTANT: Use existing preview number, don't generate new one
            const currentPreviewNumber = this.previewNumber || 
                                       window.currentPreview?.sequentialPreviewNumber || 
                                       this.generateFallbackPreviewNumber();
            
            const params = {
                action: 'submit_quote',
                timestamp: this.getCurrentTimestamp(),
                wallWidth: wallDimensions.width,
                wallHeight: wallDimensions.height,
                patternSelected: patternInfo.display,
                totalYardage: totalYardage,
                pdfFilename: pdfFilename,
                previewNumber: currentPreviewNumber, // REUSE existing number
                userAgent: this.getUserAgent(),
                customerName: customerName,
                customerEmail: customerEmail,
                customerBusiness: customerBusiness,
                additionalNotes: additionalNotes,
                newsletter: newsletter.toString()
            };
            
            await this.sendToWebhook(params);
            console.log('📊 Quote submission logged with EXISTING preview number:', currentPreviewNumber);
            
            // Reset error counter on success
            this.consecutiveErrors = 0;
            this.temporarilyDisabled = false;
            
        } catch (error) {
            console.error('❌ Failed to log quote submission:', error);
            this.handleLoggingError('quote submission');
        }
    }
    
    // ADDED: Handle logging errors with backoff strategy
    handleLoggingError(actionType) {
        this.consecutiveErrors++;
        
        if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
            this.temporarilyDisabled = true;
            console.warn(`⚠️ Logging temporarily disabled after ${this.consecutiveErrors} consecutive errors. Calculator will continue to function normally.`);
            
            // Re-enable after 10 minutes
            setTimeout(() => {
                this.temporarilyDisabled = false;
                this.consecutiveErrors = 0;
                console.log('📊 Logging re-enabled after temporary disable');
            }, 10 * 60 * 1000);
        }
        
        console.log(`📊 Calculator continues to function normally despite ${actionType} logging error`);
    }
    
    // UPDATED: Generate PDF filename without SKU - new format: Rhinne-PatternName-Wallpaper-Preview-PreviewNumber
    generatePDFFilename() {
        if (!window.currentPreview?.pattern) return 'Rhinne-Wallpaper-Preview.pdf';
        
        const { pattern } = window.currentPreview;
        const cleanPatternName = pattern.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const previewNum = this.previewNumber || this.generateFallbackPreviewNumber();
        return `Rhinne-${cleanPatternName}-Wallpaper-Preview-${previewNum}.pdf`;
    }
    
    // ADDED: Generate fallback preview number when webhook fails
    generateFallbackPreviewNumber() {
        const timestamp = Date.now().toString();
        return timestamp.slice(-5); // Last 5 digits of timestamp
    }
    
    // UPDATED: Enhanced sendToWebhook using GET requests (CORS-free)
    async sendToWebhook(params) {
        if (!this.webhookUrl) {
            console.warn('⚠️ No webhook URL configured, skipping log');
            return null;
        }
        
        let attempt = 0;
        let lastError;
        
        while (attempt < this.retryAttempts) {
            try {
                console.log(`📤 Sending to webhook via GET (attempt ${attempt + 1}):`, {
                    action: params.action,
                    previewNumber: params.previewNumber,
                    timestamp: params.timestamp
                });
                
                // Build URL with parameters
                const url = new URL(this.webhookUrl);
                Object.keys(params).forEach(key => {
                    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                        url.searchParams.append(key, params[key]);
                    }
                });
                
                console.log('🔗 GET URL:', url.toString().substring(0, 150) + '...');
                
                // CORS-FREE: Use GET request
                const response = await fetch(url.toString(), {
                    method: 'GET',
                    cache: 'no-cache'
                });
                
                // Check if response is ok
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Parse the response to get preview number
                try {
                    const responseText = await response.text();
                    
                    if (responseText.trim()) {
                        const responseData = JSON.parse(responseText);
                        console.log('✅ Data sent to webhook successfully via GET, response:', responseData);
                        return responseData;
                    } else {
                        console.log('✅ Data sent to webhook successfully (empty response)');
                        return { success: true };
                    }
                } catch (parseError) {
                    console.log('✅ Data sent to webhook successfully (response not JSON)');
                    return { success: true };
                }
                
            } catch (error) {
                lastError = error;
                attempt++;
                
                console.warn(`⚠️ Webhook attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.retryAttempts) {
                    console.log(`🔄 Retrying in ${this.retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
            }
        }
        
        // All retries failed
        console.error(`❌ Failed to send to webhook after ${this.retryAttempts} attempts:`, lastError);
        throw new Error(`Webhook logging failed: ${lastError.message}`);
    }
    
    // Public methods for manual logging
    async manualLogPreview() {
        if (!this.enablePreviewLogging) return;
        await this.logGeneratePreview();
    }
    
    async manualLogPDF(filename = '') {
        if (!this.enablePDFLogging) return;
        await this.logDownloadPDF({ filename });
    }
    
    async manualLogQuote(formData = {}) {
        if (!this.enableQuoteLogging) return;
        await this.logSubmitQuote(formData);
    }
    
    // Utility methods
    getPreviewNumber() {
        return this.previewNumber || this.generateFallbackPreviewNumber();
    }
    
    isEnabled() {
        return this.enabled && !!this.webhookUrl && !this.temporarilyDisabled;
    }
    
    getConfig() {
        return {
            enabled: this.enabled,
            hasWebhookUrl: !!this.webhookUrl,
            previewLogging: this.enablePreviewLogging,
            pdfLogging: this.enablePDFLogging,
            quoteLogging: this.enableQuoteLogging,
            previewNumber: this.previewNumber,
            sequentialNumbers: true,
            temporarilyDisabled: this.temporarilyDisabled,
            consecutiveErrors: this.consecutiveErrors,
            method: 'GET (CORS-free)'
        };
    }
    
    // ADDED: Manual retry method
    async retryLogging() {
        if (this.temporarilyDisabled) {
            console.log('🔄 Manually re-enabling logging...');
            this.temporarilyDisabled = false;
            this.consecutiveErrors = 0;
            
            // Test the connection
            await this.testWebhookConnection();
            
            console.log('✅ Logging re-enabled manually');
        }
    }
}

// Event dispatchers - these functions trigger the logging events
// Called from other modules when actions occur

function dispatchPreviewGenerated(eventData = {}) {
    const event = new CustomEvent('previewGenerated', {
        detail: eventData
    });
    document.dispatchEvent(event);
    console.log('📊 Preview generated event dispatched');
}

function dispatchPDFDownloaded(eventData = {}) {
    const event = new CustomEvent('pdfDownloaded', {
        detail: eventData
    });
    document.dispatchEvent(event);
    console.log('📊 PDF downloaded event dispatched');
}

function dispatchQuoteSubmitted(eventData = {}) {
    const event = new CustomEvent('quoteSubmitted', {
        detail: eventData
    });
    document.dispatchEvent(event);
    console.log('📊 Quote submitted event dispatched');
}

// Initialize logging system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.calculatorLogger = new CalculatorLogger();
    
    // Export event dispatchers globally
    window.dispatchPreviewGenerated = dispatchPreviewGenerated;
    window.dispatchPDFDownloaded = dispatchPDFDownloaded;
    window.dispatchQuoteSubmitted = dispatchQuoteSubmitted;
    
    // ADDED: Global function to retry logging
    window.retryLogging = function() {
        if (window.calculatorLogger) {
            return window.calculatorLogger.retryLogging();
        }
    };
    
    console.log('📊 Calculator logging system initialized with CORS-free GET requests and sequential numbering');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CalculatorLogger, dispatchPreviewGenerated, dispatchPDFDownloaded, dispatchQuoteSubmitted };
} else {
    window.CalculatorLogger = CalculatorLogger;
}
