import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  Dices,
  BookOpen,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  GraduationCap,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface NavbarProps {
  activeTab: 'picker' | 'grouper';
  setActiveTab: (tab: 'picker' | 'grouper') => void;
  studentCount: number;
  presentCount: number;
  onOpenRoster: (tab?: 'manage' | 'upload' | 'paste' | 'demo') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  studentCount,
  presentCount,
  onOpenRoster,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getIsMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    soundManager.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-2xs print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight leading-tight">
              課堂小幫手
            </h1>
            <p className="text-[11px] text-stone-500 hidden sm:block">
              隨機點名抽籤與自動分組工具
            </p>
          </div>
        </div>

        {/* Center Main Tab Switcher */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs sm:text-sm font-bold">
          <button
            id="nav-tab-picker"
            type="button"
            onClick={() => setActiveTab('picker')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'picker'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>隨機抽籤點名</span>
          </button>

          <button
            id="nav-tab-grouper"
            type="button"
            onClick={() => setActiveTab('grouper')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'grouper'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Dices className="w-4 h-4 text-sky-600" />
            <span>自動分組</span>
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Simulated List Quick Demo Button */}
          <button
            id="nav-btn-demo"
            type="button"
            onClick={() => onOpenRoster('demo')}
            className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="查看教學情境模擬名單"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">模擬名單</span>
          </button>

          {/* Roster trigger button */}
          <button
            id="nav-btn-roster"
            type="button"
            onClick={() => onOpenRoster('manage')}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="查看或編輯學生名單"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden md:inline">學生名單</span>
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full text-[10px] font-mono">
              {presentCount}/{studentCount}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            id="nav-btn-sound"
            type="button"
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title={isMuted ? '音效已關閉，點擊開啟' : '音效開啟中，點擊關閉'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="nav-btn-fullscreen"
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition-colors hidden sm:block"
            title={isFullscreen ? '退出全螢幕' : '進入投影全螢幕模式'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
