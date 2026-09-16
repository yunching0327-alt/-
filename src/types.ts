export interface Student {
  id: string;
  name: string;
  studentNumber?: string; // 座號 or 學號
  note?: string;
  isPresent?: boolean; // 是否在場/出席
}

export type PickMode = 'no-duplicate' | 'allow-duplicate';

export interface PickHistoryItem {
  id: string;
  student: Student;
  timestamp: Date;
  roundNumber: number;
}

export type GroupingStrategy = 'by-size' | 'by-count';
export type RemainderStrategy = 'distribute' | 'create-extra';

export interface GroupTheme {
  id: string;
  name: string;
  labels: string[];
}

export interface StudentGroup {
  id: string;
  groupNumber: number;
  name: string;
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    accent: string;
  };
  members: Student[];
}
