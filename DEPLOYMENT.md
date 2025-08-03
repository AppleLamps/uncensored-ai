# Vercel Deployment Guide

This application is configured to work seamlessly with Vercel using the `google/gemini-2.5-flash` model through OpenRouter.

## Environment Variables

You need to set up the following environment variable in your Vercel project:

- `VITE_OPENROUTER_API_KEY`: Your OpenRouter API key

## Vercel Setup Instructions

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket)

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login and click "New Project"
   - Import your repository

3. **Configure Environment Variables:**
   - In your Vercel project dashboard, go to "Settings" → "Environment Variables"
   - Add: `VITE_OPENROUTER_API_KEY` with your OpenRouter API key value
   - Make sure to select all environments (Production, Preview, Development)

4. **Deploy:**
   - Vercel will automatically build and deploy your application
   - The build process uses the settings from `vercel.json`

## OpenRouter API Key

To get your OpenRouter API key:

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Navigate to your API keys section
4. Create a new API key
5. Copy the key and add it to Vercel's environment variables

## Model Information

This application is configured to use only:
- **Model**: `google/gemini-2.5-flash`
- **Provider**: OpenRouter
- **Features**: Fast responses, efficient token usage

## Local Development

For local development, you can either:
1. Set the `VITE_OPENROUTER_API_KEY` environment variable in a `.env` file
2. Or manually enter your API key in the Settings page of the application

## Build Configuration

The application uses:
- **Framework**: Vite
- **Output Directory**: `dist`
- **Build Command**: `npm run build`
- **Node Version**: >=16.0.0

## Security Features

The Vercel configuration includes security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin