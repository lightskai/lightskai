// Configuration and API settings
export const CONFIG = {
    SUPABASE_URL: 'https://khhrkgevrhtdlwcdxvbs.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaHJrZ2V2cmh0ZGx3Y2R4dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzA5NTIsImV4cCI6MjA3ODQ0Njk1Mn0.wqd6Uds-7pEr0p1MCrZKRzLzqOPS7ziZO8eGNs_G59c',
    MAX_FILE_SIZE: 1024 * 1024 * 1024, // 1GB
    PRODUCTION_URL: 'https://lightskai.com',
    getRedirectUrl() {
        // Use local development URL if running on localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const origin = window.location.origin;
            const pathname = window.location.pathname;
            // Normalize index.html to root path for cleaner URLs
            return pathname === '/index.html' ? origin + '/' : origin + pathname;
        }
        return this.PRODUCTION_URL;
    }
};

// Configure PDF.js worker
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}