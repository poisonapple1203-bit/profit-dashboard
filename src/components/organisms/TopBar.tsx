'use client';

import React, { useState } from 'react';
import { useDashboardState, useDashboardActions, PeriodType, UserType } from '@/store';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronLeft, ChevronRight, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { migrateUserRecords } from '@/lib/api';

export function TopBar() {
  const { selectedPeriod, selectedUser, dateRange, userNames } = useDashboardState();
  const { setSelectedPeriod, setSelectedUser, setDateRange, updateUserName } = useDashboardActions();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  // 인라인 편집 관련 로컬 상태
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);

  const periods: PeriodType[] = ['전체', '일별', '월별', '연별'];

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
    setEditValue(userNames[index]);
  };

  const handleEditSubmit = async (index: number) => {
    const oldName = userNames[index];
    const newName = editValue.trim();

    if (!newName || oldName === newName) {
      setEditingIndex(null);
      return;
    }

    try {
      setIsMigrating(true);
      // 1. 데이터 마이그레이션 (Firestore)
      await migrateUserRecords(oldName, newName);
      // 2. 스토어 업데이트
      updateUserName(index, newName);
      setEditingIndex(null);
    } catch (e) {
      alert('이름 변경 중 오류가 발생했습니다.');
    } finally {
      setIsMigrating(false);
    }
  };

  const getFormattedDate = () => {
    if (selectedPeriod === '전체') return '전체 기간';
    if (!dateRange?.from) return '날짜 선택';

    if (selectedPeriod === '월별') {
      return format(dateRange.from, 'yyyy.MM');
    } else if (selectedPeriod === '연별') {
      return `${format(dateRange.from, 'yyyy')}년`;
    }

    if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
      return format(dateRange.from, 'yyyy.MM.dd');
    }
    return `${format(dateRange.from, 'yyyy.MM.dd')} - ${format(dateRange.to, 'yyyy.MM.dd')}`;
  };

  return (
    <div className="flex flex-col w-full bg-slate-900/95 backdrop-blur-md">
      {/* 1. 상단 타이틀 및 사용자 선택 구역 */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-slate-100 tracking-tight drop-shadow-sm">
          누적 손익 기록
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest hidden sm:inline-block">사용자:</span>
          </div>
          <div className="flex gap-2">
            {userNames.map((user, idx) => (
              editingIndex === idx ? (
                <div key={idx} className="relative flex items-center">
                  <input
                    autoFocus
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSubmit(idx);
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                    onBlur={() => handleEditSubmit(idx)}
                    disabled={isMigrating}
                    className="h-8 px-3 w-28 bg-slate-950 border border-emerald-500 text-emerald-400 text-sm font-bold rounded-lg outline-none shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
                  />
                  {isMigrating && (
                    <div className="absolute right-2">
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  key={user}
                  variant={selectedUser === user ? 'default' : 'outline'}
                  onClick={() => setSelectedUser(user)}
                  onDoubleClick={() => handleEditStart(idx)}
                  className={cn(
                    "h-8 px-5 text-sm font-black transition-all duration-300 rounded-lg group relative",
                    selectedUser === user
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.3)] border-transparent"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  )}
                >
                  {user}
                  <span 
                    onClick={(e) => { e.stopPropagation(); handleEditStart(idx); }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="w-2 h-2 text-slate-300" />
                  </span>
                </Button>
              )
            ))}
          </div>
        </div>
      </div>

      {/* 2. 서브 네비게이션 (기간 및 날짜) */}
      <div className="flex items-center px-6 py-3 border-b border-slate-800/50 gap-4">
        <div className="flex gap-2">
          {periods.map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              onClick={() => {
                setSelectedPeriod(period);
                // 모드 변경 시 연도 상태 초기화
                setPickerYear(new Date().getFullYear());
              }}
              className={cn(
                "h-7 px-4 font-bold tracking-widest text-[11px] rounded transition-all duration-300",
                selectedPeriod === period
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.3)] border-transparent"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              {period}
            </Button>
          ))}
        </div>
        <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
          <PopoverTrigger className="inline-flex items-center text-xs font-mono font-bold text-slate-400 bg-slate-950 px-3 py-1.5 h-7 rounded border border-slate-800 shadow-inner hover:text-emerald-400 hover:bg-slate-900 hover:border-emerald-500/50 transition-all whitespace-nowrap cursor-pointer">
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {getFormattedDate()}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-950 border-slate-800 flex flex-row overflow-hidden rounded-xl shadow-2xl" align="start">

            {/* 일별 선택 UI (달력 본체) */}
            {selectedPeriod === '일별' && (
              <Calendar
                initialFocus
                mode="single"
                defaultMonth={dateRange?.from}
                selected={dateRange?.from}
                onSelect={(date) => {
                  if (date) {
                    setDateRange({ from: date, to: date });
                    setIsPickerOpen(false);
                  }
                }}
                numberOfMonths={1}
                className="text-slate-300 p-3"
              />
            )}

            {/* 월별 선택 UI (커스텀 그리드) */}
            {selectedPeriod === '월별' && (
              <div className="p-4 w-[280px]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-400 hover:bg-slate-900" onClick={() => setPickerYear(y => y - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-bold text-slate-200 tracking-widest">{pickerYear}년</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-400 hover:bg-slate-900" onClick={() => setPickerYear(y => y + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const isSelected = dateRange?.from &&
                      dateRange.from.getFullYear() === pickerYear &&
                      dateRange.from.getMonth() === i;

                    return (
                      <Button
                        key={i}
                        variant="outline"
                        className={isSelected
                          ? "!bg-[#14f391] !text-black font-black rounded-md h-10 border-transparent transition-all"
                          : "bg-transparent text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 h-10 border-transparent transition-all"
                        }
                        onClick={() => {
                          const targetDate = new Date(pickerYear, i, 1);
                          setDateRange({ from: startOfMonth(targetDate), to: endOfMonth(targetDate) });
                          setIsPickerOpen(false);
                        }}>
                        {i + 1}월
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 연별 선택 UI (커스텀 그리드) */}
            {selectedPeriod === '연별' && (
              <div className="p-4 w-[280px]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-400 hover:bg-slate-900" onClick={() => setPickerYear(y => y - 9)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-[11px] font-bold text-slate-400 tracking-widest">{pickerYear - 4} - {pickerYear + 4}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-400 hover:bg-slate-900" onClick={() => setPickerYear(y => y + 9)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 9 }).map((_, i) => {
                    const yearTarget = pickerYear - 4 + i;
                    const isSelected = dateRange?.from && dateRange.from.getFullYear() === yearTarget;

                    return (
                      <Button
                        key={yearTarget}
                        variant="outline"
                        className={isSelected
                          ? "!bg-[#14f391] !text-black font-black rounded-md h-10 border-transparent transition-all"
                          : "bg-transparent text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 h-10 border-transparent transition-all font-mono"
                        }
                        onClick={() => {
                          const targetDate = new Date(yearTarget, 0, 1);
                          setDateRange({ from: startOfYear(targetDate), to: endOfYear(targetDate) });
                          setIsPickerOpen(false);
                        }}>
                        {yearTarget}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 전체 UI */}
            {selectedPeriod === '전체' && (
              <div className="p-6 w-[280px] flex items-center justify-center text-sm font-bold text-slate-400 text-center leading-relaxed">
                전체 기간으로 설정되었습니다. <br /> 자동으로 전체 수익이 계산됩니다.
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
