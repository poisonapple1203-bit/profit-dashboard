/**
 * Twelve Data API를 활용한 시장 데이터 페칭 유틸리티
 * - 다우존스(DIA), 나스닥(QQQ), SOXL, TQQQ 등락률
 * - USD/KRW 환율 및 7일 역사적 데이터
 */

// [치트키] 개발 모드 설정 (true일 경우 API를 호출하지 않고 Mock 데이터 사용)
export const IS_DEV_MODE = true;

export interface MarketQuote {
  symbol: string;
  name: string;
  percent_change: number;
  price: number;
}

export interface MarketHistory {
  [symbol: string]: { value: number }[];
}

export interface MarketData {
  quotes: MarketQuote[];
  exchangeRate: number | null;
  history: MarketHistory;
  updatedAt: string | null;
  error: string | null;
}

const API_KEY = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY || '';
const BASE_URL = 'https://api.twelvedata.com';

// 심볼과 한글 이름 매핑
const SYMBOL_MAP: Record<string, string> = {
  'DIA': '다우존스',
  'QQQ': '나스닥',
  'SOXL': 'SOXL',
  'TQQQ': 'TQQQ',
};

// 가짜 데이터 생성기 (7일치)
const generateMockHistory = (base: number, volatility: number) => {
  return Array.from({ length: 7 }).map((_, i) => ({
    value: base + (Math.sin(i) * volatility) + (Math.random() * volatility * 0.5)
  }));
};

const MOCK_DATA: MarketData = {
  quotes: [
    { symbol: 'DIA', name: '다우존스', percent_change: 1.76, price: 494.22 },
    { symbol: 'QQQ', name: '나스닥', percent_change: 1.31, price: 648.85 },
    { symbol: 'SOXL', name: 'SOXL', percent_change: 7.14, price: 94.68 },
    { symbol: 'TQQQ', name: 'TQQQ', percent_change: 3.83, price: 58.59 },
  ],
  exchangeRate: 1467.35,
  history: {
    'DIA': generateMockHistory(490, 5),
    'QQQ': generateMockHistory(640, 8),
    'SOXL': generateMockHistory(85, 12),
    'TQQQ': generateMockHistory(55, 4),
    'USD/KRW': generateMockHistory(1460, 10),
  },
  updatedAt: '오후 11:25 (MOCK)',
  error: null,
};

export async function fetchMarketData(): Promise<MarketData> {
  // 개발 모드일 경우 즉시 가짜 데이터 반환
  if (IS_DEV_MODE) {
    console.log('Using Mock Market Data (Dev Mode)');
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_DATA), 500); // 0.5초 딜레이
    });
  }

  const quoteSymbols = 'DIA,QQQ,SOXL,TQQQ';
  
  try {
    const [quoteRes, fxRes, historyRes] = await Promise.all([
      fetch(`${BASE_URL}/quote?symbol=${quoteSymbols}&apikey=${API_KEY}`),
      fetch(`${BASE_URL}/exchange_rate?symbol=USD/KRW&apikey=${API_KEY}`),
      fetch(`${BASE_URL}/time_series?symbol=${quoteSymbols},USD/KRW&interval=1day&outputsize=7&apikey=${API_KEY}`)
    ]);

    const [quoteJson, fxJson, historyJson] = await Promise.all([
      quoteRes.json(),
      fxRes.json(),
      historyRes.json()
    ]);

    if (quoteJson.code === 429 || fxJson.code === 429 || historyJson.code === 429) {
      return {
        quotes: [],
        exchangeRate: null,
        history: {},
        updatedAt: null,
        error: 'API 한도 초과로 1분 후 자동 갱신됩니다',
      };
    }

    const quotes: MarketQuote[] = Object.keys(SYMBOL_MAP).map((sym) => {
      const item = quoteJson[sym];
      if (item && item.percent_change !== undefined) {
        return {
          symbol: sym,
          name: SYMBOL_MAP[sym],
          percent_change: parseFloat(item.percent_change),
          price: parseFloat(item.close || item.price || '0'),
        };
      }
      return { symbol: sym, name: SYMBOL_MAP[sym], percent_change: 0, price: 0 };
    });

    const exchangeRate = fxJson.rate ? parseFloat(fxJson.rate) : null;

    const history: MarketHistory = {};
    const symbolsForHistory = [...Object.keys(SYMBOL_MAP), 'USD/KRW'];
    
    symbolsForHistory.forEach((sym) => {
      const data = historyJson[sym];
      if (data && data.values) {
        history[sym] = data.values
          .map((v: any) => ({ value: parseFloat(v.close) }))
          .reverse();
      } else {
        history[sym] = [];
      }
    });

    return {
      quotes,
      exchangeRate,
      history,
      updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      error: null,
    };
  } catch (err) {
    console.error('Market data fetch error:', err);
    return {
      quotes: [],
      exchangeRate: null,
      history: {},
      updatedAt: null,
      error: '데이터를 불러오는 중 오류가 발생했습니다',
    };
  }
}
