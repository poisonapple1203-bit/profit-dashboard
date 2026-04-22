'use client';

import React, { useState } from 'react';
import { useDashboardState, useDashboardActions } from '@/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updateProfitRecord } from '@/lib/api';
import type { ProfitRecord } from '@/lib/api';
import { startOfDay, endOfDay } from 'date-fns';

export function ProfitHistoryTable() {
  const { selectedTicker, selectedUser, records, dateRange } = useDashboardState();
  const { setRecordToDelete } = useDashboardActions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ date: '', time: '', profit: '' });

  // 현재 선택된 사용자, 티커 및 기간에 맞게 필터링 및 정렬
  const filteredRecords = [...records]
    .filter((record) => {
      if (record.user !== selectedUser || record.ticker !== selectedTicker) return false;

      if (dateRange && dateRange.from) {
        const recordDateArr = record.date.split('.');
        const rDate = new Date(Number(recordDateArr[0]), Number(recordDateArr[1]) - 1, Number(recordDateArr[2]));

        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to || dateRange.from);

        if (rDate < start || rDate > end) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const splitA = a.date.split('.');
      const splitB = b.date.split('.');
      const dateA = new Date(Number(splitA[0]), Number(splitA[1]) - 1, Number(splitA[2]));
      const dateB = new Date(Number(splitB[0]), Number(splitB[1]) - 1, Number(splitB[2]));

      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime(); // 날짜 내림차순
      }
      return b.time.localeCompare(a.time); // 시간 내림차순
    });

  const totalProfit = filteredRecords.reduce((acc, curr) => acc + curr.profit, 0);

  const handleEditStart = (record: ProfitRecord) => {
    setEditingId(record.id);
    setEditForm({ date: record.date, time: record.time, profit: record.profit.toLocaleString('ko-KR') });
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleEditSave = async (id: string) => {
    try {
      const parsedProfit = parseInt(editForm.profit.replace(/,/g, ''), 10);
      if (isNaN(parsedProfit)) {
        alert('올바른 수익 금액을 입력해주세요.');
        return;
      }
      await updateProfitRecord(id, {
        date: editForm.date,
        time: editForm.time,
        profit: parsedProfit
      });
      setEditingId(null);
    } catch (e) {
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleEditProfitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const onlyNums = rawValue.replace(/[^0-9-]/g, '');
    let finalStr = onlyNums;
    if (onlyNums.startsWith('-')) {
      finalStr = '-' + onlyNums.replace(/-/g, '');
    } else {
      finalStr = onlyNums.replace(/-/g, '');
    }
    if (finalStr === '' || finalStr === '-') {
      setEditForm({ ...editForm, profit: finalStr });
      return;
    }
    const num = parseInt(finalStr, 10);
    if (!isNaN(num)) {
      setEditForm({ ...editForm, profit: num.toLocaleString('ko-KR') });
    }
  };

  return (
    <div className="border border-slate-800 rounded-2xl p-4 md:p-5 bg-slate-900/80 shadow-xl shadow-black/40 flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:shadow-black/50">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="border border-slate-700 px-3 py-1.5 rounded-lg font-bold text-sm bg-slate-950 text-slate-100 shadow-inner flex items-center gap-2 min-w-[85px] justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)] shrink-0"></div>
            <span className="truncate">{selectedTicker}</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">({selectedUser} 데이터)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">총 수익</span>
          <div className={`font-bold text-xl min-w-[120px] text-right font-mono tracking-tight drop-shadow-sm ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {totalProfit > 0 ? '+' : ''}{totalProfit.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="overflow-hidden relative border border-slate-800 rounded-xl bg-slate-950/50">
        <ScrollArea type="scroll" className="h-[192px] w-full">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-10">
              <TableRow className="border-slate-800 hover:bg-slate-800/50 h-8">
                <TableHead className="text-slate-500 text-[10px] font-bold uppercase tracking-widest pl-4">날짜</TableHead>
                <TableHead className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">시간</TableHead>
                <TableHead className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">수익</TableHead>
                <TableHead className="text-right text-slate-500 text-[10px] font-bold uppercase tracking-widest w-[120px] pr-4">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-[160px] text-center text-slate-500 text-xs py-8">
                    기록된 수익 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => {
                  const isEditing = editingId === record.id;

                  if (isEditing) {
                    return (
                      <TableRow key={record.id} className="border-slate-800/50 bg-slate-800/30 transition-colors h-10">
                        <TableCell className="pl-4">
                          <Input value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="h-7 w-20 px-2 text-xs font-mono bg-slate-950 border-slate-700" />
                        </TableCell>
                        <TableCell>
                          <Input value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} className="h-7 w-16 px-2 text-xs font-mono bg-slate-950 border-slate-700" />
                        </TableCell>
                        <TableCell>
                          <Input value={editForm.profit} onChange={handleEditProfitChange} inputMode="numeric" className="h-7 w-28 px-2 text-xs font-mono bg-slate-950 border-slate-700 text-right" />
                        </TableCell>
                        <TableCell className="text-right space-x-1.5 pr-4">
                          <Button variant="default" size="sm" onClick={() => handleEditSave(record.id)} className="h-6 px-2 text-[10px] bg-emerald-500 hover:bg-emerald-400 text-slate-950">저장</Button>
                          <Button variant="outline" size="sm" onClick={handleEditCancel} className="h-6 px-2 text-[10px] bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200">취소</Button>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow key={record.id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors h-10">
                      <TableCell className="font-mono text-xs text-slate-400 pl-4">{record.date}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{record.time}</TableCell>
                      <TableCell className={`font-mono font-bold text-[15px] tracking-tight ${record.profit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {record.profit > 0 ? '+' : ''}{record.profit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right space-x-1.5 pr-4">
                        <Button variant="outline" size="sm" onClick={() => handleEditStart(record)} className="h-6 px-2 text-[10px] bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800">수정</Button>
                        <Button variant="outline" size="sm" onClick={() => setRecordToDelete(record.id)} className="h-6 px-2 text-[10px] bg-slate-950 border-rose-900/30 text-rose-500 hover:bg-rose-950 hover:text-rose-400">삭제</Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
