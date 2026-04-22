'use client';

import React, { useState } from 'react';
import { useDashboardState, useDashboardActions } from '@/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Minus } from 'lucide-react';

export function Sidebar() {
  const { tickers, selectedTicker } = useDashboardState();
  const { setSelectedTicker, addTicker, removeTicker, setTickerToDelete } = useDashboardActions();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTickerValue, setNewTickerValue] = useState('');

  const handleAddTicker = () => {
    if (newTickerValue && newTickerValue.trim()) {
      addTicker(newTickerValue.trim().toUpperCase());
      setNewTickerValue('');
      setIsAdding(false);
    } else {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTicker();
    if (e.key === 'Escape') setIsAdding(false);
  };

  return (
    <>
      <div className="w-full bg-transparent flex flex-col py-3 px-6">
        <ScrollArea className="w-full">
          <div className="flex flex-row items-center gap-3 py-2">
            <div className="text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase pr-3 border-r border-slate-800/80">TICKERS</div>
            {tickers.map((ticker) => (
              <div key={ticker} className="relative">
                <Button
                  variant={selectedTicker === ticker ? 'default' : 'outline'}
                  className={`rounded-full h-8 ${isEditMode ? 'pl-5 pr-8' : 'px-5'} text-xs font-bold tracking-widest transition-all duration-300 ${selectedTicker === ticker
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.4)] border-transparent'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  style={isEditMode ? { animation: 'wiggle 0.3s ease-in-out infinite' } : undefined}
                  onClick={() => !isEditMode && setSelectedTicker(ticker)}
                >
                  {ticker}
                </Button>
                {/* 편집 모드: 삭제 아이콘 */}
                {isEditMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTickerToDelete(ticker);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/90 hover:bg-red-400 flex items-center justify-center transition-all shadow-md shadow-red-500/30 hover:scale-110"
                    style={{ animation: 'wiggle 0.3s ease-in-out infinite' }}
                  >
                    <Minus className="w-3 h-3 text-white" strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
            {/* 편집 모드 토글 버튼 */}
            <Button
              variant="ghost"
              className={`rounded-full h-8 w-8 p-0 text-xs font-bold transition-all ${isEditMode
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30'
                : 'text-slate-500 border border-transparent hover:bg-slate-900 hover:text-slate-300'
                }`}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {/* ADD 버튼 또는 입력창 */}
            {!isEditMode && (
              isAdding ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                  <input
                    autoFocus
                    type="text"
                    placeholder="TICKER"
                    value={newTickerValue}
                    onChange={(e) => setNewTickerValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => !newTickerValue && setIsAdding(false)}
                    className="h-8 w-24 bg-slate-950 border border-emerald-500/50 rounded-full px-3 text-[10px] font-bold text-emerald-400 placeholder:text-slate-600 outline-none shadow-[0_0_15px_rgba(16,185,129,0.1)] focus:border-emerald-400 transition-all"
                  />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="rounded-full h-8 px-4 text-xs font-bold text-slate-500 border border-dashed border-slate-700 hover:bg-slate-900 hover:text-slate-300 hover:border-slate-500 transition-colors"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  ADD
                </Button>
              )
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Wiggle 애니메이션 (컴포넌트 내 인라인 스타일) */}
      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }
      `}</style>
    </>
  );
}
