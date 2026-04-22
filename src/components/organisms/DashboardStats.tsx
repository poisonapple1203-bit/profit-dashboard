'use client';

import React, { useEffect, useRef } from 'react';
import { useDashboardState, useDashboardActions } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { startOfDay, endOfDay } from 'date-fns';
import { Loader2 } from 'lucide-react';

// 임시 차트 데이터 (초기 완전 로딩 시에만 사용)
const initialMockData = Array.from({ length: 7 }).map((_, i) => ({ value: 100 }));

export function DashboardStats() {
  const { records, dateRange, marketData, marketStatus, selectedMarketSymbol, userNames } = useDashboardState();
  const { updateMarketData, setSelectedMarketSymbol } = useDashboardActions();
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 마켓 데이터 연동 및 스마트 재시도 로직
  useEffect(() => {
    updateMarketData();
    const mainInterval = setInterval(() => updateMarketData(), 5 * 60 * 1000);

    return () => {
      clearInterval(mainInterval);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [updateMarketData]);

  // 429 에러(한도 초과) 감지 시 65초 후 자동 재시도
  useEffect(() => {
    if (marketData?.error?.includes('API 한도 초과')) {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

      console.log('API Limit hit. Scheduling retry in 65s...');
      retryTimerRef.current = setTimeout(() => {
        updateMarketData(true); // 강제 갱신
      }, 65000);
    }
  }, [marketData?.error, updateMarketData]);

  // 1. 기간별 필터링
  const dateFilteredRecords = records.filter((record) => {
    if (dateRange && dateRange.from) {
      const recordDateArr = record.date.split('.');
      const rDate = new Date(Number(recordDateArr[0]), Number(recordDateArr[1]) - 1, Number(recordDateArr[2]));
      const start = startOfDay(dateRange.from);
      const end = endOfDay(dateRange.to || dateRange.from);
      return rDate >= start && rDate <= end;
    }
    return true;
  });

  const jofitProfit = dateFilteredRecords.filter(r => r.user === userNames[0]).reduce((acc, curr) => acc + curr.profit, 0);
  const bongfitProfit = dateFilteredRecords.filter(r => r.user === userNames[1]).reduce((acc, curr) => acc + curr.profit, 0);

  const getChangeColor = (val: number) => val >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]';
  const formatChange = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

  const chartData = marketData?.history[selectedMarketSymbol] || initialMockData;
  const selectedMarketName =
    selectedMarketSymbol === 'USD/KRW' ? '환율' :
      marketData?.quotes.find(q => q.symbol === selectedMarketSymbol)?.name || selectedMarketSymbol;

  const isLoading = marketStatus === 'loading' && !marketData;

  // [최종 영점 조정 프로토콜]
  const cardClassName = "h-[200px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] bg-gradient-to-br from-slate-800 to-slate-900/90 hover:from-slate-700 hover:to-slate-800 transition-all border-slate-700/50 duration-300 rounded-2xl relative overflow-hidden";
  const contentClassName = "h-full flex flex-col justify-center items-center p-0 relative";

  // 카드 높이 상향(200px)에 맞춰 내부 박스도 176px로 확장
  const standardizedContentBox = "h-[176px] w-full px-4 flex flex-col";
  // 라벨들의 시각적 베이스라인을 맞추기 위한 헤더 높이
  const headerRowHeight = "h-6 flex items-center mb-2.5";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-stretch gap-4 p-2">
      {/* 1. 조핏 수익 */}
      <Card className={cardClassName}>
        <CardContent className={contentClassName}>
          <div className={standardizedContentBox}>
            <div className={headerRowHeight}>
              <div className="flex items-center gap-1.5 h-4 relative">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)] -translate-y-[0.5px]"></div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{userNames[0]}</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center -mt-14">
              <p className="text-[12px] text-slate-500 mb-1.5 font-bold tracking-widest leading-none">총 수익</p>
              <p className={`text-4xl font-mono font-black tracking-tighter drop-shadow-sm ${jofitProfit >= 0 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-rose-500 drop-shadow-sm'}`}>
                {jofitProfit > 0 ? '+' : ''}{jofitProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 봉핏 수익 */}
      <Card className={cardClassName}>
        <CardContent className={contentClassName}>
          <div className={standardizedContentBox}>
            <div className={headerRowHeight}>
              <div className="flex items-center gap-1.5 h-4 relative">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)] -translate-y-[0.5px]"></div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{userNames[1]}</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center -mt-14">
              <p className="text-[12px] text-slate-500 mb-1.5 font-bold tracking-widest leading-none">총 수익</p>
              <p className={`text-4xl font-mono font-black tracking-tighter drop-shadow-sm ${bongfitProfit >= 0 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-rose-500 drop-shadow-sm'}`}>
                {bongfitProfit > 0 ? '+' : ''}{bongfitProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. 주요 지표 (시장 데이터) */}
      <Card className={cardClassName}>
        <CardContent className={contentClassName}>
          <div className={standardizedContentBox}>
            <div className={headerRowHeight}>
              {/* 브라우저 측정값(4.75px 오차) 보정을 위해 mt-[4.75px]와 폰트 보정 -mt-[1px] 합산 적용 */}
              <div className="flex items-center gap-1.5 h-4 opacity-60">
                <div className="w-1 h-1 rounded-full bg-slate-400 -translate-y-[0.5px]"></div>
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">주요 지표</span>
              </div>
            </div>

            {/* 업데이트 인디케이터 - 동기화된 위치로 세열 조정 (top-9) */}
            {marketStatus === 'loading' && marketData && (
              <div className="absolute top-9 right-4 flex items-center gap-1 opacity-40">
                <Loader2 className="w-2.5 h-2.5 animate-spin text-[#14f391]" />
              </div>
            )}

            <div className="flex-1 flex flex-col justify-between">
              {isLoading ? (
                <div className="space-y-2 w-full">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex justify-between items-center h-2 bg-slate-700/50 rounded animate-pulse w-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col w-full relative">
                  {marketData?.quotes.map((q, idx) => (
                    <React.Fragment key={q.symbol}>
                      <div
                        onClick={() => setSelectedMarketSymbol(q.symbol)}
                        className={`flex justify-between items-center px-1.5 py-1.5 rounded cursor-pointer transition-all duration-150 relative group ${selectedMarketSymbol === q.symbol ? 'bg-[#14f391]/10' : 'hover:bg-slate-700/40'
                          }`}
                      >
                        {selectedMarketSymbol === q.symbol && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[60%] bg-[#14f391] rounded-r-full shadow-[0_0_4px_rgba(20,243,145,0.4)]" />
                        )}
                        <span className={`text-[10.5px] ${selectedMarketSymbol === q.symbol ? 'text-slate-100 font-bold' : 'text-slate-400'} leading-none`}>{q.name}</span>
                        <span className={`font-mono text-[10.5px] ${getChangeColor(q.percent_change)} leading-none`}>{formatChange(q.percent_change)}</span>
                      </div>
                      {idx < 3 && <div className="border-b border-white/[0.01] mx-1" />}
                    </React.Fragment>
                  ))}

                  <div className="border-b border-white/[0.04] mx-0.5 my-1" />

                  <div
                    onClick={() => setSelectedMarketSymbol('USD/KRW')}
                    className={`flex justify-between items-center px-1.5 py-1.5 rounded cursor-pointer transition-all duration-150 relative ${selectedMarketSymbol === 'USD/KRW' ? 'bg-[#14f391]/10' : 'hover:bg-slate-700/40'
                      }`}
                  >
                    {selectedMarketSymbol === 'USD/KRW' && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[60%] bg-[#14f391] rounded-r-full shadow-[0_0_4px_rgba(20,243,145,0.4)]" />
                    )}
                    <span className={`text-[10px] ${selectedMarketSymbol === 'USD/KRW' ? 'text-slate-100 font-bold' : 'text-slate-400'} leading-none`}>환율(USD/KRW)</span>
                    <span className={`font-mono text-[10.5px] ${selectedMarketSymbol === 'USD/KRW' ? 'text-slate-100 font-bold' : 'text-slate-400'} leading-none`}>{marketData?.exchangeRate?.toFixed(2) ?? '—'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. 7일 추세 차트 */}
      <Card className={cardClassName}>
        <CardContent className={contentClassName}>
          <div className={standardizedContentBox}>
            <div className={headerRowHeight}>
              {/* 4.75px 오차 보정을 위해 -mt-[1px]와 미세 조정을 합산 적용 (0.5px 낮게 측정된 부분 보정) */}
              <div className="flex items-center gap-1.5 h-4 opacity-60">
                <div className="w-1 h-1 rounded-full bg-slate-400 -translate-y-[0.5px]"></div>
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">7일 추세</span>
              </div>
            </div>

            <div className="px-1.5 mb-1.5">
              <p className="text-[11px] text-slate-200 font-bold tracking-tight leading-none">{selectedMarketName}</p>
            </div>

            <div className="flex-1 w-full min-h-0 relative px-1 pb-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#14f391"
                    strokeWidth={1.5}
                    dot={{ r: 1.5, fill: "#14f391", strokeWidth: 0 }}
                    animationDuration={300}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
