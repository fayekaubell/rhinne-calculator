// Quote Form Module - Handle quote form display and interactions
// Creates side-by-side buttons and expandable quote form
// UPDATED: Enhanced submission with processing states and reset functionality

// Initialize quote form functionality
function initializeQuoteForm() {
    console.log('📋 Initializing enhanced quote form functionality...');
    
    // Set up event listeners for form interactions
    setupQuoteFormEventListeners();
    
    // Set up form validation
    setupFormValidation();
    
    console.log('✅ Enhanced quote form functionality initialized');
}

// Set up event listeners for quote form
function setupQuoteFormEventListeners() {
    // Listen for when buttons are added to set up click handlers
    document.addEventListener('buttonsAdded', function() {
        const submitQuoteBtn = document.getElementById('submitQuoteForPreviewBtn');
        if (submitQuoteBtn) {
            submitQuoteBtn.addEventListener('click', toggleQuoteForm);
        }
    });
    
    // Listen for quote form submit button
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'submitQuoteBtn') {
            handleQuoteSubmission();
        }
    });
    
    // Auto-resize trigger when form expands/collapses
    document.addEventListener('quoteFormToggled', function() {
        setTimeout(() => {
            if (window.autoResize) window.autoResize.updateHeight();
        }, 500); // Wait for animation to complete
    });
    
    // Real-time validation listeners
    document.addEventListener('input', function(e) {
        if (e.target.closest('.quote-form')) {
            clearFormError(); // Clear errors when user starts typing
        }
    });
}

// Add both Download PDF and Submit Quote buttons side by side
function addDownloadAndQuoteButtons() {
    const buttonContainer = document.getElementById('buttonContainer');
    if (!buttonContainer) {
        console.error('Button container not found');
        return;
    }
    
    // Check if buttons already exist
    if (buttonContainer.querySelector('#downloadPdfBtn') || buttonContainer.querySelector('#submitQuoteForPreviewBtn')) {
        console.log('Buttons already exist, skipping creation');
        return;
    }
    
    // Clear any existing content
    buttonContainer.innerHTML = '';
    
    // Create Download PDF button
    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'downloadPdfBtn';
    downloadBtn.className = 'btn btn-primary';
    downloadBtn.textContent = 'Download PDF';
    downloadBtn.onclick = generatePDF;
    
    // Create Submit Quote button
    const quoteBtn = document.createElement('button');
    quoteBtn.id = 'submitQuoteForPreviewBtn';
    quoteBtn.className = 'btn btn-primary';
    quoteBtn.textContent = 'Submit for Quote';
    quoteBtn.onclick = toggleQuoteForm;
    
    // Add buttons to container
    buttonContainer.appendChild(downloadBtn);
    buttonContainer.appendChild(quoteBtn);
    
    // Show the button container
    buttonContainer.style.display = 'flex';
    
    // Dispatch event to notify that buttons have been added
    document.dispatchEvent(new CustomEvent('buttonsAdded'));
    
    console.log('✅ Download PDF and Submit Quote buttons added');
}

// Toggle quote form visibility with smooth animation
function toggleQuoteForm() {
    const quoteFormContainer = document.getElementById('quoteFormContainer');
    const submitQuoteBtn = document.getElementById('submitQuoteForPreviewBtn');
    
    if (!quoteFormContainer || !submitQuoteBtn) {
        console.error('Quote form elements not found');
        return;
    }
    
    const isCurrentlyVisible = quoteFormContainer.classList.contains('show');
    
    if (isCurrentlyVisible) {
        // Don't hide the form - button should not toggle
        console.log('📋 Quote form already visible - no action needed');
        return;
    } else {
        // Show the form
        quoteFormContainer.style.display = 'block';
        
        // Clear any existing errors
        clearFormError();
        
        // Small delay to ensure display change takes effect before animation
        setTimeout(() => {
            quoteFormContainer.classList.add('show');
            
            // Scroll the form into view smoothly
            setTimeout(() => {
                quoteFormContainer.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }, 200);
            
            console.log('📋 Quote form shown');
        }, 50);
    }
    
    // Dispatch event for auto-resize system
    document.dispatchEvent(new CustomEvent('quoteFormToggled'));
}

// Display form error message above submit button
function displayFormError(message) {
    clearFormError(); // Clear any existing error first
    
    const submitBtn = document.getElementById('submitQuoteBtn');
    if (!submitBtn) return;
    
    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.id = 'quoteFormError';
    errorDiv.className = 'form-error-message';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.innerHTML = `<p><em>${message}</em></p>`;
    
    // Insert before submit button
    submitBtn.parentNode.insertBefore(errorDiv, submitBtn);
    
    // Trigger auto-resize after error is shown
    setTimeout(() => {
        if (window.autoResize) window.autoResize.updateHeight();
    }, 100);
    
    console.log('📋 Form error displayed:', message);
}

// Clear form error message
function clearFormError() {
    const existingError = document.getElementById('quoteFormError');
    if (existingError) {
        existingError.remove();
        
        // Trigger auto-resize after error is removed
        setTimeout(() => {
            if (window.autoResize) window.autoResize.updateHeight();
        }, 100);
    }
}

// Update submit button state with different styles and messages
function updateSubmitButtonState(state, customMessage = '') {
    const submitBtn = document.getElementById('submitQuoteBtn');
    if (!submitBtn) return;
    
    // Remove any existing state classes
    submitBtn.classList.remove('btn-processing', 'btn-success', 'btn-error');
    
    switch (state) {
        case 'processing':
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
            submitBtn.classList.add('btn-processing');
            submitBtn.onclick = null; // Disable click during processing
            console.log('📋 Submit button: Processing state');
            break;
            
        case 'success':
            submitBtn.disabled = false;
            submitBtn.textContent = 'Quote Submitted: Click to reset calculator';
            submitBtn.classList.add('btn-success');
            // Change click handler to reset function
            submitBtn.onclick = resetCalculatorFromQuoteSuccess;
            console.log('📋 Submit button: Success state with reset function');
            break;
            
        case 'error':
            submitBtn.disabled = false;
            submitBtn.textContent = customMessage || 'Submit Quote Request';
            submitBtn.classList.add('btn-error');
            // Restore original function
            submitBtn.onclick = handleQuoteSubmission;
            
            // Reset to normal state after 5 seconds for errors
            setTimeout(() => {
                updateSubmitButtonState('ready');
            }, 5000);
            console.log('📋 Submit button: Error state');
            break;
            
        case 'ready':
        default:
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Quote Request';
            submitBtn.onclick = handleQuoteSubmission; // Restore original function
            console.log('📋 Submit button: Ready state');
            break;
    }
}

// Handle quote form submission with enhanced states and logging integration
async function handleQuoteSubmission() {
    const form = document.querySelector('.quote-form');
    if (!form) {
        console.error('Quote form not found');
        return;
    }
    
    // Clear any existing errors
    clearFormError();
    
    // Show processing state immediately
    updateSubmitButtonState('processing');
    
    // Force a small delay to ensure the processing state is visible
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        // Get form data
        const formData = {
            fullName: document.getElementById('fullName')?.value || '',
            emailAddress: document.getElementById('emailAddress')?.value || '',
            businessName: document.getElementById('businessName')?.value || '',
            additionalNotes: document.getElementById('additionalNotes')?.value || '',
            newsletterSignup: document.getElementById('newsletterSignup')?.checked || false,
            
            // Include preview data if available
            previewData: currentPreview ? {
                patternName: currentPreview.pattern.name,
                patternSku: currentPreview.pattern.sku,
                wallDimensions: `${currentPreview.formattedWidth}w x ${currentPreview.formattedHeight}h`,
                calculations: currentPreview.calculations
            } : null
        };
        
        // Enhanced validation with specific error messages
        if (!formData.fullName.trim()) {
            displayFormError('Please enter your full name');
            updateSubmitButtonState('error');
            document.getElementById('fullName')?.focus();
            return;
        }
        
        if (!formData.emailAddress.trim()) {
            displayFormError('Please enter your email address');
            updateSubmitButtonState('error');
            document.getElementById('emailAddress')?.focus();
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.emailAddress.trim())) {
            displayFormError('Please enter a valid email address');
            updateSubmitButtonState('error');
            document.getElementById('emailAddress')?.focus();
            return;
        }
        
        console.log('📋 Quote form validation passed, submitting with data:', formData);
        
        // Simulate processing time (remove in production if logging is instant)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // LOGGING: Dispatch logging event for quote submission
        if (typeof window.dispatchQuoteSubmitted === 'function') {
            try {
                await new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        reject(new Error('Logging timeout'));
                    }, 10000); // 10 second timeout
                    
                    // Listen for logging completion (if available)
                    const handleLoggingComplete = () => {
                        clearTimeout(timeoutId);
                        resolve();
                    };
                    
                    // Dispatch the logging event
                    window.dispatchQuoteSubmitted({
                        fullName: formData.fullName,
                        emailAddress: formData.emailAddress,
                        businessName: formData.businessName,
                        additionalNotes: formData.additionalNotes,
                        newsletter: formData.newsletterSignup,
                        previewData: formData.previewData,
                        submittedSuccessfully: true,
                        timestamp: new Date().toISOString()
                    });
                    
                    // For now, resolve immediately since we don't have completion callbacks
                    // In a real implementation, you'd wait for the logging to complete
                    setTimeout(handleLoggingComplete, 1000);
                });
            } catch (loggingError) {
                console.warn('⚠️ Logging failed, but continuing with form submission:', loggingError);
                // Don't fail the form submission due to logging issues
            }
        }
        
        console.log('✅ Quote submission processed successfully');
        
        // SUCCESS - Show success state with reset functionality
        updateSubmitButtonState('success');
        
        // Trigger auto-resize after success state change
        setTimeout(() => {
            if (window.autoResize) window.autoResize.updateHeight();
        }, 100);
        
    } catch (error) {
        console.error('❌ Error in quote submission:', error);
        
        // Show error state
        displayFormError('An error occurred while submitting your quote request. Please try again.');
        updateSubmitButtonState('error', 'Try Again');
    }
}

// Reset calculator when called from successful quote submission
function resetCalculatorFromQuoteSuccess() {
    console.log('🔄 Resetting calculator from successful quote submission...');
    
    // Call the main reset function if it exists
    if (typeof resetCalculator === 'function') {
        resetCalculator();
    } else {
        // Fallback manual reset
        console.log('🔄 Using fallback reset method...');
        
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
        
        // Reset quote form
        resetQuoteForm();
        
        // Scroll back to the form
        const calculatorSection = document.querySelector('.calculator-section');
        if (calculatorSection) {
            calculatorSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Trigger auto-resize update
    setTimeout(() => {
        if (window.autoResize) window.autoResize.updateHeight();
    }, 300);
    
    console.log('✅ Calculator reset complete from quote success');
}

// Reset quote form to initial state
function resetQuoteForm() {
    const form = document.querySelector('.quote-form');
    if (!form) return;
    
    // Clear any errors
    clearFormError();
    
    // Reset all form fields
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('emailAddress');
    const businessInput = document.getElementById('businessName');
    const notesInput = document.getElementById('additionalNotes');
    const newsletterInput = document.getElementById('newsletterSignup');
    
    if (fullNameInput) fullNameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (businessInput) businessInput.value = '';
    if (notesInput) notesInput.value = '';
    if (newsletterInput) newsletterInput.checked = false;
    
    // Remove validation classes
    [fullNameInput, emailInput, businessInput, notesInput].forEach(input => {
        if (input) {
            input.classList.remove('valid', 'invalid');
        }
    });
    
    // Reset submit button
    updateSubmitButtonState('ready');
    
    // Hide the form
    const quoteFormContainer = document.getElementById('quoteFormContainer');
    if (quoteFormContainer) {
        quoteFormContainer.classList.remove('show');
        
        setTimeout(() => {
            quoteFormContainer.style.display = 'none';
        }, 400); // Wait for animation to complete
    }
    
    // Trigger auto-resize
    setTimeout(() => {
        if (window.autoResize) window.autoResize.updateHeight();
    }, 500);
    
    console.log('📋 Quote form reset');
}

// Enhanced form validation with visual feedback
function setupFormValidation() {
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('emailAddress');
    
    if (fullNameInput) {
        fullNameInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                this.classList.remove('invalid');
                this.classList.add('valid');
            } else {
                this.classList.remove('valid');
                this.classList.add('invalid');
            }
        });
        
        fullNameInput.addEventListener('input', function() {
            // Clear validation classes while typing
            this.classList.remove('valid', 'invalid');
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(this.value.trim())) {
                this.classList.remove('invalid');
                this.classList.add('valid');
            } else if (this.value.trim()) {
                this.classList.remove('valid');
                this.classList.add('invalid');
            } else {
                this.classList.remove('valid', 'invalid');
            }
        });
        
        emailInput.addEventListener('input', function() {
            // Clear validation classes while typing
            this.classList.remove('valid', 'invalid');
        });
    }
}

// Modified PDF generation reset function to also reset quote form
function resetCalculatorWithQuoteForm() {
    // Call the original reset function
    if (typeof resetCalculator === 'function') {
        resetCalculator();
    }
    
    // Also reset the quote form
    resetQuoteForm();
    
    // Hide button container
    const buttonContainer = document.getElementById('buttonContainer');
    if (buttonContainer) {
        buttonContainer.style.display = 'none';
        buttonContainer.innerHTML = '';
    }
}

// Export functions to global scope
window.quoteFormAPI = {
    initializeQuoteForm,
    addDownloadAndQuoteButtons,
    toggleQuoteForm,
    handleQuoteSubmission,
    resetQuoteForm,
    setupFormValidation,
    resetCalculatorWithQuoteForm,
    displayFormError,
    clearFormError,
    updateSubmitButtonState,
    resetCalculatorFromQuoteSuccess
};

// Override the global addDownloadButton function to use our new function
window.addDownloadButton = addDownloadAndQuoteButtons;
