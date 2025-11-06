// src/mastra/tools/fbi-search-tool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import axios from 'axios'; // axios is used for making HTTP requests

// Define the API endpoint
const FBI_WANTED_API_URL = 'https://api.fbi.gov/wanted/v1/list';

// Define the shape of the input the LLM must provide
const inputSchema = z.object({
  // The FBI API uses a 'title' query parameter which searches poster titles (often the person's name)
  name: z.string().describe("The full name (first and last) of the person to search for."),
});

// Define the shape of the output the tool returns to the LLM
const outputSchema = z.object({
  result: z.string().describe("A summary of the search results, indicating if the person was found and their details, or if no match was found."),
});

export const fbiSearchTool = createTool({
  id: 'fbi-wanted-search',
  description: 'Searches the FBI Wanted Persons list by name to check if an individual is a known fugitive or wanted person. Use this ONLY when the user asks to check a person\'s name or identity.',
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    const { name } = context;

    try {
      // The FBI API does not have a direct 'full name' search field in the query params,
      // but uses 'title' which often works for names or titles of the posters.
      
      // *** MODIFICATION: Added headers to potentially bypass 403 Forbidden errors ***
      const response = await axios.get(FBI_WANTED_API_URL, {
        params: {
          title: name,
          pageSize: 5 // Limit results to the top 5 for relevance and speed
        },
        headers: {
          // Identify the client, as some public APIs require this
          'User-Agent': 'Watchman-Agent/1.0 (Telex.im Internal Tool)', 
          'Accept': 'application/json'
        }
      });

      const data = response.data;
      const total = data.total || 0;
      
      if (total > 0 && data.items && data.items.length > 0) {
        // Person found
        const firstMatch = data.items[0];
        
        // Extract key details
        const title = firstMatch.title || 'Unknown Title';
        const crime = firstMatch.details || firstMatch.description || 'Details not available.';
        const reward = firstMatch.reward_text ? `Reward: ${firstMatch.reward_text}` : 'No reward specified.';
        const url = firstMatch.url || 'No public link.';

        return {
          result: `**MATCH FOUND!** The name '${name}' returned **${total}** result(s) in the FBI Wanted list.
            - **Title:** ${title}
            - **Status/Crime:** ${crime.substring(0, 150)}...
            - **Reward:** ${reward}
            - **More Info:** ${url}
            **CAUTION:** This individual is wanted by the FBI. Use extreme care.
          `,
        };

      } else {
        // No person found
        return {
          result: `Search for '${name}' completed. **No direct match was found** in the FBI Wanted Persons list. Please remind the user that this is not a guarantee of safety, as not all criminals are on this list.`,
        };
      }

    }
    // *** MODIFICATION: Using type assertion for a cleaner error message ***
    catch (error) {
      const err = error as Error; // Type assertion for cleaner error handling
      const errorMessage = err.message;
        
      console.error('FBI API Error:', errorMessage);
        
      return {
          // Use the safely extracted message
          result: `An error occurred while attempting to contact the wanted persons database. Please try again later. (Error: ${errorMessage.substring(0, 50)}...)`
      };
    }
  },
});