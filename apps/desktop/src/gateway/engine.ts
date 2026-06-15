import { getDatabase, routingRules, models, providers, type Provider, type Model } from '@vas/database';
import { eq, desc } from 'drizzle-orm';

export interface ResolvedRoute {
  provider: Provider & { decryptedApiKey?: string; headers: Record<string, string> };
  model: Model;
}

export class RoutingEngine {
  async resolve(modelReq: string, workspaceId?: string, agentId?: string): Promise<ResolvedRoute | null> {
    const db = getDatabase();

    let resolvedModelId: string | null = null;

    // 1. Check Routing Rules first
    const rulesQuery = db.select().from(routingRules)
      .where(eq(routingRules.isEnabled, true))
      .orderBy(desc(routingRules.priority));

    const rules = rulesQuery.all();

    for (const rule of rules) {
      if (rule.workspaceId && workspaceId && rule.workspaceId !== workspaceId) continue;
      if (rule.matchAgentId && agentId && rule.matchAgentId !== agentId) continue;
      
      if (rule.matchModelPattern) {
        // Simple wildcard match, e.g. "gpt-*" or exact match
        const regex = new RegExp('^' + rule.matchModelPattern.replace(/\*/g, '.*') + '$');
        if (regex.test(modelReq)) {
          resolvedModelId = rule.primaryModelId;
          break;
        }
      }
      
      // If we got here and no pattern was required but agent or workspace matched
      if (!rule.matchModelPattern && (rule.matchAgentId === agentId || rule.workspaceId === workspaceId)) {
        resolvedModelId = rule.primaryModelId;
        break;
      }
    }

    // 2. Resolve Model and Provider
    let targetModel: Model | undefined;
    let targetProvider: Provider | undefined;

    if (resolvedModelId) {
      targetModel = db.select().from(models).where(eq(models.id, resolvedModelId)).get();
      if (targetModel) {
        targetProvider = db.select().from(providers).where(eq(providers.id, targetModel.providerId)).get();
      }
    }

    // 3. Fallback: Direct modelId match in models table
    if (!targetModel || !targetProvider) {
      targetModel = db.select().from(models).where(eq(models.modelId, modelReq)).get();
      if (targetModel) {
        targetProvider = db.select().from(providers).where(eq(providers.id, targetModel.providerId)).get();
      }
    }

    // 4. Ultimate Fallback: Heuristic lookup across active providers just like before but using DB
    if (!targetModel || !targetProvider) {
      const activeProviders = db.select().from(providers).where(eq(providers.isEnabled, true)).all();
      
      let matched = activeProviders.find(p => p.type === 'openai' && (modelReq.startsWith('gpt-') || modelReq.startsWith('o1-') || modelReq.startsWith('o3-')));
      if (!matched) matched = activeProviders.find(p => p.type === 'anthropic' && modelReq.startsWith('claude-'));
      if (!matched) matched = activeProviders.find(p => p.type === 'gemini' && modelReq.startsWith('gemini-'));
      if (!matched) matched = activeProviders.find(p => p.type === 'openai_compat' && p.baseUrl.includes('deepseek') && modelReq.startsWith('deepseek-'));
      
      if (!matched) {
        matched = activeProviders.find(p => p.type === 'openai_compat') ?? activeProviders[0];
      }

      if (matched) {
        targetProvider = matched;
        targetModel = {
          id: 'temp-fallback-id',
          providerId: matched.id,
          modelId: modelReq,
          displayName: modelReq,
          contextWindow: 8192,
          maxOutputTokens: 4096,
          supportsTools: true,
          supportsStreaming: true,
          supportsVision: false,
          inputCostPer1k: 0,
          outputCostPer1k: 0,
          tags: '[]',
          isEnabled: true,
          createdAt: new Date(),
        };
      }
    }

    if (!targetModel || !targetProvider) return null;

    // Decrypt API key
    let decryptedApiKey = targetProvider.apiKey || '';
    if (decryptedApiKey) {
      try {
        const { safeStorage } = await import('electron');
        if (safeStorage && safeStorage.isEncryptionAvailable()) {
           try {
             // Attempt to decrypt if it looks like base64
             const buffer = Buffer.from(decryptedApiKey, 'base64');
             decryptedApiKey = safeStorage.decryptString(buffer);
           } catch {
             // Maybe it was just plain text or not encrypted
           }
        }
      } catch (err) {
        console.error('[VAS:RoutingEngine] Failed to decrypt API key:', err);
      }
    }

    let headers = {};
    if (targetProvider.headersJson) {
      try {
        headers = JSON.parse(targetProvider.headersJson);
      } catch {}
    }

    return {
      model: targetModel,
      provider: {
        ...targetProvider,
        decryptedApiKey,
        headers,
      }
    };
  }
}
