import { loadConfig } from './config/loader.js';
import { logger } from './logger/index.js';
import { PluginRegistry } from './plugins/discovery.js';

async function bootstrap() {
  try {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    // 1. Load Configuration
    const config = await loadConfig();
    logger.info({ config }, 'VAS CLI starting');

    // 2. Discover Plugins
    const registry = new PluginRegistry();
    await registry.discoverAndLoad(config.pluginsDir);

    const plugins = registry.getPlugins();
    
    // 3. Command Dispatch (Simple Router for Part 1)
    if (command === 'tui') {
      const { startREPL } = await import('./ui/repl.js');
      startREPL(config, plugins);
      return;
    }

    if (command === 'help') {
      console.log('VAS Desktop CLI (Core Phase 0)');
      console.log('\nAvailable Plugins & Commands:');
      if (plugins.length === 0) {
        console.log('  No plugins loaded.');
      }
      for (const plugin of plugins) {
        console.log(`\nPlugin: ${plugin.name} (v${plugin.version})`);
        for (const cmd of plugin.commands) {
          console.log(`  ${cmd.name.padEnd(15)} - ${cmd.description}`);
        }
      }
      process.exit(0);
    }

    // Attempt to route to a plugin command
    let executed = false;
    for (const plugin of plugins) {
      for (const cmd of plugin.commands) {
        if (cmd.name === command) {
          logger.info(`Executing command: ${cmd.name}`);
          // Parse args naively for now
          const cmdArgs = args.slice(1).reduce((acc, curr, i) => {
            if (curr.startsWith('--')) {
              acc[curr.slice(2)] = args.slice(1)[i + 1] || true;
            }
            return acc;
          }, {} as any);
          
          await cmd.execute(cmdArgs, config);
          executed = true;
          break;
        }
      }
      if (executed) break;
    }

    if (!executed) {
      console.error(`Unknown command: ${command}`);
      console.log(`Run 'vas help' for a list of available commands.`);
      process.exit(1);
    }

  } catch (err) {
    logger.error({ err }, 'Fatal error during CLI bootstrap');
    console.error('An unexpected error occurred. Check ~/.vas/logs/cli.log for details.');
    process.exit(1);
  }
}

// Graceful shutdown handling (Part 1 Foundation)
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down...');
  logger.info('Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down...');
  logger.info('Received SIGTERM, shutting down...');
  process.exit(0);
});

bootstrap();
