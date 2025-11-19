export type TrendingToken = {
  baseDecimals?: number;
  baseName?: string;
  baseSymbol?: string;
  liquidity?: number;
  marketCap?: number;
  price?: number;
  priceUsd?: number;
  priceChange1h?: number;
  priceChange24h?: number;
  volumeUsd24h?: number;
  pair?: string;
  chainId?: string;
  baseToken?: string;
  quoteToken?: string;
  dex?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
}
