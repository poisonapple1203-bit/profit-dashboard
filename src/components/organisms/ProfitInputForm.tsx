'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDashboardState } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { saveProfitRecord } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

/* ─── Time Picker Popover ─── */
function TimePickerPopover({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const [currentHour, currentMinute] = value.split(':').map(Number);

  // 팝오버 열릴 때 선택된 시/분으로 자동 스크롤
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        hourRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center', behavior: 'instant' });
        minuteRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, 50);
    }
  }, [open]);

  // 시간을 업데이트하고 창을 닫음 (최종 선택 시 사용)
  const handleSelectFull = (hour: number, minute: number) => {
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    onChange(`${h}:${m}`);
    setOpen(false);
  };

  // 시간만 업데이트하고 창은 유지 (시 선택 시 사용)
  const handleSelectHour = (hour: number) => {
    const h = String(hour).padStart(2, '0');
    const [, currentMinute] = value.split(':');
    onChange(`${h}:${currentMinute}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex w-full h-9 items-center justify-center text-sm font-mono font-medium text-white bg-slate-950 border border-slate-700 rounded-md tracking-tight hover:border-slate-600 transition-colors">
        {value}
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-slate-950 border-slate-700 rounded-xl shadow-2xl overflow-hidden" align="start">
        <div className="flex h-[220px]">
          {/* 시(Hour) 다이얼 */}
          <div className="flex-1 border-r border-slate-800 flex flex-col">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center py-1.5 border-b border-slate-800 bg-slate-900/50">시</div>
            <div ref={hourRef} className="flex-1 overflow-y-auto scrollbar-thin">
              {Array.from({ length: 24 }).map((_, h) => {
                const isActive = h === currentHour;
                return (
                  <button
                    key={h}
                    data-selected={isActive}
                    onClick={() => handleSelectHour(h)}
                    className={`w-full py-1.5 text-center text-sm font-mono transition-all ${isActive
                        ? '!bg-[#14f391]/15 !text-[#14f391] font-bold drop-shadow-[0_0_8px_rgba(20,243,145,0.4)]'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
          {/* 분(Minute) 다이얼 */}
          <div className="flex-1 flex flex-col">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center py-1.5 border-b border-slate-800 bg-slate-900/50">분</div>
            <div ref={minuteRef} className="flex-1 overflow-y-auto scrollbar-thin">
              {Array.from({ length: 60 }).map((_, m) => {
                const isActive = m === currentMinute;
                return (
                  <button
                    key={m}
                    data-selected={isActive}
                    onClick={() => handleSelectFull(currentHour, m)}
                    className={`w-full py-1.5 text-center text-sm font-mono transition-all ${isActive
                        ? '!bg-[#14f391]/15 !text-[#14f391] font-bold drop-shadow-[0_0_8px_rgba(20,243,145,0.4)]'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ProfitInputForm() {
  const { selectedTicker, selectedUser } = useDashboardState();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateOpen, setDateOpen] = useState(false); // 날짜 팝오버 상태 제어 추가
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [profit, setProfit] = useState('');

  const handleSave = async () => {
    if (!profit || profit === '-' || profit === '0') return;

    // 마이너스 및 숫자 파싱
    const parsedProfit = parseInt(profit.replace(/,/g, ''), 10);
    if (isNaN(parsedProfit)) return;

    try {
      await saveProfitRecord({
        user: selectedUser,
        ticker: selectedTicker,
        date: format(selectedDate, 'yyyy.M.d'),
        time,
        profit: parsedProfit,
      });
      // 완료 후 인풋 리셋 (날짜, 시간은 유지)
      setProfit('');
    } catch (error) {
      alert('데이터 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="border border-slate-800 rounded-2xl p-4 md:p-5 bg-slate-900/80 shadow-xl shadow-black/40 min-w-[280px] h-full transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <div className="border border-slate-700 px-3 py-1.5 rounded-lg font-bold text-sm bg-slate-950 text-slate-100 shadow-inner flex items-center gap-2 min-w-[85px] justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)] shrink-0"></div>
          <span className="truncate">{selectedTicker}</span>
        </div>
        <div className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-full uppercase">
          {selectedUser} MODE
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">날짜</label>
          <div className="relative">
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger className="flex w-full h-9 items-center justify-center text-sm font-mono font-medium text-slate-300 bg-slate-950 border border-slate-700 rounded-md tracking-tight hover:border-slate-600 transition-colors">
                {format(selectedDate, 'yyyy.M.d')}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-slate-700 bg-slate-950" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => {
                    if (day) {
                      setSelectedDate(day);
                      setDateOpen(false); // 날짜 선택 시 창 닫기
                    }
                  }}
                  className="bg-slate-950 text-slate-300 rounded-xl"
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">시간</label>
          <TimePickerPopover value={time} onChange={setTime} />
        </div>
      </div>

      <div className="mb-5 flex-1">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">수익</label>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={profit}
          onChange={(e) => {
            const rawValue = e.target.value;
            // 허용된 문자(숫자, 마이너스)만 추출
            const onlyNums = rawValue.replace(/[^0-9-]/g, '');
            let finalStr = onlyNums;

            // 마이너스 부호가 처음에만 위치하도록 제어하고 중복을 제거
            if (onlyNums.startsWith('-')) {
              finalStr = '-' + onlyNums.replace(/-/g, '');
            } else {
              finalStr = onlyNums.replace(/-/g, '');
            }

            if (finalStr === '' || finalStr === '-') {
              setProfit(finalStr);
              return;
            }

            // 정수 변환 후 천 단위 쉼표 추가
            const num = parseInt(finalStr, 10);
            if (!isNaN(num)) {
              setProfit(num.toLocaleString('ko-KR'));
            }
          }}
          className="text-2xl font-mono font-black p-4 h-14 bg-slate-950 border-slate-700 focus-visible:ring-emerald-400 focus-visible:text-emerald-400 text-slate-100 transition-colors placeholder:text-slate-700 text-right"
        />
      </div>

      <div className="mt-auto w-full">
        <Button onClick={handleSave} size="lg" className="w-full font-bold text-base bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all">
          저장
        </Button>
      </div>
    </div>
  );
}
