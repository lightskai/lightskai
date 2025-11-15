import { FileHandler } from './file-handler.js';
import { UI } from './ui-manager.js';

// AI analysis and OpenAI integration
export const AIProcessor = {
    async runAIAnalysis() {
        const copyPromptBtn = document.getElementById('copyPromptBtn');
        const runAIBtn = document.getElementById('runAIBtn');
        const aiResultsDisplay = document.getElementById('aiResultsDisplay');
        const copyResultsBtn = document.getElementById('copyResultsBtn');
        
        const promptText = copyPromptBtn?.dataset.promptText;
        if (!promptText) {
            alert('No prompt available. Please select a report option.');
            return;
        }
        
        if (!window.appState.currentFile) {
            alert('Please upload a file first.');
            return;
        }
        
        if (runAIBtn) runAIBtn.disabled = true;
        
        // Status messages to cycle through
        const statusMessages = [
            '⏳ Initializing...',
            '📄 Reading document...',
            '🔍 Extracting text...',
            '🤖 Analyzing with AI...',
            '💭 Processing insights...',
            '✨ Finalizing results...'
        ];
        
        let messageIndex = 0;
        
        // Function to update button with spinner and message
        const updateButtonStatus = (message) => {
            if (runAIBtn) {
                runAIBtn.innerHTML = `
                    <span class="spinner-container">
                        <span class="ai-spinner"></span>
                    </span>
                    <span>${message}</span>
                `;
            }
        };
        
        // Start with first message
        updateButtonStatus(statusMessages[messageIndex]);
        
        // Rotate through status messages every 3 seconds
        const statusInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % statusMessages.length;
            updateButtonStatus(statusMessages[messageIndex]);
        }, 3000);
        
        // Show loading state in results
        if (aiResultsDisplay) {
            aiResultsDisplay.innerHTML = `
                <div class="ai-results-loading">
                    <div class="ai-results-spinner"></div>
                    <div>Reading document and analyzing with AI...</div>
                    <div style="margin-top: 12px; font-size: 13px; color: #64748b;">This may take 30-60 seconds depending on file size</div>
                </div>
            `;
        }
        
        try {
            // Step 1: Extract text from the uploaded file
            updateButtonStatus('📄 Reading document...');
            const fileText = await FileHandler.extractTextFromFile(window.appState.currentFile);
            
            if (!fileText || fileText.trim().length === 0) {
                throw new Error('Could not extract text from the file. Please ensure the file contains readable text.');
            }
            
            // Step 2: Get OpenAI API key
            updateButtonStatus('🔑 Connecting to AI...');
            if (!window.appState.openAIKey && window.API) {
                window.appState.openAIKey = await window.API.getOpenAIKey();
                if (!window.appState.openAIKey) {
                    throw new Error('OpenAI API key not configured. Please contact support.');
                }
            }
            
            // Step 3: Call OpenAI API with the document text and prompt
            updateButtonStatus('🤖 AI is analyzing...');
            if (aiResultsDisplay) {
                aiResultsDisplay.innerHTML = `
                    <div class="ai-results-loading">
                        <div class="ai-results-spinner"></div>
                        <div><strong>AI Analysis in Progress</strong></div>
                        <div style="margin-top: 12px; font-size: 13px; color: #64748b;">
                            Processing your document with advanced AI...<br>
                            Document length: ${Math.round(fileText.length / 1000)}K characters
                        </div>
                    </div>
                `;
            }
            
            const result = await this.callOpenAI(promptText, fileText);
            
            // Clear the interval
            clearInterval(statusInterval);
            
            // Step 4: Display results
            window.appState.aiResults = result;
            if (aiResultsDisplay) {
                aiResultsDisplay.innerHTML = result;
            }
            
            if (copyResultsBtn) {
                copyResultsBtn.style.display = 'inline-flex';
                copyResultsBtn.dataset.resultsText = result;
            }
            
            // Enable Generate Report button
            UI.updateGenerateReportButton();
            
            // Success feedback
            if (aiResultsDisplay) {
                const successMsg = document.createElement('div');
                successMsg.className = 'ai-success-badge';
                successMsg.textContent = '✓ Analysis Complete';
                successMsg.style.cssText = 'background: #d1fae5; color: #059669; padding: 8px 16px; border-radius: 6px; margin-bottom: 12px; font-weight: 600; text-align: center;';
                aiResultsDisplay.insertBefore(successMsg, aiResultsDisplay.firstChild);
            }
            
            // Show success state in button
            if (runAIBtn) {
                runAIBtn.innerHTML = '✓ Analysis Complete';
                setTimeout(() => {
                    if (runAIBtn) runAIBtn.innerHTML = '🤖 Run AI Analysis';
                    if (runAIBtn) runAIBtn.disabled = false;
                }, 2000);
            }
            
        } catch (error) {
            console.error('AI analysis error:', error);
            
            // Clear the interval
            clearInterval(statusInterval);
            
            // Show error state
            if (aiResultsDisplay) {
                aiResultsDisplay.innerHTML = `
                    <div style="color: #dc2626; text-align: center; padding: 20px;">
                        <div style="font-weight: 600; margin-bottom: 8px;">❌ Analysis Failed</div>
                        <div>${error.message}</div>
                    </div>
                `;
            }
            
            if (runAIBtn) {
                runAIBtn.innerHTML = '🤖 Run AI Analysis';
                runAIBtn.disabled = false;
            }
        }
    },

    async callOpenAI(promptText, fileText) {
        if (!window.appState.openAIKey) {
            throw new Error('OpenAI API key not available');
        }

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.appState.openAIKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert meeting analyst. Analyze the provided meeting transcript or notes and provide detailed insights based on the specific requirements given.'
                    },
                    {
                        role: 'user',
                        content: `${promptText}\n\n=== DOCUMENT CONTENT ===\n\n${fileText}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000
            })
        });
        
        if (!aiResponse.ok) {
            const errorData = await aiResponse.json();
            console.error('OpenAI API error:', errorData);
            throw new Error(errorData.error?.message || `API request failed with status ${aiResponse.status}`);
        }
        
        const data = await aiResponse.json();
        
        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response received from AI. Please try again.');
        }
        
        return data.choices[0].message.content;
    },

    formatAIResults(results) {
        // Basic formatting for AI results
        return results.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }
};