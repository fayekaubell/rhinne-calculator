// Auto-resize Communication System
// Automatically sends height updates to parent window for true auto-sizing

class AutoResize {
    constructor() {
        this.lastHeight = 0;
        this.resizeObserver = null;
        this.resizeTimeout = null;
        this.isInIframe = window !== window.parent;
        this.minHeight = 300; // Lower minimum to start with actual content
        
        this.init();
    }
    
    init() {
        console.log('🔄 Auto-resize system initializing...', {
            isInIframe: this.isInIframe,
            initialHeight: document.documentElement.scrollHeight
        });
        
        if (this.isInIframe) {
            // We're in an iframe - set up auto-resize communication
            this.setupResizeObserver();
            this.sendInitialHeight();
            this.setupContentObservers();
        } else {
            console.log('📄 Running standalone - no auto-resize needed');
        }
    }
    
    getCurrentHeight() {
        // Wait for any pending layout changes
        return new Promise((resolve) => {
            // Use requestAnimationFrame to ensure all layout is complete
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const body = document.body;
                    const html = document.documentElement;
                    
                    // Get the actual rendered height using multiple methods
                    const heights = [
                        body.scrollHeight,
                        body.offsetHeight,
                        html.clientHeight,
                        html.scrollHeight,
                        html.offsetHeight,
                        body.getBoundingClientRect().height,
                        html.getBoundingClientRect().height
                    ];
                    
                    // Also check the container specifically
                    const container = document.querySelector('.container');
                    if (container) {
                        const containerRect = container.getBoundingClientRect();
                        const containerBottom = containerRect.bottom;
                        const containerScrollHeight = container.scrollHeight;
                        const bodyPaddingTop = parseInt(getComputedStyle(body).paddingTop) || 0;
                        const bodyPaddingBottom = parseInt(getComputedStyle(body).paddingBottom) || 0;
                        
                        heights.push(containerBottom + bodyPaddingBottom);
                        heights.push(containerScrollHeight + bodyPaddingTop + bodyPaddingBottom);
                    }
                    
                    // Find the maximum realistic height
                    const maxHeight = Math.max(...heights.filter(h => h > 0 && h < 10000));
                    const finalHeight = Math.max(this.minHeight, maxHeight);
                    
                    console.log('📏 Height calculation:', {
                        bodyScrollHeight: body.scrollHeight,
                        htmlScrollHeight: html.scrollHeight,
                        bodyRect: body.getBoundingClientRect().height,
                        containerHeight: container ? container.getBoundingClientRect().bottom : 'N/A',
                        finalHeight: finalHeight
                    });
                    
                    resolve(finalHeight);
                });
            });
        });
    }
    
    sendHeightToParent(height) {
        if (!this.isInIframe) return;
        
        try {
            window.parent.postMessage({
                type: 'calculator-resize',
                height: height,
                source: 'wallpaper-calculator'
            }, '*');
            
            console.log(`📤 Sent height update: ${height}px`);
        } catch (error) {
            console.warn('⚠️ Could not send height to parent:', error);
        }
    }
    
    async checkAndUpdateHeight() {
        const currentHeight = await this.getCurrentHeight();
        
        // Only send update if height changed significantly (avoid spam)
        if (Math.abs(currentHeight - this.lastHeight) > 10) {
            this.lastHeight = currentHeight;
            this.sendHeightToParent(currentHeight);
        }
        
        return currentHeight;
    }
    
    sendInitialHeight() {
        // Wait for content to be fully rendered before measuring
        const measureAndSend = async () => {
            const height = await this.getCurrentHeight();
            console.log(`📐 Initial height measurement: ${height}px`);
            this.sendHeightToParent(height);
        };
        
        // Multiple measurement points to catch different loading stages
        setTimeout(measureAndSend, 100);   // Quick measurement
        setTimeout(measureAndSend, 500);   // After images/fonts load
        setTimeout(measureAndSend, 1000);  // Final measurement
        
        // Also measure after all resources are loaded
        if (document.readyState === 'complete') {
            setTimeout(measureAndSend, 200);
        } else {
            window.addEventListener('load', () => {
                setTimeout(measureAndSend, 300);
            });
        }
    }
    
    setupResizeObserver() {
        if (!window.ResizeObserver) {
            console.warn('ResizeObserver not supported, using fallback');
            this.setupFallbackObserver();
            return;
        }
        
        this.resizeObserver = new ResizeObserver(async (entries) => {
            // Debounce rapid changes
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(async () => {
                await this.checkAndUpdateHeight();
            }, 150);
        });
        
        // Observe the document body and main container for size changes
        this.resizeObserver.observe(document.body);
        this.resizeObserver.observe(document.documentElement);
        
        // Also observe the main container specifically
        const container = document.querySelector('.container');
        if (container) {
            this.resizeObserver.observe(container);
        }
        
        console.log('✅ ResizeObserver attached to body, html, and container');
    }
    
    setupFallbackObserver() {
        // Fallback: check height periodically with actual measurement
        setInterval(async () => {
            await this.checkAndUpdateHeight();
        }, 2000);
        
        console.log('📊 Fallback height checking enabled (every 2s)');
    }
    
    setupContentObservers() {
        // Listen for specific calculator events that change content size
        
        // When preview section becomes visible
        const previewSection = document.getElementById('previewSection');
        if (previewSection) {
            const observer = new MutationObserver(async (mutations) => {
                mutations.forEach(async (mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        // Preview section visibility changed
                        setTimeout(async () => {
                            await this.checkAndUpdateHeight();
                        }, 200);
                    }
                });
            });
            
            observer.observe(previewSection, {
                attributes: true,
                attributeFilter: ['style']
            });
        }
        
        // When canvas loads/changes
        const canvas = document.getElementById('previewCanvas');
        if (canvas) {
            canvas.addEventListener('load', async () => {
                setTimeout(async () => {
                    await this.checkAndUpdateHeight();
                }, 300);
            });
        }
        
        // When forms change (measuring guide, etc.)
        document.addEventListener('click', async (e) => {
            if (e.target.tagName === 'SUMMARY' || e.target.closest('summary')) {
                // Details/summary clicked - content height will change
                setTimeout(async () => {
                    await this.checkAndUpdateHeight();
                }, 400); // Longer delay for animation
            }
        });
        
        // When preview is generated
        document.addEventListener('previewGenerated', async () => {
            setTimeout(async () => {
                await this.checkAndUpdateHeight();
            }, 600); // Longer delay for canvas rendering
        });
        
        // Watch for any DOM changes that might affect height
        const domObserver = new MutationObserver(async (mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if any meaningful content was added
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            shouldUpdate = true;
                        }
                    });
                }
            });
            
            if (shouldUpdate) {
                setTimeout(async () => {
                    await this.checkAndUpdateHeight();
                }, 300);
            }
        });
        
        domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('👂 Content observers attached with DOM monitoring');
    }
    
    // Public method to manually trigger height update
    async updateHeight() {
        return await this.checkAndUpdateHeight();
    }
    
    // Method to set minimum height
    setMinHeight(height) {
        this.minHeight = height;
        this.checkAndUpdateHeight();
    }
}

// Initialize auto-resize system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.autoResize = new AutoResize();
});

// Also trigger on window load for any late content
window.addEventListener('load', async function() {
    if (window.autoResize) {
        setTimeout(async () => {
            await window.autoResize.updateHeight();
        }, 400);
    }
});

// Trigger height update when preview is generated
window.addEventListener('previewComplete', async function() {
    if (window.autoResize) {
        setTimeout(async () => {
            await window.autoResize.updateHeight();
        }, 500);
    }
});

// Export for manual use
window.triggerResize = async function() {
    if (window.autoResize) {
        return await window.autoResize.updateHeight();
    }
};
