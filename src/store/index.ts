import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { startOfMonth, startOfYear } from 'date-fns';
import { DateRange } from 'react-day-picker';
import type { ProfitRecord } from '@/lib/api';
import { fetchMarketData, type MarketData } from '@/lib/market';

export type UserType = string;
export type PeriodType = '일별' | '월별' | '연별' | '전체';

export interface MarketState {
  marketData: MarketData | null;
  marketStatus: 'idle' | 'loading' | 'error';
  lastMarketFetch: number | null;
  selectedMarketSymbol: string;
}

export const useAppStore = create(
  immer(
    combine(
      {
        userNames: ['조핏', '봉핏'] as string[],
        selectedUser: '조핏' as UserType,
        selectedTicker: 'SOXL',
        selectedPeriod: '전체' as PeriodType,
        tickers: ['SOXL', 'TQQQ'] as string[],
        dateRange: { from: new Date(2020, 0, 1), to: new Date() } as DateRange | undefined,
        records: [] as ProfitRecord[],
        // 마켓 데이터 관련 초기 상태
        marketData: null as MarketData | null,
        marketStatus: 'idle' as 'idle' | 'loading' | 'error',
        lastMarketFetch: null as number | null,
        selectedMarketSymbol: 'DIA',
        // 글로벌 모달 관련 상태
        tickerToDelete: null as string | null,
        recordToDelete: null as string | null,
      },
      (set, get) => ({
        setSelectedUser: (user: UserType) =>
          set((state) => {
            state.selectedUser = user;
          }),
        setSelectedTicker: (ticker: string) =>
          set((state) => {
            state.selectedTicker = ticker;
          }),
        setSelectedPeriod: (period: PeriodType) =>
          set((state) => {
            state.selectedPeriod = period;
            const today = new Date();
            if (period === '일별') {
              state.dateRange = { from: today, to: today };
            } else if (period === '월별') {
              state.dateRange = { from: startOfMonth(today), to: today };
            } else if (period === '연별') {
              state.dateRange = { from: startOfYear(today), to: today };
            } else if (period === '전체') {
              state.dateRange = { from: new Date(2020, 0, 1), to: today };
            }
          }),
        setDateRange: (range: DateRange | undefined) =>
          set((state) => {
            state.dateRange = range;
          }),
        addTicker: (ticker: string) =>
          set((state) => {
            if (!state.tickers.includes(ticker)) {
              state.tickers.push(ticker);
            }
          }),
        removeTicker: (ticker: string) =>
          set((state) => {
            state.tickers = state.tickers.filter((t) => t !== ticker);
            if (state.selectedTicker === ticker) {
              state.selectedTicker = state.tickers[0] || '';
            }
          }),
        setRecords: (records: ProfitRecord[]) =>
          set((state) => {
            state.records = records;
          }),

        // 마켓 데이터 전역 관리 액션
        setSelectedMarketSymbol: (symbol: string) =>
          set((state) => { state.selectedMarketSymbol = symbol; }),

        // 글로벌 모달 관리 액션
        setTickerToDelete: (ticker: string | null) =>
          set((state) => { state.tickerToDelete = ticker; }),
        setRecordToDelete: (id: string | null) =>
          set((state) => { state.recordToDelete = id; }),
        
        updateUserName: (index: number, newName: string) =>
          set((state) => {
            const oldName = state.userNames[index];
            state.userNames[index] = newName;
            if (state.selectedUser === oldName) {
              state.selectedUser = newName;
            }
          }),

        updateMarketData: async (force = false) => {
          const state = get();
          const now = Date.now();
          const COOLDOWN = 5 * 60 * 1000; // 5분 캐시 로직

          // 쿨타임 중이면 호출 스킵 (강제 갱신 제외)
          if (!force && state.lastMarketFetch && (now - state.lastMarketFetch < COOLDOWN)) {
            return;
          }

          set((state) => { state.marketStatus = 'loading'; });

          try {
            const data = await fetchMarketData();
            set((state) => {
              // 에러가 났더라도 기존 데이터가 있다면 에러 메시지만 업데이트 (SWR)
              if (data.error && state.marketData) {
                state.marketData.error = data.error;
                state.marketStatus = 'error';
              } else {
                state.marketData = data;
                state.marketStatus = data.error ? 'error' : 'idle';
                if (!data.error) state.lastMarketFetch = now;
              }
            });
          } catch (err) {
            set((state) => { state.marketStatus = 'error'; });
          }
        }
      })
    )
  )
);

export const useDashboardState = () => useAppStore(useShallow((state) => ({
  selectedUser: state.selectedUser,
  selectedTicker: state.selectedTicker,
  selectedPeriod: state.selectedPeriod,
  tickers: state.tickers,
  dateRange: state.dateRange,
  records: state.records,
  marketData: state.marketData,
  marketStatus: state.marketStatus,
  selectedMarketSymbol: state.selectedMarketSymbol,
  tickerToDelete: state.tickerToDelete,
  recordToDelete: state.recordToDelete,
  userNames: state.userNames,
})));

export const useDashboardActions = () => useAppStore(useShallow((state) => ({
  setSelectedUser: state.setSelectedUser,
  setSelectedTicker: state.setSelectedTicker,
  setSelectedPeriod: state.setSelectedPeriod,
  setDateRange: state.setDateRange,
  addTicker: state.addTicker,
  removeTicker: state.removeTicker,
  setRecords: state.setRecords,
  setSelectedMarketSymbol: state.setSelectedMarketSymbol,
  updateMarketData: state.updateMarketData,
  setTickerToDelete: state.setTickerToDelete,
  setRecordToDelete: state.setRecordToDelete,
  updateUserName: state.updateUserName,
})));
