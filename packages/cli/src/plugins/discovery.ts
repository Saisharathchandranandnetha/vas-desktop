import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { SystemPlugin } from '../types.js';
import { logger } from '../logger/index.js';

export class PluginRegistry {
  private plugins: Map<string, SystemPlugin> = new Map();

  public async discoverAndLoad(pluginsDir: string): Promise<void> {
    try {
      const resolvedDir = path.resolve(pluginsDir);
      logger.info({ resolvedDir }, `Scanning for plugins`);
      
      let items;
      try {
        items = await fs.readdir(resolvedDir, { withFileTypes: true });
      } catch (e) {
        logger.warn(`Plugin directory ${resolvedDir} does not exist or cannot be read. Skipping plugin discovery.`);
        return;
      }

      for (const fileInfo of items) {
        if (!fileInfo.isDirectory()) continue;

        const pluginPath = path.join(resolvedDir, fileInfo.name);
        const packageJsonPath = path.join(pluginPath, 'package.json');

        try {
          const packageJsonData = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
          if (!packageJsonData.main) {
            logger.debug(`Plugin ${fileInfo.name} missing 'main' in package.json. Skipping.`);
            continue;
          }

          const absoluteEntryPoint = path.resolve(pluginPath, packageJsonData.main);
          
          // Execute dynamic ESM import using file URI protocol (for Windows support)
          // Node on Windows requires file:// URIs for absolute paths in import()
          const moduleUrl = new URL(`file://${absoluteEntryPoint}`).href;
          logger.debug({ moduleUrl }, `Attempting to load plugin`);
          
          const imported = await import(moduleUrl);
          const rawPlugin = imported.default || imported;
          
          this.validateAndRegister(rawPlugin);
          logger.info(`Successfully loaded plugin: ${rawPlugin.name}`);
        } catch (innerError) {
          logger.error({ err: innerError, plugin: fileInfo.name }, `Failed to load plugin`);
        }
      }
    } catch (outerError) {
      logger.error({ err: outerError }, 'Fatal error during plugin discovery');
    }
  }

  private validateAndRegister(plugin: any): void {
    if (
      plugin &&
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string' &&
      Array.isArray(plugin.commands)
    ) {
      this.plugins.set(plugin.name, plugin as SystemPlugin);
    } else {
      throw new Error(`Plugin ${plugin?.name} does not conform to SystemPlugin interface.`);
    }
  }

  public getPlugins(): SystemPlugin[] {
    return Array.from(this.plugins.values());
  }
}
