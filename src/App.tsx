import React, { useState, useEffect } from 'react';
import { Student } from './types';
import { SAMPLE_STUDENTS } from './utils/csvParser';
import { Navbar } from './components/Navbar';
import { RandomPicker } from './components/RandomPicker';
import { AutoGrouper } from './components/AutoGrouper';
import { RosterManagerModal } from './components/RosterManagerModal';
import { Sparkles, Dices, Users, Upload, RotateCcw } from 'lucide-react';

const STORAGE_KEY_STUDENTS = 'classroom_roster_students_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'picker' | 'grouper'>('picker');
  const [isRosterModalOpen, setIsRosterModalOpen] = useState<boolean>(false);
  const [rosterModalInitialTab, setRosterModalInitialTab] = useState<'manage' | 'upload' | 'paste' | 'demo'>('manage');

  // Initialize students from localStorage or fallback to SAMPLE_STUDENTS
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // LocalStorage access error
    }
    return SAMPLE_STUDENTS;
  });

  // Persist students to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch {
      // Ignore
    }
  }, [students]);

  const handleUpdateStudents = (updated: Student[]) => {
    setStudents(updated);
  };

  const handleOpenRoster = (tab: 'manage' | 'upload' | 'paste' | 'demo' = 'manage') => {
    setRosterModalInitialTab(tab);
    setIsRosterModalOpen(true);
  };

  const presentCount = students.filter((s) => s.isPresent !== false).length;

  return (
    <div className="min-h-screen bg-stone-50/80 text-stone-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={students.length}
        presentCount={presentCount}
        onOpenRoster={handleOpenRoster}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-16">
        {/* Quick Empty State Prompt */}
        {students.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 border border-stone-200 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-stone-900">歡迎使用課堂小幫手！</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              目前名單中尚無學生。您可以載入「模擬名單」快速了解網站功能，也可以上傳 CSV 檔案或直接貼上學生名冊！
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenRoster('demo')}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                載入模擬名單體驗
              </button>
              <button
                type="button"
                onClick={() => handleOpenRoster('upload')}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-stone-300 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                上傳 CSV 或貼上名單
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'picker' && (
              <RandomPicker
                students={students}
                onOpenRoster={() => handleOpenRoster('manage')}
              />
            )}

            {activeTab === 'grouper' && (
              <AutoGrouper
                students={students}
                onOpenRoster={() => handleOpenRoster('manage')}
              />
            )}
          </>
        )}
      </main>

      {/* Roster Management Modal */}
      <RosterManagerModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        students={students}
        onUpdateStudents={handleUpdateStudents}
        initialTab={rosterModalInitialTab}
      />

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white/70 py-4 px-6 text-center text-xs text-stone-400 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>✨ 教師教學輔助工具・隨機點名抽籤與視覺化自動分組</span>
          <span>支援 CSV 匯入・自訂重複抽取・音效與即時動畫</span>
        </div>
      </footer>
    </div>
  );
}
