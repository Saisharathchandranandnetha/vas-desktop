// ─── VAS Desktop — Models Route ───
// GET /v1/models — Returns all enabled models in OpenAI ModelList format.
import type { FastifyInstance } from 'fastify';
import type { ModelListResponse, ModelObject } from '@vas/shared';

/**
 * Registers the models list route.
 */
export async function registerModelRoutes(server: FastifyInstance): Promise<void> {
  server.get('/v1/models', async (_request, reply) => {
    try {
      // Read providers from settings store
      let providers: Array<{
        id: string;
        name: string;
        type: string;
        isEnabled: boolean;
        modelsDiscovered: string[];
      }> = [];

      try {
        const { getSettingsStore } = await import('../main/ipc/settings.js');
        const store = getSettingsStore();
        const allProviders = (store.get('providers') as typeof providers) ?? [];
        providers = allProviders.filter((p) => p.isEnabled);
      } catch {
        // Settings store may not be available yet
      }

      // Aggregate all models from all enabled providers
      const models: ModelObject[] = [];

      for (const provider of providers) {
        for (const modelId of provider.modelsDiscovered) {
          models.push({
            id: modelId,
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: provider.name.toLowerCase().replace(/\s+/g, '-'),
          });
        }
      }

      // Sort alphabetically by model ID
      models.sort((a, b) => a.id.localeCompare(b.id));

      const response: ModelListResponse = {
        object: 'list',
        data: models,
      };

      return reply.status(200).send(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({
        error: {
          message: `Failed to list models: ${message}`,
          type: 'server_error',
          code: 'internal_error',
        },
      });
    }
  });

  // GET /v1/models/:model — Get a specific model
  server.get('/v1/models/:model', async (request, reply) => {
    try {
      const { model } = request.params as { model: string };

      let providers: Array<{
        id: string;
        name: string;
        type: string;
        isEnabled: boolean;
        modelsDiscovered: string[];
      }> = [];

      try {
        const { getSettingsStore } = await import('../main/ipc/settings.js');
        const store = getSettingsStore();
        const allProviders = (store.get('providers') as typeof providers) ?? [];
        providers = allProviders.filter((p) => p.isEnabled);
      } catch {
        // Settings store may not be available yet
      }

      // Find the model in any enabled provider
      for (const provider of providers) {
        if (provider.modelsDiscovered.includes(model)) {
          const modelObj: ModelObject = {
            id: model,
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: provider.name.toLowerCase().replace(/\s+/g, '-'),
          };
          return reply.status(200).send(modelObj);
        }
      }

      return reply.status(404).send({
        error: {
          message: `Model not found: ${model}`,
          type: 'invalid_request_error',
          code: 'model_not_found',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({
        error: {
          message: `Failed to get model: ${message}`,
          type: 'server_error',
          code: 'internal_error',
        },
      });
    }
  });

  console.log('[VAS:Gateway] Model routes registered.');
}
