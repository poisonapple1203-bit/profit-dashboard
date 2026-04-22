'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { TopBar } from '@/components/organisms/TopBar';
import { DashboardStats } from '@/components/organisms/DashboardStats';
import { ProfitInputForm } from '@/components/organisms/ProfitInputForm';
import { ProfitHistoryTable } from '@/components/organisms/ProfitHistoryTable';
import { Button } from '@/components/ui/button';
import { subscribeToRecords, deleteProfitRecord } from '@/lib/api';
import { useDashboardState, useDashboardActions } from '@/store';

export function DashboardTemplate() {
  const { setRecords, setTickerToDelete, setRecordToDelete, removeTicker } = useDashboardActions();
  const { tickerToDelete, recordToDelete } = useDashboardState();

  useEffect(() => {
    // 실시간 데이터 구독 설정
    const unsubscribe = subscribeToRecords((data) => {
      setRecords(data);
    });

    // 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, [setRecords]);

  const handleConfirmTickerDelete = () => {
    if (tickerToDelete) {
      removeTicker(tickerToDelete);
      setTickerToDelete(null);
    }
  };

  const handleConfirmRecordDelete = async () => {
    if (recordToDelete) {
      try {
        await deleteProfitRecord(recordToDelete);
        setRecordToDelete(null);
      } catch (e) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start md:py-6 relative overflow-hidden">
      {/* 백그라운드 블러 효과 (옵션) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[1000px] flex-1 flex flex-col bg-slate-900 border-x border-y-0 md:border md:border-slate-800 md:rounded-3xl shadow-2xl relative z-10 overflow-hidden">

        {/* 상단 통합 헤더 영역 */}
        <div className="z-20 sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-sm">
          <TopBar />
          <Sidebar />
        </div>

        <div className="flex-1 p-4 md:p-6 pb-6 md:pb-8 overflow-auto">
          <div className="space-y-4">
            {/* 통계 카드 구역 */}
            <DashboardStats />

            {/* 하단 폼 & 테이블 구역 (md 768px부터 양옆 배치) */}
            <div className="flex flex-col lg:flex-row gap-4 pt-2">
              <div className="w-full lg:w-1/3">
                <ProfitInputForm />
              </div>
              <div className="w-full lg:w-2/3">
                <ProfitHistoryTable />
              </div>
            </div>
          </div>

          {/* 푸터 (Copyright) */}
          <div className="mt-12 text-center flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-500">
            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
              © 2026 TITAN Partners. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>

      {/* 글로벌 티커 삭제 확인 모달 */}
      {tickerToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-[360px] shadow-2xl shadow-black/50">
            <h3 className="text-base font-bold text-slate-100 mb-2">티커 삭제</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              <span className="font-bold text-red-400">{tickerToDelete}</span> 티커를 목록에서 삭제하시겠습니까?
              <br />
              <span className="text-xs text-slate-500 mt-1 inline-block">해당 티커의 기존 수익 기록은 유지됩니다.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                className="h-9 px-4 text-sm bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => setTickerToDelete(null)}
              >
                취소
              </Button>
              <Button
                className="h-9 px-4 text-sm bg-red-500/90 hover:bg-red-400 text-white font-bold border-transparent"
                onClick={handleConfirmTickerDelete}
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 수익 기록 삭제 확인 모달 */}
      {recordToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-[360px] shadow-2xl shadow-black/50">
            <h3 className="text-base font-bold text-slate-100 mb-2">수익 기록 삭제</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              정말로 이 수익 기록을 삭제하시겠습니까?
              <br />
              <span className="text-xs text-slate-500 mt-1 inline-block">삭제된 기록은 복구할 수 없습니다.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                className="h-9 px-4 text-sm bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => setRecordToDelete(null)}
              >
                취소
              </Button>
              <Button
                className="h-9 px-4 text-sm bg-red-500/90 hover:bg-red-400 text-white font-bold border-transparent"
                onClick={handleConfirmRecordDelete}
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
