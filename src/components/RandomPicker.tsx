import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Student, PickMode, PickHistoryItem } from '../types';
import { soundManager } from '../utils/audio';
import {
  Sparkles,
  RotateCcw,
  History,
  CheckCircle2,
  Clock,
  Settings2,
  Volume2,
  VolumeX,
  Zap,
  Users,
  Award,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface RandomPickerProps {
  students: Student[];
  onOpenRoster: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onOpenRoster,
}) => {
  // Mode: 'no-duplicate' (不重複) or 'allow-duplicate' (允許重複)
  const [pickMode, setPickMode] = useState<PickMode>('no-duplicate');
  const [animationDuration, setAnimationDuration] = useState<number>(3.5); // seconds
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [currentDisplayName, setCurrentDisplayName] = useState<string>('準備就緒');
  const [currentDisplayNumber, setCurrentDisplayNumber] = useState<string>('');
  const [selectedWinner, setSelectedWinner] = useState<Student | null>(null);
  const [pickHistory, setPickHistory] = useState<PickHistoryItem[]>([]);
  const [drawnStudentIds, setDrawnStudentIds] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getIsMuted());

  // Filter only present students
  const activeStudents = students.filter((s) => s.isPresent !== false);

  // Remaining candidate pool for no-duplicate mode
  const eligibleStudents =
    pickMode === 'no-duplicate'
      ? activeStudents.filter((s) => !drawnStudentIds.has(s.id))
      : activeStudents;

  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRollingRef = useRef<boolean>(false);

  // Sync isRollingRef
  useEffect(() => {
    isRollingRef.current = isRolling;
  }, [isRolling]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    };
  }, []);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    soundManager.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const handleResetDrawn = () => {
    setDrawnStudentIds(new Set());
    setSelectedWinner(null);
    setCurrentDisplayName('已重置籤筒');
    setCurrentDisplayNumber('');
  };

  const handleClearHistory = () => {
    setPickHistory([]);
  };

  /**
   * Main rolling lottery animation with dynamic sound effects
   */
  const startLottery = () => {
    if (isRolling) return;
    if (activeStudents.length === 0) return;

    if (pickMode === 'no-duplicate' && eligibleStudents.length === 0) {
      alert('全班同學皆已抽取完畢！請點擊「重置抽籤池」即可重新開始新一輪。');
      return;
    }

    setIsRolling(true);
    setSelectedWinner(null);

    // Pick final target upfront from eligible pool
    const candidates = eligibleStudents.length > 0 ? eligibleStudents : activeStudents;
    const targetWinner = candidates[Math.floor(Math.random() * candidates.length)];

    const startTime = Date.now();
    const totalDurationMs = animationDuration * 1000;
    let tickCounter = 0;

    const runStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDurationMs, 1);

      // Rapidly randomize display name
      const randomCandidate = activeStudents[Math.floor(Math.random() * activeStudents.length)];
      setCurrentDisplayName(randomCandidate.name);
      setCurrentDisplayNumber(randomCandidate.studentNumber || '');

      // Play tick sound with pitch ramp
      tickCounter++;
      if (tickCounter % 2 === 0) {
        soundManager.playTick(0.8 + progress * 0.6);
      }

      if (progress < 1) {
        // Dynamic speed curve: fast at first (40ms), slowly tapering to 240ms at the end
        // Easing formula (easeOutCubic)
        const delay = 40 + Math.pow(progress, 2.5) * 220;
        rollIntervalRef.current = setTimeout(runStep, delay);
      } else {
        // Animation finished! Stop on target winner
        finalizeLottery(targetWinner);
      }
    };

    runStep();
  };

  const finalizeLottery = (winner: Student) => {
    setIsRolling(false);
    setSelectedWinner(winner);
    setCurrentDisplayName(winner.name);
    setCurrentDisplayNumber(winner.studentNumber || '');

    // 1. Play celebratory fanfare audio!
    soundManager.playFanfare();

    // 2. Fire celebratory confetti effect!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
      });
      // Second burst for extra excitement
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch {
      // Confetti fallback
    }

    // 3. Record history
    const historyItem: PickHistoryItem = {
      id: `pick-${Date.now()}`,
      student: winner,
      timestamp: new Date(),
      roundNumber: pickHistory.length + 1,
    };
    setPickHistory((prev) => [historyItem, ...prev]);

    // 4. If no-duplicate mode, add to drawn set
    if (pickMode === 'no-duplicate') {
      setDrawnStudentIds((prev) => new Set([...prev, winner.id]));
    }
  };

  // Keyboard shortcut: Spacebar to pick
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !isRolling
      ) {
        e.preventDefault();
        startLottery();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRolling, eligibleStudents, activeStudents, pickMode]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner: Roster quick status */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-stone-900 text-base">目前抽籤籤筒</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                可抽學生：{eligibleStudents.length} / {activeStudents.length} 人
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {students.length === 0
                ? '尚未建立學生名單，請先匯入或建立名單'
                : `全班共 ${students.length} 人，${activeStudents.length} 位在場參與抽籤`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-sound-toggle"
            type="button"
            onClick={toggleSound}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isMuted
                ? 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title={isMuted ? '已靜音，點擊開啟抽籤音效' : '音效已開啟，點擊靜音'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
            {isMuted ? '音效已關閉' : '音效已開啟'}
          </button>

          <button
            id="btn-open-roster-from-picker"
            onClick={onOpenRoster}
            className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            名單管理
          </button>
        </div>
      </div>

      {/* Main Drawing Stage Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Large Presentation Screen */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Visual Showcase Card */}
          <div
            id="picker-lottery-card"
            className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200/80 shadow-md relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] text-center"
          >
            {/* Background Decorative Accent */}
            <div className="absolute top-0 inset-x-0 h-2 bg-linear-to-r from-amber-400 via-orange-400 to-amber-500" />
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

            {/* Mode badge at top */}
            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
              {pickMode === 'no-duplicate' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>不重複抽取模式 (籤筒剩餘 {eligibleStudents.length} 人)</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  <span>允許重複抽取模式 (每次機率均等)</span>
                </>
              )}
            </div>

            {/* Huge Name Display Box */}
            <div
              className={`w-full max-w-lg py-8 px-6 my-2 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center relative ${
                selectedWinner
                  ? 'bg-amber-50/70 border-amber-400 shadow-lg ring-4 ring-amber-100 scale-105'
                  : isRolling
                  ? 'bg-stone-50 border-amber-400/80 shadow-md animate-pulse'
                  : 'bg-stone-50/70 border-dashed border-stone-300'
              }`}
            >
              {/* Student Number pill */}
              {currentDisplayNumber && (
                <span className="mb-2 px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-200 text-amber-900">
                  座號 {currentDisplayNumber}
                </span>
              )}

              {/* Main Name text */}
              <div
                className={`text-4xl sm:text-6xl font-extrabold tracking-wide transition-all ${
                  selectedWinner
                    ? 'text-amber-950 scale-110 drop-shadow-xs'
                    : isRolling
                    ? 'text-stone-900 blur-[0.3px]'
                    : 'text-stone-400'
                }`}
              >
                {currentDisplayName}
              </div>

              {/* Winner Celebration badge */}
              {selectedWinner && (
                <div className="mt-4 flex items-center gap-1.5 text-sm font-bold text-amber-800 bg-amber-100/90 px-4 py-1 rounded-full animate-bounce">
                  <Award className="w-4 h-4 text-amber-600" />
                  恭喜被抽中！
                </div>
              )}
            </div>

            {/* Action Big Button */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                id="btn-start-pick"
                type="button"
                onClick={startLottery}
                disabled={isRolling || activeStudents.length === 0}
                className={`group relative px-10 py-4 rounded-2xl font-extrabold text-lg sm:text-xl text-white shadow-lg transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                  isRolling
                    ? 'bg-stone-400 cursor-not-allowed shadow-none'
                    : activeStudents.length === 0
                    ? 'bg-stone-300 cursor-not-allowed'
                    : 'bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:scale-105 active:scale-95'
                }`}
              >
                <Sparkles className={`w-6 h-6 ${isRolling ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
                <span>{isRolling ? '緊張抽籤中...' : '開始隨機抽籤'}</span>
              </button>

              <span className="text-xs text-stone-400 flex items-center gap-1">
                <span>💡 小提示：也可直接按鍵盤</span>
                <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded-md font-mono text-[11px] text-stone-600 font-semibold shadow-2xs">
                  Space 空白鍵
                </kbd>
                <span>抽籤</span>
              </span>
            </div>
          </div>

          {/* Teacher Configuration Box */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-600" />
              抽籤規則與動畫設定
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Rule: Allow vs Disallow duplicates */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <label className="text-xs font-bold text-stone-700 block">抽取重複設定：</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="mode-no-duplicate"
                    type="button"
                    onClick={() => setPickMode('no-duplicate')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                      pickMode === 'no-duplicate'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    🎯 不重複抽取
                  </button>
                  <button
                    id="mode-allow-duplicate"
                    type="button"
                    onClick={() => setPickMode('allow-duplicate')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                      pickMode === 'allow-duplicate'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    🔄 允許重複抽取
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  {pickMode === 'no-duplicate'
                    ? '抽出後的學生會被移出抽籤筒，全體同學皆輪過後才重置。'
                    : '抽完後放回籤筒，所有同學每次抽籤機率均等。'}
                </p>
              </div>

              {/* Animation Duration Setting */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <label className="text-xs font-bold text-stone-700 block flex items-center justify-between">
                  <span>抽籤動畫時長：</span>
                  <span className="text-amber-700 font-mono font-bold">{animationDuration} 秒</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '快速 (1.5s)', val: 1.5 },
                    { label: '標準 (3.5s)', val: 3.5 },
                    { label: '懸疑 (5.5s)', val: 5.5 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setAnimationDuration(preset.val)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                        animationDuration === preset.val
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  伴隨漸進減速旋轉動畫與即時音效，打造刺激課堂氣氛。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: History & Unpicked Pool Status */}
        <div className="lg:col-span-4 space-y-5">
          {/* No-duplicate status card */}
          {pickMode === 'no-duplicate' && (
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-600" />
                  籤筒輪流進度
                </span>
                <button
                  id="btn-reset-pool"
                  type="button"
                  onClick={handleResetDrawn}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重置本輪籤筒
                </button>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs font-medium text-stone-600 mb-1">
                  <span>已抽出 {drawnStudentIds.size} 人</span>
                  <span>剩餘 {eligibleStudents.length} 人</span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                  <div
                    className="h-full bg-linear-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{
                      width: `${activeStudents.length ? (drawnStudentIds.size / activeStudents.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Remaining Students Chip List */}
              <div className="pt-1">
                <span className="text-[11px] text-stone-400 block mb-1.5">尚未被抽出的學生：</span>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                  {eligibleStudents.length === 0 ? (
                    <span className="text-xs text-emerald-700 font-semibold py-1">🎉 全員皆已抽過一輪！</span>
                  ) : (
                    eligibleStudents.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200/80"
                      >
                        {s.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Drawer / Log */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col h-[420px]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                本次抽籤紀錄 ({pickHistory.length})
              </h3>
              {pickHistory.length > 0 && (
                <button
                  id="btn-clear-history"
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs text-stone-400 hover:text-rose-600 transition-colors"
                >
                  清空紀錄
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-100">
              {pickHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone-400 space-y-2">
                  <Clock className="w-8 h-8 text-stone-300" />
                  <p className="text-xs">尚無抽籤紀錄，按下按鈕開始點名吧！</p>
                </div>
              ) : (
                pickHistory.map((item, index) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {pickHistory.length - index}
                      </span>
                      <div>
                        <div className="font-bold text-stone-800 text-sm">
                          {item.student.name}
                          {item.student.studentNumber && (
                            <span className="ml-1 text-xs text-stone-400 font-normal">
                              ({item.student.studentNumber}號)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
