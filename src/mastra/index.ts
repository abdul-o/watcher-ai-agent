
// src/mastra/index.ts (CLEANED)

import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';

// Import only your agent
import { watchmanAgent } from "./agents/watchman-agent"; 


export const mastra = new Mastra({
    // Removed: workflows
    
    agents: {
        // Only your agent is registered here
        watchman: watchmanAgent, 
    },
    
    // Removed: scorers
    
    storage: new LibSQLStore({
        url: ":memory:",
    }),
    logger: new PinoLogger({
        name: 'Mastra',
        level: 'info',
    }),
    telemetry: {
        enabled: false, 
    },
    observability: {
        default: { enabled: true }, 
    },
});