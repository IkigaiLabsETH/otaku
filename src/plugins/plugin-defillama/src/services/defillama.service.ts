import { logger, Service, type IAgentRuntime } from "@elizaos/core";

export type DefiLlamaProtocol = {
  id: string;
  name: string;
  symbol: string | null;
  [key: string]: any;
};

export type YieldPool = {
  pool: string;
  project: string;
  chain: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  rewardTokens: string[] | null;
  stablecoin: boolean;
  underlyingTokens: string[] | null;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  apyMean30d: number | null;
};

export type YieldChartPoint = {
  timestamp: string;
  tvlUsd: number;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
};

export class DefiLlamaService extends Service {
  static serviceType = "defillama_protocols" as const;
  capabilityDescription = "Look up DeFiLlama protocols by name/symbol and yield opportunities (TTL-cached)";

  // Protocol TVL cache
  private cache: DefiLlamaProtocol[] = [];
  private cacheTimestampMs: number = 0;
  private ttlMs: number = 300000; // 5 minutes

  // Yields cache
  private yieldsCache: YieldPool[] = [];
  private yieldsCacheTimestampMs: number = 0;
  private yieldsTtlMs: number = 300000; // 5 minutes

  constructor(runtime: IAgentRuntime) { super(runtime); }

  static async start(runtime: IAgentRuntime): Promise<DefiLlamaService> {
    const svc = new DefiLlamaService(runtime);
    await svc.initialize(runtime);
    return svc;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Initialize protocols TTL
    const ttlSetting = runtime.getSetting("DEFILLAMA_PROTOCOLS_TTL_MS");
    if (ttlSetting) {
      const parsed = Number(ttlSetting);
      if (!Number.isNaN(parsed) && parsed >= 0) this.ttlMs = parsed;
    }

    // Initialize yields TTL
    const yieldsTtlSetting = runtime.getSetting("DEFILLAMA_YIELDS_TTL_MS");
    if (yieldsTtlSetting) {
      const parsed = Number(yieldsTtlSetting);
      if (!Number.isNaN(parsed) && parsed >= 0) this.yieldsTtlMs = parsed;
    }

    // Load both caches in parallel
    await Promise.all([
      this.loadIndex(),
      this.loadYieldsPools()
    ]);
  }

  async stop(): Promise<void> {}

  async getProtocolsByNames(names: string[]): Promise<Array<{ id: string; success: boolean; data?: any; error?: string }>> {
    await this.ensureFresh();
    const inputs = Array.isArray(names) ? names : [];
    const results: Array<{ id: string; success: boolean; data?: any; error?: string }> = [];

    for (const raw of inputs) {
      const q = (raw || "").trim();
      if (!q) {
        results.push({ id: q, success: false, error: "Empty protocol name" });
        continue;
      }

      const qLower = q.toLowerCase();

      let picked: DefiLlamaProtocol | null = null;

      for (const p of this.cache) { const n = (p.name || "").toLowerCase(); if (n === qLower) { picked = p; break; } }
      if (!picked) { for (const p of this.cache) { const s = (p.symbol || "").toLowerCase(); if (s && s === qLower) { picked = p; break; } } }
      if (!picked) { for (const p of this.cache) { const slug = (p as any).slug ? String((p as any).slug).toLowerCase() : ""; if (slug && slug === qLower) { picked = p; break; } } }
      if (!picked) { for (const p of this.cache) { const n = (p.name || "").toLowerCase(); if (n.startsWith(qLower)) { picked = p; break; } } }
      if (!picked) { for (const p of this.cache) { const slug = (p as any).slug ? String((p as any).slug).toLowerCase() : ""; if (slug.startsWith(qLower)) { picked = p; break; } } }

      if (picked) {
        results.push({ id: q, success: true, data: shapeProtocol(picked) });
      } else {
        results.push({ id: q, success: false, error: `No protocol match for: ${q}` });
      }
    }

    return results;
  }

  /**
   * Search for yield opportunities by protocol, token, and/or chain
   */
  async searchYields(params: {
    protocol?: string;
    token?: string;
    chain?: string;
    minApy?: number;
    stablecoinOnly?: boolean;
    limit?: number;
  }): Promise<YieldPool[]> {
    await this.ensureYieldsFresh();
    
    let results = this.yieldsCache;

    // Filter by protocol (fuzzy match)
    if (params.protocol) {
      const projectLower = params.protocol.toLowerCase();
      results = results.filter(p => 
        p.project.toLowerCase().includes(projectLower)
      );
    }

    // Filter by token symbol (exact match, case-insensitive)
    if (params.token) {
      const tokenLower = params.token.toLowerCase();
      results = results.filter(p => 
        p.symbol.toLowerCase() === tokenLower
      );
    }

    // Filter by chain (case-insensitive)
    if (params.chain) {
      const chainLower = params.chain.toLowerCase();
      results = results.filter(p => 
        p.chain.toLowerCase() === chainLower
      );
    }

    // Filter by minimum APY
    if (params.minApy !== undefined) {
      results = results.filter(p => 
        p.apy !== null && p.apy >= params.minApy!
      );
    }

    // Filter stablecoins only
    if (params.stablecoinOnly) {
      results = results.filter(p => p.stablecoin);
    }

    // Sort by APY descending (highest yields first)
    results.sort((a, b) => (b.apy || 0) - (a.apy || 0));

    // Apply limit (default to top 10)
    const limit = params.limit || 10;
    return results.slice(0, limit);
  }

  /**
   * Get historical yield chart data for a specific pool
   */
  async getPoolChart(poolId: string): Promise<YieldChartPoint[]> {
    const url = `https://yields.llama.fi/chart/${poolId}`;
    const maxAttempts = 3;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      try {
        logger.debug(`[DefiLlama] Fetching chart for pool ${poolId} (attempt ${attempt}/${maxAttempts})`);
        const res = await fetch(url, {
          method: "GET",
          headers: { 
            Accept: "application/json",
            "User-Agent": "ElizaOS-DefiLlama/1.0"
          },
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Failed ${res.status} ${res.statusText}`);
        
        const json = await res.json();
        return json.data || [];
      } catch (e) {
        clearTimeout(timeout);
        const isLast = attempt === maxAttempts;
        const msg = e instanceof Error ? e.message : String(e);
        
        if (isLast) {
          logger.error(`[DefiLlama] Failed to fetch chart for ${poolId} after ${maxAttempts} attempts: ${msg}`);
          throw new Error(`Failed to fetch pool chart: ${msg}`);
        }
        
        const backoff = 500 * Math.pow(2, attempt - 1);
        logger.warn(`[DefiLlama] Chart fetch failed (attempt ${attempt}): ${msg}. Retrying in ${backoff}ms...`);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
    
    return [];
  }

  private async ensureFresh(): Promise<void> {
    const now = Date.now();
    if (this.cache.length === 0 || now - this.cacheTimestampMs > this.ttlMs) {
      await this.loadIndex();
    }
  }

  private async ensureYieldsFresh(): Promise<void> {
    const now = Date.now();
    if (this.yieldsCache.length === 0 || now - this.yieldsCacheTimestampMs > this.yieldsTtlMs) {
      await this.loadYieldsPools();
    }
  }

  private async loadIndex(): Promise<void> {
    const url = "https://api.llama.fi/protocols";
    const maxAttempts = 5;
    const baseDelayMs = 500;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        logger.debug(`[DefiLlama] Loading protocols (attempt ${attempt}/${maxAttempts}): ${url}`);
        const res = await fetch(url, { method: "GET", headers: { Accept: "application/json", "User-Agent": "ElizaOS-DefiLlama/1.0" }, signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Failed ${res.status} ${res.statusText}`);
        const list = (await res.json()) as DefiLlamaProtocol[];
        this.cache = Array.isArray(list) ? list : [];
        this.cacheTimestampMs = Date.now();
        logger.info(`[DefiLlama] Protocols loaded: ${this.cache.length} (ttlMs=${this.ttlMs})`);
        return;
      } catch (e) {
        clearTimeout(timeout);
        const isLast = attempt === maxAttempts;
        const msg = e instanceof Error ? e.message : String(e);
        if (isLast) { logger.error(`[DefiLlama] Failed to load protocols after ${maxAttempts} attempts: ${msg}`); break; }
        const backoff = baseDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200);
        logger.warn(`[DefiLlama] Fetch failed (attempt ${attempt}): ${msg}. Retrying in ${backoff}ms...`);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }

  private async loadYieldsPools(): Promise<void> {
    const url = "https://yields.llama.fi/pools";
    const maxAttempts = 5;
    const baseDelayMs = 500;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20s for larger response
      try {
        logger.debug(`[DefiLlama] Loading yields pools (attempt ${attempt}/${maxAttempts}): ${url}`);
        const res = await fetch(url, { method: "GET", headers: { Accept: "application/json", "User-Agent": "ElizaOS-DefiLlama/1.0" }, signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Failed ${res.status} ${res.statusText}`);
        const json = await res.json();
        const pools = json.data || [];
        
        this.yieldsCache = Array.isArray(pools) ? pools.map((p: any) => ({
          pool: p.pool,
          project: p.project,
          chain: p.chain,
          symbol: p.symbol,
          tvlUsd: p.tvlUsd,
          apy: p.apy,
          apyBase: p.apyBase,
          apyReward: p.apyReward,
          rewardTokens: p.rewardTokens,
          stablecoin: p.stablecoin,
          underlyingTokens: p.underlyingTokens,
          apyPct1D: p.apyPct1D,
          apyPct7D: p.apyPct7D,
          apyPct30D: p.apyPct30D,
          apyMean30d: p.apyMean30d,
        })) : [];
        
        this.yieldsCacheTimestampMs = Date.now();
        logger.info(`[DefiLlama] Yields pools loaded: ${this.yieldsCache.length} (ttlMs=${this.yieldsTtlMs})`);
        return;
      } catch (e) {
        clearTimeout(timeout);
        const isLast = attempt === maxAttempts;
        const msg = e instanceof Error ? e.message : String(e);
        if (isLast) { logger.error(`[DefiLlama] Failed to load yields pools after ${maxAttempts} attempts: ${msg}`); break; }
        const backoff = baseDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200);
        logger.warn(`[DefiLlama] Yields fetch failed (attempt ${attempt}): ${msg}. Retrying in ${backoff}ms...`);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }
}

function shapeProtocol(p: any): any {
  const chains: string[] = Array.isArray(p.chains) ? Array.from(new Set(p.chains)) : [];
  return {
    id: p.id,
    slug: p.slug ?? null,
    name: p.name,
    symbol: p.symbol ?? null,
    url: p.url ?? null,
    logo: p.logo ?? null,
    category: p.category ?? null,
    chains,
    address: p.address ?? null,
    gecko_id: p.gecko_id ?? null,
    cmcId: p.cmcId ?? null,
    twitter: p.twitter ?? null,
    tvl: p.tvl ?? null,
    tvl_change_1h: p.change_1h ?? null,
    tvl_change_1d: p.change_1d ?? null,
    tvl_change_7d: p.change_7d ?? null,
    chainTvls: p.chainTvls,
  };
}


