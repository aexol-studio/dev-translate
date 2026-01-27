import { Chain, HOST, ModelTypes, Languages } from './src/zeus/index.js';
import { LogLevels, BackendProps, LangPair } from '@aexol/dev-translate-core';

/**
 * Options for creating a DevTranslate client
 */
export interface DevTranslateClientOptions {
  /** API key for authentication */
  apiKey: string;
  /** Custom host URL (defaults to DevTranslate backend) */
  host?: string;
  /** Additional headers to include in requests */
  headers?: Record<string, string>;
}

/**
 * Translation input for SDK methods
 */
export type TranslateInput = Omit<ModelTypes['TranslateInput'], 'content' | 'languages'> & {
  content: string;
  languages: Languages[];
};

/**
 * Single translation result
 */
export interface TranslationResult {
  result: string;
  language: Languages;
  consumedTokens: number;
}

/**
 * Prediction response for translation cost
 */
export interface PredictionResult {
  cost: number;
  cached: number;
}

const DEV_TRANSLATE_HOST = process.env.OVERRIDE_DEV_TRANSLATE_HOST || HOST;

/**
 * DevTranslate SDK client for interacting with the translation API
 */
export class DevTranslateClient {
  private readonly host: string;
  private readonly apiKey: string;
  private readonly customHeaders: Record<string, string>;

  constructor(options: DevTranslateClientOptions) {
    this.apiKey = options.apiKey;
    this.host = options.host || DEV_TRANSLATE_HOST;
    this.customHeaders = options.headers || {};
  }

  private getChain() {
    return Chain(this.host, {
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...this.customHeaders,
      },
    });
  }

  /**
   * Translate content to specified languages
   * @param input Translation input with content and target languages
   * @returns Array of translation results
   */
  async translate(input: TranslateInput): Promise<TranslationResult[]> {
    const chain = this.getChain();
    const response = await chain('mutation')({
      api: {
        translate: [
          { translate: input },
          {
            results: {
              result: true,
              language: true,
              consumedTokens: true,
            },
          },
        ],
      },
    });

    const results = response.api?.translate?.results;
    if (!results) {
      return [];
    }

    return results.map((r) => ({
      result: r.result,
      language: r.language,
      consumedTokens: Number(r.consumedTokens),
    }));
  }

  /**
   * Predict the cost of a translation operation
   * @param input Translation input to predict cost for
   * @returns Prediction with cost and cached token counts
   */
  async predictTranslationCost(input: TranslateInput): Promise<PredictionResult> {
    const chain = this.getChain();
    const response = await chain('query')({
      api: {
        predictTranslationCost: [
          { translate: input },
          {
            cost: true,
            cached: true,
          },
        ],
      },
    });

    const prediction = response.api?.predictTranslationCost;
    return {
      cost: Number(prediction?.cost ?? 0),
      cached: Number(prediction?.cached ?? 0),
    };
  }

  /**
   * Clear the translation cache for your account
   * @param projectId Optional project ID to clear cache for specific project
   * @returns true if cache was cleared successfully
   */
  async clearCache(projectId?: string): Promise<boolean> {
    const chain = this.getChain();
    const response = await chain('mutation')({
      api: {
        clearCache: [{ projectId }, true],
      },
    });

    return response.api?.clearCache ?? false;
  }
}

/**
 * Create a new DevTranslate client
 * @param options Client configuration options
 * @returns DevTranslateClient instance
 */
export function createClient(options: DevTranslateClientOptions): DevTranslateClient {
  return new DevTranslateClient(options);
}

// Re-export types - Languages and ModelTypes from local Zeus, others from core
export { Languages, LogLevels, BackendProps, LangPair };
export type { ModelTypes };
