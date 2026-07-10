import { cosmiconfig } from 'cosmiconfig';
import { Config, ConfigSchema } from '../types.js';

const moduleName = 'vas';

export async function loadConfig(): Promise<Config> {
  const explorer = cosmiconfig(moduleName);
  
  try {
    const result = await explorer.search();
    
    if (!result || result.isEmpty) {
      // Return default config if none found
      return ConfigSchema.parse({});
    }

    // Validate the raw config with Zod
    return ConfigSchema.parse(result.config);
  } catch (error) {
    console.error(`Failed to load or parse configuration:`, error);
    throw error;
  }
}
