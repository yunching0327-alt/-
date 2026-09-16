import React, { useState, useRef, useEffect } from 'react';
import { Student } from '../types';
import { parseRosterText, exportRosterToCSV } from '../utils/csvParser';
import { DEMO_ROSTER_SCENARIOS, DemoRosterScenario } from '../data/demoRosters';
import {
  Upload,
  FileText,
  Trash2,
  UserPlus,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Search,
  Check,
  Sparkles,
  ArrowRight,
  CopyX,
  FileSpreadsheet,
} from 'lucide-react';

interface RosterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  initialTab?: 'manage' | 'upload' | 'paste' | 'demo';
}

export const RosterManagerModal: React.FC<RosterManagerModalProps> = ({
  isOpen,
  onClose,
  students,
  onUpdateStudents,
  initialTab = 'manage',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'manage' | 'demo'>(initialTab);
  const [pastedText, setPastedText] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Staging for imported students to inspect duplicates before applying
  const [importStaging, setImportStaging] = useState<{
    students: Student[];
    source: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setImportStaging(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Helper to find duplicates in any student array by trimmed name
  const getDuplicateNameCounts = (list: Student[]) => {
    const counts = new Map<string, number>();
    list.forEach((s) => {
      const name = s.name.trim();
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return counts;
  };

  // Process newly parsed students: check for duplicates and show staging preview
  const handleProcessIncomingStudents = (parsed: Student[], sourceDesc: string) => {
    const nameCounts = getDuplicateNameCounts(parsed);
    const duplicateNames = Array.from(nameCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([name]) => name);

    if (duplicateNames.length > 0) {
      // Has duplicates: show preview with duplicate warning & deduplicate button
      setImportStaging({
        students: parsed,
        source: sourceDesc,
      });
      showStatus(
        'info',
        `已讀取 ${parsed.length} 筆資料，發現 ${duplicateNames.length} 組重複姓名，請檢視預覽！`
      );
    } else {
      // Clean list: apply directly
      onUpdateStudents(parsed);
      setImportStaging(null);
      showStatus('success', `成功匯入 ${parsed.length} 位學生！`);
      setActiveTab('manage');
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      showStatus('error', '請上傳 .csv 或 .txt 格式的檔案');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseRosterText(content);
      if (parsed.length === 0) {
        showStatus('error', '未能從檔案中解析出學生名單，請確認格式');
        return;
      }
      handleProcessIncomingStudents(parsed, `CSV 檔案 (${file.name})`);
    };
    reader.onerror = () => {
      showStatus('error', '讀取檔案失敗，請重試');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      showStatus('error', '請先貼上或輸入學生名單');
      return;
    }
    const parsed = parseRosterText(pastedText);
    if (parsed.length === 0) {
      showStatus('error', '未能辨識出學生名單，請確認每行輸入一個姓名');
      return;
    }
    handleProcessIncomingStudents(parsed, '貼上的文字名單');
  };

  // Remove duplicates from staging list (keeps first occurrence of each name)
  const handleDeduplicateStaging = () => {
    if (!importStaging) return;
    const seen = new Set<string>();
    const deduplicated: Student[] = [];
    importStaging.students.forEach((s) => {
      const trimmed = s.name.trim();
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        deduplicated.push(s);
      }
    });

    const removedCount = importStaging.students.length - deduplicated.length;
    setImportStaging({
      ...importStaging,
      students: deduplicated,
    });
    showStatus('success', `已一次性移除 ${removedCount} 筆重複姓名！`);
  };

  // Confirm and apply staging list to roster
  const handleConfirmStagingImport = () => {
    if (!importStaging) return;
    onUpdateStudents(importStaging.students);
    const count = importStaging.students.length;
    setImportStaging(null);
    setPastedText('');
    showStatus('success', `已成功建立並儲存 ${count} 位學生名單！`);
    setActiveTab('manage');
  };

  // Cancel staging
  const handleCancelStaging = () => {
    setImportStaging(null);
    showStatus('info', '已取消匯入預覽');
  };

  // Deduplicate existing roster if duplicates currently exist
  const existingNameCounts = getDuplicateNameCounts(students);
  const existingDuplicateNames = Array.from(existingNameCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([name]) => name);

  const handleDeduplicateExisting = () => {
    const seen = new Set<string>();
    const deduplicated: Student[] = [];
    students.forEach((s) => {
      const trimmed = s.name.trim();
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        deduplicated.push(s);
      }
    });
    const removedCount = students.length - deduplicated.length;
    onUpdateStudents(deduplicated);
    showStatus('success', `已成功移除目前名單中的 ${removedCount} 個重複姓名！`);
  };

  const handleLoadScenario = (scenario: DemoRosterScenario) => {
    onUpdateStudents(scenario.students);
    showStatus('success', `已載入「${scenario.name}」（共 ${scenario.students.length} 位同學）！`);
    setActiveTab('manage');
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      name: newStudentName.trim(),
      studentNumber: newStudentNumber.trim() || String(students.length + 1).padStart(2, '0'),
      isPresent: true,
    };

    onUpdateStudents([...students, newStudent]);
    setNewStudentName('');
    setNewStudentNumber('');
    showStatus('success', `已新增學生「${newStudent.name}」`);
  };

  const handleTogglePresent = (id: string) => {
    onUpdateStudents(
      students.map((s) => (s.id === id ? { ...s, isPresent: !s.isPresent } : s))
    );
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    onUpdateStudents(students.filter((s) => s.id !== id));
    if (target) {
      showStatus('info', `已移除「${target.name}」`);
    }
  };

  const handleClearAll = () => {
    if (students.length === 0) return;
    if (window.confirm('確定要清空整份學生名單嗎？此操作無法還原。')) {
      onUpdateStudents([]);
      showStatus('info', '已清空名單');
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      showStatus('error', '名單目前為空，無法匯出');
      return;
    }
    const csvData = exportRosterToCSV(students);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `班級學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showStatus('success', '已成功下載 CSV 檔案');
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentNumber && s.studentNumber.includes(searchQuery))
  );

  const presentCount = students.filter((s) => s.isPresent !== false).length;

  // Staging list analysis
  const stagingNameCounts = importStaging ? getDuplicateNameCounts(importStaging.students) : new Map();
  const stagingDuplicateNames = Array.from(stagingNameCounts.entries())
    .filter(([_, count]) => (count as number) > 1)
    .map(([name]) => name as string);

  return (
    <div
      id="roster-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="roster-modal-container"
        className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">學生名單管理</h2>
              <p className="text-xs text-stone-500">
                目前共 {students.length} 位學生（出席：{presentCount} 人，請假：{students.length - presentCount} 人）
              </p>
            </div>
          </div>
          <button
            id="close-roster-modal-btn"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-2 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status Toast Notification */}
        {statusMessage && (
          <div
            className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-b border-rose-200'
                : 'bg-amber-50 text-amber-800 border-b border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {statusMessage.type === 'info' && <Check className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200 bg-stone-100/60 px-6 pt-2 gap-2 text-sm font-medium overflow-x-auto">
          <button
            id="tab-manage-students"
            type="button"
            onClick={() => {
              setImportStaging(null);
              setActiveTab('manage');
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'manage' && !importStaging
                ? 'border-amber-600 text-amber-800 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            名單檢視 ({students.length})
          </button>
          <button
            id="tab-demo-scenarios"
            type="button"
            onClick={() => {
              setImportStaging(null);
              setActiveTab('demo');
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'demo' && !importStaging
                ? 'border-amber-600 text-amber-800 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            模擬名單
          </button>
          <button
            id="tab-upload-csv"
            type="button"
            onClick={() => {
              setImportStaging(null);
              setActiveTab('upload');
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'upload' && !importStaging
                ? 'border-amber-600 text-amber-800 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            上傳 CSV 檔案
          </button>
          <button
            id="tab-paste-text"
            type="button"
            onClick={() => {
              setImportStaging(null);
              setActiveTab('paste');
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'paste' && !importStaging
                ? 'border-amber-600 text-amber-800 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            文字直接貼上
          </button>
        </div>

        {/* Tab Contents or Import Staging Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* IMPORT STAGING PREVIEW (With Duplicate Detection & One-Click Removal) */}
          {importStaging ? (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-amber-700" />
                    <span className="font-bold text-stone-900 text-sm">
                      匯入名單預覽 ({importStaging.source})
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold">
                      解析出 {importStaging.students.length} 筆
                    </span>
                  </div>

                  {stagingDuplicateNames.length > 0 && (
                    <button
                      id="btn-remove-duplicates"
                      type="button"
                      onClick={handleDeduplicateStaging}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <CopyX className="w-4 h-4" />
                      一次性移除重複姓名 ({stagingDuplicateNames.length} 組)
                    </button>
                  )}
                </div>

                {/* Duplicate Notification Banner */}
                {stagingDuplicateNames.length > 0 ? (
                  <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      檢測到重複姓名：
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {stagingDuplicateNames.map((name) => (
                        <span
                          key={name}
                          className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-medium font-mono text-[11px]"
                        >
                          {name} (出現 {stagingNameCounts.get(name)} 次)
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-500 pt-0.5">
                      重複的姓名已在下方預覽清單中標記黃色/紅色底色。您可以點選上方「一次性移除重複姓名」，系統將自動保留每位學生的第一筆記錄並移除後續重複項目。
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>名冊中無重複姓名，資料檢查正常！</span>
                  </div>
                )}
              </div>

              {/* Staging List Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 flex items-center justify-between text-xs font-bold text-stone-600">
                  <span>座號 / 姓名</span>
                  <span>狀態標記</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-stone-100">
                  {importStaging.students.map((student, idx) => {
                    const isDup = (stagingNameCounts.get(student.name.trim()) || 0) > 1;
                    return (
                      <div
                        key={student.id || idx}
                        className={`px-4 py-2 flex items-center justify-between text-sm transition-colors ${
                          isDup ? 'bg-amber-50/80 hover:bg-amber-100/80' : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-xs font-mono font-bold">
                            {student.studentNumber || String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="font-semibold text-stone-800">{student.name}</span>
                          {student.note && <span className="text-xs text-stone-400">({student.note})</span>}
                        </div>

                        {isDup ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-700" />
                            姓名重複
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs font-medium">正常</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Staging Confirmation Bar */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCancelStaging}
                  className="px-4 py-2 text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  取消，重新選擇或輸入
                </button>
                <button
                  id="btn-confirm-import"
                  type="button"
                  onClick={handleConfirmStagingImport}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  確認並套用至學生名冊 ({importStaging.students.length} 人)
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: MANAGE ROSTER */}
              {activeTab === 'manage' && (
                <div className="space-y-5">
                  {/* Notice if existing roster has duplicates */}
                  {existingDuplicateNames.length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          名單中目前有 <strong>{existingDuplicateNames.length} 組重複姓名</strong>（{existingDuplicateNames.join('、')}）
                        </span>
                      </div>
                      <button
                        onClick={handleDeduplicateExisting}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer shadow-2xs transition-colors"
                      >
                        一鍵移除重複
                      </button>
                    </div>
                  )}

                  {/* Quick Add Form */}
                  <form
                    onSubmit={handleAddSingleStudent}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap sm:flex-nowrap items-center gap-2 text-sm"
                  >
                    <div className="w-24">
                      <input
                        type="text"
                        placeholder="座號 (選填)"
                        value={newStudentNumber}
                        onChange={(e) => setNewStudentNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-stone-300 text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-center"
                      />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <input
                        type="text"
                        placeholder="輸入學生姓名 (例: 王小明)"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-stone-300 text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newStudentName.trim()}
                      className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      新增學生
                    </button>
                  </form>

                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        placeholder="搜尋學生姓名或座號..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-stone-50 rounded-lg border border-stone-200 text-stone-800 text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-switch-demo"
                        onClick={() => setActiveTab('demo')}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100/70 hover:bg-amber-100 rounded-lg border border-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        載入模擬名單
                      </button>
                      <button
                        id="btn-export-csv"
                        onClick={handleExportCSV}
                        disabled={students.length === 0}
                        className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 flex items-center gap-1 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        匯出 CSV
                      </button>
                      <button
                        id="btn-clear-roster"
                        onClick={handleClearAll}
                        disabled={students.length === 0}
                        className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 flex items-center gap-1 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        清空名單
                      </button>
                    </div>
                  </div>

                  {/* Student List View */}
                  {students.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center font-bold">
                        <Users className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-stone-800">目前尚無學生名單</h3>
                      <p className="text-xs text-stone-500 max-w-md mx-auto">
                        老師您可以點擊「載入模擬名單」快速探索功能，或是切換至「上傳 CSV 檔案」或「文字直接貼上」建立班級名冊！
                      </p>
                      <div className="pt-2 flex justify-center gap-2">
                        <button
                          onClick={() => setActiveTab('demo')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          探索模擬名單情境
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                      <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                        {filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            className={`px-4 py-2.5 flex items-center justify-between text-sm transition-colors ${
                              student.isPresent === false ? 'bg-stone-50 opacity-60' : 'hover:bg-amber-50/40'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-xs font-mono font-bold">
                                {student.studentNumber || '-'}
                              </span>
                              <div>
                                <span className="font-semibold text-stone-800 text-base">{student.name}</span>
                                {student.note && <span className="ml-2 text-xs text-stone-400">({student.note})</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleTogglePresent(student.id)}
                                className={`px-2.5 py-1 text-xs rounded-full font-medium flex items-center gap-1 transition-all cursor-pointer ${
                                  student.isPresent !== false
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                                }`}
                                title="點擊切換出席/請假狀態 (請假將不參與抽籤與分組)"
                              >
                                {student.isPresent !== false ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>在場出席</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5 text-stone-500" />
                                    <span>請假缺席</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(student.id)}
                                className="p-1 text-stone-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                                title="刪除這位學生"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DEMO ROSTERS (模擬名單功能) */}
              {activeTab === 'demo' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                    <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      教學情境模擬名單
                    </h3>
                    <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                      初次使用？您可以一鍵載入以下預設的模擬名單，立即體驗「隨機抽籤點名」的動畫音效，以及「自動分組」的視覺化卡片效果！
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DEMO_ROSTER_SCENARIOS.map((scenario) => (
                      <div
                        key={scenario.id}
                        className="bg-white p-4 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {scenario.badge}
                            </span>
                            <span className="text-xs font-mono font-bold text-stone-500">
                              {scenario.students.length} 位
                            </span>
                          </div>
                          <h4 className="font-bold text-stone-900 text-base">{scenario.name}</h4>
                          <p className="text-xs text-stone-500 leading-relaxed">
                            {scenario.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLoadScenario(scenario)}
                          className="w-full py-2 bg-stone-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>載入此模擬名單</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                    <span>💡 載入模擬名單後，您可以隨時在「名單檢視」中新增或調整學生資料。</span>
                    <button
                      onClick={() => setActiveTab('manage')}
                      className="text-amber-700 hover:underline font-bold cursor-pointer"
                    >
                      返回名單檢視
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: UPLOAD CSV */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-amber-500 bg-amber-50/60 scale-[0.99]'
                        : 'border-stone-300 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/20'
                    }`}
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-stone-800 mb-1">
                      拖曳 CSV 檔案至此處，或點擊瀏覽電腦檔案
                    </h4>
                    <p className="text-xs text-stone-500 mb-4">支援標準 .csv 或 .txt 名冊檔案 (自動偵測重複姓名)</p>
                    <span className="inline-block px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors">
                      選擇 CSV 檔案
                    </span>
                  </div>

                  {/* CSV Format Guide */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-2">
                    <div className="font-bold text-stone-800 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      CSV 格式支援說明：
                    </div>
                    <p>
                      系統自動辨識欄位名稱，例如表頭包含「姓名」、「座號」、「學號」皆可順利解析。若檔案內有重複姓名，系統會自動在預覽頁面標記並提供一鍵移除。
                    </p>
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200 font-mono text-[11px] text-stone-700 space-y-1">
                      <div>座號,姓名</div>
                      <div>01,陳品妍</div>
                      <div>02,張祐嘉</div>
                      <div>03,黃冠宇</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PASTE TEXT */}
              {activeTab === 'paste' && (
                <div className="space-y-4">
                  <div className="text-xs text-stone-600">
                    請在下方文字框中貼上名單，每行一位學生。系統支援「座號 姓名」格式（例如：<code>01 陳大明</code>）或純姓名。若有重複姓名，系統將在預覽時自動標記。
                  </div>

                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="林小明&#10;張美麗&#10;03 王小華&#10;李大同&#10;林小明 (重複測試)"
                    className="w-full p-3.5 bg-stone-50 border border-stone-300 rounded-xl font-mono text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />

                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPastedText(
                          '01 林小明\n02 陳美麗\n03 張家瑋\n04 林小明\n05 李婷婷\n06 張家瑋'
                        )
                      }
                      className="text-xs text-amber-700 hover:text-amber-800 underline cursor-pointer"
                    >
                      填入含重複姓名的測試範例
                    </button>
                    <button
                      type="button"
                      onClick={handlePasteSubmit}
                      disabled={!pastedText.trim()}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
                    >
                      預覽解析名單與檢查重複
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>💡 提示：名單會即時保存在本機瀏覽器中，隨時可用於抽籤與自動分組。</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-medium text-xs transition-colors cursor-pointer"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
