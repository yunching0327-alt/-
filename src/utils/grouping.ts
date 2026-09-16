import { GroupTheme, Student, StudentGroup } from '../types';

export const GROUP_COLOR_PALETTES = [
  {
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200',
    text: 'text-emerald-950',
    badge: 'bg-emerald-600 text-white',
    accent: 'bg-emerald-100 text-emerald-800',
  },
  {
    bg: 'bg-sky-50/80',
    border: 'border-sky-200',
    text: 'text-sky-950',
    badge: 'bg-sky-600 text-white',
    accent: 'bg-sky-100 text-sky-800',
  },
  {
    bg: 'bg-amber-50/80',
    border: 'border-amber-200',
    text: 'text-amber-950',
    badge: 'bg-amber-600 text-white',
    accent: 'bg-amber-100 text-amber-800',
  },
  {
    bg: 'bg-violet-50/80',
    border: 'border-violet-200',
    text: 'text-violet-950',
    badge: 'bg-violet-600 text-white',
    accent: 'bg-violet-100 text-violet-800',
  },
  {
    bg: 'bg-rose-50/80',
    border: 'border-rose-200',
    text: 'text-rose-950',
    badge: 'bg-rose-600 text-white',
    accent: 'bg-rose-100 text-rose-800',
  },
  {
    bg: 'bg-teal-50/80',
    border: 'border-teal-200',
    text: 'text-teal-950',
    badge: 'bg-teal-600 text-white',
    accent: 'bg-teal-100 text-teal-800',
  },
  {
    bg: 'bg-indigo-50/80',
    border: 'border-indigo-200',
    text: 'text-indigo-950',
    badge: 'bg-indigo-600 text-white',
    accent: 'bg-indigo-100 text-indigo-800',
  },
  {
    bg: 'bg-orange-50/80',
    border: 'border-orange-200',
    text: 'text-orange-950',
    badge: 'bg-orange-600 text-white',
    accent: 'bg-orange-100 text-orange-800',
  },
  {
    bg: 'bg-fuchsia-50/80',
    border: 'border-fuchsia-200',
    text: 'text-fuchsia-950',
    badge: 'bg-fuchsia-600 text-white',
    accent: 'bg-fuchsia-100 text-fuchsia-800',
  },
  {
    bg: 'bg-cyan-50/80',
    border: 'border-cyan-200',
    text: 'text-cyan-950',
    badge: 'bg-cyan-600 text-white',
    accent: 'bg-cyan-100 text-cyan-800',
  },
];

export const GROUP_THEMES: GroupTheme[] = [
  {
    id: 'numbers',
    name: '數字組別 (第 1 組...)',
    labels: Array.from({ length: 30 }, (_, i) => `第 ${i + 1} 組`),
  },
  {
    id: 'animals',
    name: '活力動物隊',
    labels: [
      '勇猛獅子組',
      '智慧海豚組',
      '敏捷獵豹組',
      '沉著大象組',
      '活力小鹿組',
      '飛翔老鷹組',
      '淘氣企鵝組',
      '靈巧狐狸組',
      '溫暖無尾熊組',
      '守護黑熊組',
      '翱翔貓頭鷹組',
      '迅捷海獺組',
    ],
  },
  {
    id: 'space',
    name: '星際探索隊',
    labels: [
      '太陽光芒隊',
      '月球基地隊',
      '火星探險隊',
      '木星引力隊',
      '土星光環隊',
      '金星晨曦隊',
      '水星極速隊',
      '海王深空隊',
      '天王星雲隊',
      '冥王奧秘隊',
    ],
  },
  {
    id: 'colors',
    name: '繽紛色彩隊',
    labels: [
      '陽光金黃隊',
      '極地冰藍隊',
      '活力草綠隊',
      '熱情赤紅隊',
      '神秘幽紫隊',
      '溫暖琥珀隊',
      '清新薄荷隊',
      '晨曦粉櫻隊',
    ],
  },
];

/**
 * Fisher-Yates shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Auto-groups active students
 */
export function generateGroups({
  students,
  groupSize,
  strategy = 'by-size',
  groupCount = 4,
  remainderStrategy = 'distribute',
  themeId = 'numbers',
}: {
  students: Student[];
  groupSize: number;
  strategy?: 'by-size' | 'by-count';
  groupCount?: number;
  remainderStrategy?: 'distribute' | 'create-extra';
  themeId?: string;
}): StudentGroup[] {
  const activeStudents = students.filter((s) => s.isPresent !== false);
  if (activeStudents.length === 0) return [];

  const shuffled = shuffleArray(activeStudents);
  const theme = GROUP_THEMES.find((t) => t.id === themeId) || GROUP_THEMES[0];

  let calculatedGroupCount: number;

  if (strategy === 'by-count') {
    calculatedGroupCount = Math.max(1, Math.min(groupCount, activeStudents.length));
  } else {
    // by group size
    const safeSize = Math.max(1, groupSize);
    if (remainderStrategy === 'create-extra') {
      calculatedGroupCount = Math.ceil(activeStudents.length / safeSize);
    } else {
      // distribute remainder into earlier groups
      calculatedGroupCount = Math.max(1, Math.floor(activeStudents.length / safeSize));
    }
  }

  // Initialize groups
  const groups: StudentGroup[] = Array.from({ length: calculatedGroupCount }, (_, i) => {
    const palette = GROUP_COLOR_PALETTES[i % GROUP_COLOR_PALETTES.length];
    const groupName = theme.labels[i] || `第 ${i + 1} 組`;
    return {
      id: `group-${Date.now()}-${i + 1}`,
      groupNumber: i + 1,
      name: groupName,
      color: palette,
      members: [],
    };
  });

  // Deal students like playing cards into groups for balanced distribution
  shuffled.forEach((student, index) => {
    const targetGroupIndex = index % calculatedGroupCount;
    groups[targetGroupIndex].members.push(student);
  });

  return groups;
}

/**
 * Format grouping result to plain text (for copying to LINE or notes)
 */
export function formatGroupsToText(groups: StudentGroup[]): string {
  const lines: string[] = ['📋 【分組名單結果】', ''];
  groups.forEach((g) => {
    const memberStr = g.members
      .map((m) => (m.studentNumber ? `${m.studentNumber}.${m.name}` : m.name))
      .join('、 ');
    lines.push(`【${g.name}】(${g.members.length}人):`);
    lines.push(`  ${memberStr}`);
    lines.push('');
  });
  return lines.join('\n');
}
