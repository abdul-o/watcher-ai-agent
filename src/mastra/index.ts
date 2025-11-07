
// src/mastra/index.ts (CLEANED)

import { Mastra } from '@mastra/core/mastra';




// Import only your agent
import { watchmanAgent } from "./agents/watchman-agent"; 


export const mastra = new Mastra({

bundler: {
        externals: ["axios"],
    },


    // Removed: workflows
    
    agents: {
        // Only your agent is registered here
        watchman: watchmanAgent, 
    },
    
    // Removed: scorers
    
    telemetry: {
        enabled: false, 
    },
    observability: {
        default: { enabled: true }, 
    },
});