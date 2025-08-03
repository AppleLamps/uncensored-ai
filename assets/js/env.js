// Environment configuration for Vercel deployment
// This file handles loading environment variables from the build process

// Environment variables are injected at build time by Vite
window.ENV = {
    OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY || null
};

// For development, fallback to localStorage if no env variable is available
if (!window.ENV.OPENROUTER_API_KEY && typeof window !== 'undefined') {
    window.ENV.OPENROUTER_API_KEY = localStorage.getItem('openrouter_api_key');
}