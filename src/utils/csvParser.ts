import { Student } from '../types';

export const SAMPLE_STUDENTS: Student[] = [
  { id: 's-1', studentNumber: '01', name: '林子軒', isPresent: true },
  { id: 's-2', studentNumber: '02', name: '陳品妍', isPresent: true },
  { id: 's-3', studentNumber: '03', name: '張祐嘉', isPresent: true },
  { id: 's-4', studentNumber: '04', name: '黃冠宇', isPresent: true },
  { id: 's-5', studentNumber: '05', name: '李承翰', isPresent: true },
  { id: 's-6', studentNumber: '06', name: '王心語', isPresent: true },
  { id: 's-7', studentNumber: '07', name: '吳睿恩', isPresent: true },
  { id: 's-8', studentNumber: '08', name: '劉宇翔', isPresent: true },
  { id: 's-9', studentNumber: '09', name: '蔡欣妤', isPresent: true },
  { id: 's-10', studentNumber: '10', name: '楊凱文', isPresent: true },
  { id: 's-11', studentNumber: '11', name: '許庭瑋', isPresent: true },
  { id: 's-12', studentNumber: '12', name: '鄭雅婷', isPresent: true },
  { id: 's-13', studentNumber: '13', name: '謝宗翰', isPresent: true },
  { id: 's-14', studentNumber: '14', name: '洪子晴', isPresent: true },
  { id: 's-15', studentNumber: '15', name: '郭柏廷', isPresent: true },
  { id: 's-16', studentNumber: '16', name: '曾敬堯', isPresent: true },
  { id: 's-17', studentNumber: '17', name: '邱依婷', isPresent: true },
  { id: 's-18', studentNumber: '18', name: '廖偉辰', isPresent: true },
  { id: 's-19', studentNumber: '19', name: '賴宣佑', isPresent: true },
  { id: 's-20', studentNumber: '20', name: '徐若瑄', isPresent: true },
  { id: 's-21', studentNumber: '21', name: '周宏達', isPresent: true },
  { id: 's-22', studentNumber: '22', name: '葉芷萱', isPresent: true },
  { id: 's-23', studentNumber: '23', name: '蘇俊傑', isPresent: true },
  { id: 's-24', studentNumber: '24', name: '莊詠晴', isPresent: true },
  { id: 's-25', studentNumber: '25', name: '江奕廷', isPresent: true },
  { id: 's-26', studentNumber: '26', name: '何佳穎', isPresent: true },
  { id: 's-27', studentNumber: '27', name: '羅震宇', isPresent: true },
  { id: 's-28', studentNumber: '28', name: '高語彤', isPresent: true },
];

/**
 * Parses raw text input (from paste) or CSV file content.
 * Intelligently recognizes columns: student number, name, notes.
 */
export function parseRosterText(rawText: string): Student[] {
  if (!rawText || !rawText.trim()) return [];

  // Clean BOM and standardize line breaks
  const cleaned = rawText.replace(/^\uFEFF/, '').trim();
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) return [];

  // Check if first line is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes('姓名') ||
    firstLine.includes('name') ||
    firstLine.includes('座號') ||
    firstLine.includes('學號') ||
    firstLine.includes('學生') ||
    firstLine.includes('number') ||
    firstLine.includes('no');

  const contentLines = hasHeader ? lines.slice(1) : lines;
  const results: Student[] = [];

  contentLines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Detect delimiter: comma, semicolon, tab, or spaces
    let parts: string[] = [];
    if (trimmed.includes(',')) {
      parts = trimmed.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
    } else if (trimmed.includes('\t')) {
      parts = trimmed.split('\t').map((p) => p.trim());
    } else if (trimmed.includes(';') || trimmed.includes('、')) {
      parts = trimmed.split(/[;、]/).map((p) => p.trim());
    } else {
      // If line contains spaces, like "01 王大明" or "1. 陳小明"
      const matchNumbered = trimmed.match(/^(\d+)[.\s、\t]+(.+)$/);
      if (matchNumbered) {
        parts = [matchNumbered[1], matchNumbered[2].trim()];
      } else {
        parts = [trimmed];
      }
    }

    if (parts.length === 1) {
      // Just name, or numbered like "01 林小明"
      const single = parts[0];
      const match = single.match(/^(\d+)[.\s、\t]+(.+)$/);
      if (match) {
        results.push({
          id: `stu-${Date.now()}-${index}`,
          studentNumber: match[1].padStart(2, '0'),
          name: match[2].trim(),
          isPresent: true,
        });
      } else {
        results.push({
          id: `stu-${Date.now()}-${index}`,
          studentNumber: String(index + 1).padStart(2, '0'),
          name: single.trim(),
          isPresent: true,
        });
      }
    } else if (parts.length >= 2) {
      // Could be [座號, 姓名] or [姓名, 座號] or [座號, 姓名, 備註]
      const part0 = parts[0];
      const part1 = parts[1];
      const part2 = parts[2] || '';

      const isPart0Number = /^\d+$/.test(part0);
      const isPart1Number = /^\d+$/.test(part1);

      let name = '';
      let studentNumber = '';
      let note = part2;

      if (isPart0Number && !isPart1Number) {
        studentNumber = part0.padStart(2, '0');
        name = part1;
      } else if (!isPart0Number && isPart1Number) {
        studentNumber = part1.padStart(2, '0');
        name = part0;
      } else {
        // Fallback: take part 0 as name or part 1 as name
        studentNumber = String(index + 1).padStart(2, '0');
        name = part0 || part1;
      }

      if (name.trim()) {
        results.push({
          id: `stu-${Date.now()}-${index}`,
          studentNumber,
          name: name.trim(),
          note: note.trim() || undefined,
          isPresent: true,
        });
      }
    }
  });

  return results;
}

/**
 * Formats roster into downloadable CSV
 */
export function exportRosterToCSV(students: Student[]): string {
  const header = '座號,姓名,備註,出席狀態\n';
  const rows = students.map(
    (s) => `${s.studentNumber || ''},"${s.name}","${s.note || ''}",${s.isPresent ? '出席' : '請假'}`
  );
  return '\uFEFF' + header + rows.join('\n');
}
