import React, { useState, useEffect } from 'react';
import { Student, StudentGroup, GroupingStrategy, RemainderStrategy } from '../types';
import {
  generateGroups,
  formatGroupsToText,
  GROUP_THEMES,
} from '../utils/grouping';
import { soundManager } from '../utils/audio';
import {
  Users,
  Shuffle,
  Copy,
  Download,
  Settings,
  Check,
  ArrowRightLeft,
  Sparkles,
  Maximize2,
  Minimize2,
  Printer,
  ChevronDown,
} from 'lucide-react';

interface AutoGrouperProps {
  students: Student[];
  onOpenRoster: () => void;
}

export const AutoGrouper: React.FC<AutoGrouperProps> = ({
  students,
  onOpenRoster,
}) => {
  // Group settings
  const [strategy, setStrategy] = useState<GroupingStrategy>('by-size');
  const [groupSize, setGroupSize] = useState<number>(4);
  const [groupCount, setGroupCount] = useState<number>(4);
  const [remainderStrategy, setRemainderStrategy] = useState<RemainderStrategy>('distribute');
  const [themeId, setThemeId] = useState<string>('numbers');

  // Groups state
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [selectedStudentToMove, setSelectedStudentToMove] = useState<{
    student: Student;
    fromGroupId: string;
  } | null>(null);

  const activeStudents = students.filter((s) => s.isPresent !== false);

  // Perform grouping
  const handleGenerateGroups = () => {
    if (activeStudents.length === 0) return;

    setIsShuffling(true);
    soundManager.playShuffle();

    setTimeout(() => {
      const result = generateGroups({
        students,
        groupSize,
        strategy,
        groupCount,
        remainderStrategy,
        themeId,
      });
      setGroups(result);
      setIsShuffling(false);
      setSelectedStudentToMove(null);
    }, 280);
  };

  // Auto-generate on first load if we have students and no groups yet
  useEffect(() => {
    if (students.length > 0 && groups.length === 0) {
      handleGenerateGroups();
    }
  }, [students.length]);

  // Copy result to clipboard
  const handleCopyText = async () => {
    if (groups.length === 0) return;
    const text = formatGroupsToText(groups);
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (groups.length === 0) return;
    let csvContent = '\uFEFF組別,座號,姓名\n';
    groups.forEach((g) => {
      g.members.forEach((m) => {
        csvContent += `"${g.name}","${m.studentNumber || ''}","${m.name}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `分組結果_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Move a member from one group to another
  const handleMoveMember = (targetGroupId: string) => {
    if (!selectedStudentToMove || selectedStudentToMove.fromGroupId === targetGroupId) {
      setSelectedStudentToMove(null);
      return;
    }

    const { student, fromGroupId } = selectedStudentToMove;

    setGroups((prevGroups) =>
      prevGroups.map((grp) => {
        if (grp.id === fromGroupId) {
          return { ...grp, members: grp.members.filter((m) => m.id !== student.id) };
        }
        if (grp.id === targetGroupId) {
          return { ...grp, members: [...grp.members, student] };
        }
        return grp;
      })
    );

    setSelectedStudentToMove(null);
  };

  // Print layout trigger
  const handlePrint = () => {
    window.print();
  };

  // Estimated preview of how many groups will form
  const estimatedGroupCount =
    strategy === 'by-size'
      ? remainderStrategy === 'create-extra'
        ? Math.ceil(activeStudents.length / Math.max(1, groupSize))
        : Math.max(1, Math.floor(activeStudents.length / Math.max(1, groupSize)))
      : groupCount;

  return (
    <div className={`space-y-6 max-w-6xl mx-auto ${isPresentationMode ? 'p-6 bg-stone-100 min-h-screen' : ''}`}>
      {/* Configuration & Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-base">自動分組功能</h2>
              <p className="text-xs text-stone-500">
                可自訂每組人數或組數，快速產生公平隨機分組與視覺化卡片
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPresentationMode(!isPresentationMode)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="切換投影大螢幕檢視模式"
            >
              {isPresentationMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {isPresentationMode ? '一般視圖' : '投影全螢幕模式'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              列印分組表
            </button>
          </div>
        </div>

        {/* Setting Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          {/* Method selector: By Size vs By Count */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">分組依據方式：</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setStrategy('by-size')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                  strategy === 'by-size'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300'
                }`}
              >
                每組幾人
              </button>
              <button
                type="button"
                onClick={() => setStrategy('by-count')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                  strategy === 'by-count'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300'
                }`}
              >
                總共分幾組
              </button>
            </div>
          </div>

          {/* Size / Count Value Input */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">
              {strategy === 'by-size' ? '設定每組人數：' : '設定分成幾組：'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={Math.max(activeStudents.length, 1)}
                value={strategy === 'by-size' ? groupSize : groupCount}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  if (strategy === 'by-size') setGroupSize(val);
                  else setGroupCount(val);
                }}
                className="w-20 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-center font-bold text-stone-800 text-sm focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-xs text-stone-500">
                {strategy === 'by-size' ? '人 / 組' : '個小組'}
              </span>
              <span className="text-xs font-semibold text-amber-700 ml-auto bg-amber-100/70 px-2 py-1 rounded-md">
                預計分 {estimatedGroupCount} 組
              </span>
            </div>
          </div>

          {/* Remainder Strategy */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">多餘人數處置：</label>
            <select
              value={remainderStrategy}
              onChange={(e) => setRemainderStrategy(e.target.value as RemainderStrategy)}
              className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-700 focus:ring-2 focus:ring-amber-500"
            >
              <option value="distribute">平均分配至各組 (推薦)</option>
              <option value="create-extra">獨立為一額外小組</option>
            </select>
          </div>

          {/* Group Name Theme */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">組別名稱風格：</label>
            <select
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-700 focus:ring-2 focus:ring-amber-500"
            >
              {GROUP_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate / Shuffle Big Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-stone-500">
            參與分組學生：<strong className="text-stone-800">{activeStudents.length}</strong> 人
            {students.length !== activeStudents.length && (
              <span className="ml-1 text-stone-400">
                ({students.length - activeStudents.length} 位請假已排除)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-generate-groups"
              type="button"
              onClick={handleGenerateGroups}
              disabled={activeStudents.length === 0 || isShuffling}
              className="px-6 py-2.5 bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>{isShuffling ? '洗牌分組中...' : '🎲 立即自動隨機分組'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Group Transfer Banner (if teacher clicked to move a student) */}
      {selectedStudentToMove && (
        <div className="p-3.5 bg-amber-500 text-white rounded-xl shadow-md flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            <span>
              正在調整 <strong>「{selectedStudentToMove.student.name}」</strong> 的組別：請點擊目標組別卡片右上方的
              「移動至此組」完成調組。
            </span>
          </div>
          <button
            onClick={() => setSelectedStudentToMove(null)}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-md font-semibold text-xs transition-colors"
          >
            取消調整
          </button>
        </div>
      )}

      {/* Visualized Groups Result Grid */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-800 text-lg">尚未產生分組</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            確認上方每組人數設定後，點擊「🎲 立即自動隨機分組」按鈕，系統將以視覺化卡片呈現各組名單！
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Result Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 print:hidden">
            <div className="flex items-center gap-2 text-sm text-stone-700">
              <span className="font-bold text-stone-900">分組結果視覺化</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200 text-stone-700">
                共 {groups.length} 組
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-copy-groups"
                type="button"
                onClick={handleCopyText}
                className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 rounded-lg border border-stone-200 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? '已複製名單！' : '複製分組名單'}
              </button>

              <button
                id="btn-export-groups-csv"
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 rounded-lg border border-stone-200 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                匯出分組 CSV
              </button>

              <button
                type="button"
                onClick={handleGenerateGroups}
                className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                重新打散洗牌
              </button>
            </div>
          </div>

          {/* Bento Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`rounded-2xl border-2 transition-all overflow-hidden flex flex-col bg-white shadow-xs hover:shadow-md ${
                  group.color.border
                } ${
                  selectedStudentToMove && selectedStudentToMove.fromGroupId !== group.id
                    ? 'ring-2 ring-amber-400 ring-offset-2'
                    : ''
                }`}
              >
                {/* Group Card Header */}
                <div className={`px-4 py-3 border-b flex items-center justify-between ${group.color.bg} ${group.color.border}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${group.color.badge}`}>
                      {group.groupNumber}
                    </span>
                    <h4 className={`font-extrabold text-sm sm:text-base ${group.color.text}`}>
                      {group.name}
                    </h4>
                  </div>

                  {selectedStudentToMove ? (
                    selectedStudentToMove.fromGroupId !== group.id ? (
                      <button
                        type="button"
                        onClick={() => handleMoveMember(group.id)}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-colors"
                      >
                        移至此組
                      </button>
                    ) : (
                      <span className="text-[11px] text-stone-400">目前所屬</span>
                    )
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${group.color.accent}`}>
                      {group.members.length} 人
                    </span>
                  )}
                </div>

                {/* Group Members List */}
                <div className="p-3.5 flex-1 space-y-2">
                  {group.members.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-400">尚無成員</div>
                  ) : (
                    group.members.map((member, memberIdx) => (
                      <div
                        key={member.id}
                        className="group flex items-center justify-between p-2 rounded-xl bg-stone-50/80 hover:bg-stone-100 border border-stone-200/60 transition-colors text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Seat number avatar */}
                          <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                            {member.studentNumber || memberIdx + 1}
                          </div>
                          <span className="font-bold text-stone-800 text-sm">
                            {member.name}
                          </span>
                        </div>

                        {/* Move student action button */}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedStudentToMove({
                              student: member,
                              fromGroupId: group.id,
                            })
                          }
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-amber-700 p-1 rounded transition-all"
                          title="調整此同學到其他組別"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer status */}
                <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-400 flex items-center justify-between">
                  <span>第 {group.groupNumber} 組成員名冊</span>
                  <span className="font-mono">{group.members.length} 位學生</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
