import { createApp } from '../src/app';

// Create Express app
const app = createApp();

// Export for Vercel serverless
export default app;
