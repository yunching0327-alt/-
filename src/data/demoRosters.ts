import { Student } from '../types';

/**
 * 模擬名單範例庫：提供多種教學情境的示範名單，方便老師快速體驗抽籤與分組
 */
export interface DemoRosterScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  students: Student[];
}

export const DEMO_ROSTER_SCENARIOS: DemoRosterScenario[] = [
  {
    id: 'class-standard-28',
    name: '標準班級名冊 (28人)',
    badge: '最常用',
    description: '具備完整座號 01~28 號的中小學常態班級，適合測試 4 人或 7 人分組。',
    students: [
      { id: 'demo-1', studentNumber: '01', name: '林子軒', isPresent: true },
      { id: 'demo-2', studentNumber: '02', name: '陳品妍', isPresent: true },
      { id: 'demo-3', studentNumber: '03', name: '張祐嘉', isPresent: true },
      { id: 'demo-4', studentNumber: '04', name: '黃冠宇', isPresent: true },
      { id: 'demo-5', studentNumber: '05', name: '李承翰', isPresent: true },
      { id: 'demo-6', studentNumber: '06', name: '王心語', isPresent: true },
      { id: 'demo-7', studentNumber: '07', name: '吳睿恩', isPresent: true },
      { id: 'demo-8', studentNumber: '08', name: '劉宇翔', isPresent: true },
      { id: 'demo-9', studentNumber: '09', name: '蔡欣妤', isPresent: true },
      { id: 'demo-10', studentNumber: '10', name: '楊凱文', isPresent: true },
      { id: 'demo-11', studentNumber: '11', name: '許庭瑋', isPresent: true },
      { id: 'demo-12', studentNumber: '12', name: '鄭雅婷', isPresent: true },
      { id: 'demo-13', studentNumber: '13', name: '謝宗翰', isPresent: true },
      { id: 'demo-14', studentNumber: '14', name: '洪子晴', isPresent: true },
      { id: 'demo-15', studentNumber: '15', name: '郭柏廷', isPresent: true },
      { id: 'demo-16', studentNumber: '16', name: '曾敬堯', isPresent: true },
      { id: 'demo-17', studentNumber: '17', name: '邱依婷', isPresent: true },
      { id: 'demo-18', studentNumber: '18', name: '廖偉辰', isPresent: true },
      { id: 'demo-19', studentNumber: '19', name: '賴宣佑', isPresent: true },
      { id: 'demo-20', studentNumber: '20', name: '徐若瑄', isPresent: true },
      { id: 'demo-21', studentNumber: '21', name: '周宏達', isPresent: true },
      { id: 'demo-22', studentNumber: '22', name: '葉芷萱', isPresent: true },
      { id: 'demo-23', studentNumber: '23', name: '蘇俊傑', isPresent: true },
      { id: 'demo-24', studentNumber: '24', name: '莊詠晴', isPresent: true },
      { id: 'demo-25', studentNumber: '25', name: '江奕廷', isPresent: true },
      { id: 'demo-26', studentNumber: '26', name: '何佳穎', isPresent: true },
      { id: 'demo-27', studentNumber: '27', name: '羅震宇', isPresent: true },
      { id: 'demo-28', studentNumber: '28', name: '高語彤', isPresent: true },
    ],
  },
  {
    id: 'class-small-12',
    name: '專案研討小班 (12人)',
    badge: '小組討論',
    description: '人數適中的選修或專題研討小組，快速測試 3 人或 4 人一組。',
    students: [
      { id: 'demo-s1', studentNumber: '01', name: '陳思妤', note: '組長', isPresent: true },
      { id: 'demo-s2', studentNumber: '02', name: '林柏宏', isPresent: true },
      { id: 'demo-s3', studentNumber: '03', name: '張雅筑', isPresent: true },
      { id: 'demo-s4', studentNumber: '04', name: '黃俊傑', isPresent: true },
      { id: 'demo-s5', studentNumber: '05', name: '李佳蓉', isPresent: true },
      { id: 'demo-s6', studentNumber: '06', name: '王宗憲', isPresent: true },
      { id: 'demo-s7', studentNumber: '07', name: '趙子龍', isPresent: true },
      { id: 'demo-s8', studentNumber: '08', name: '孫尚香', isPresent: true },
      { id: 'demo-s9', studentNumber: '09', name: '諸葛亮', note: '計時員', isPresent: true },
      { id: 'demo-s10', studentNumber: '10', name: '周瑜', isPresent: true },
      { id: 'demo-s11', studentNumber: '11', name: '大喬', isPresent: true },
      { id: 'demo-s12', studentNumber: '12', name: '小喬', isPresent: true },
    ],
  },
  {
    id: 'class-with-absent-18',
    name: '含請假學生名冊 (18人)',
    badge: '請假情境',
    description: '包含 3 位已標記「請假」的學生，可直接體會不參與抽籤與分組的彈性機制。',
    students: [
      { id: 'demo-a1', studentNumber: '01', name: '王大偉', isPresent: true },
      { id: 'demo-a2', studentNumber: '02', name: '陳小萱', isPresent: true },
      { id: 'demo-a3', studentNumber: '03', name: '張建志', isPresent: false, note: '病假' },
      { id: 'demo-a4', studentNumber: '04', name: '李育慈', isPresent: true },
      { id: 'demo-a5', studentNumber: '05', name: '吳佩珊', isPresent: true },
      { id: 'demo-a6', studentNumber: '06', name: '黃信宏', isPresent: false, note: '公假' },
      { id: 'demo-a7', studentNumber: '07', name: '劉美華', isPresent: true },
      { id: 'demo-a8', studentNumber: '08', name: '蔡政翰', isPresent: true },
      { id: 'demo-a9', studentNumber: '09', name: '楊靜宜', isPresent: true },
      { id: 'demo-a10', studentNumber: '10', name: '許家豪', isPresent: true },
      { id: 'demo-a11', studentNumber: '11', name: '鄭惠雯', isPresent: true },
      { id: 'demo-a12', studentNumber: '12', name: '謝德倫', isPresent: true },
      { id: 'demo-a13', studentNumber: '13', name: '洪敏芳', isPresent: false, note: '事假' },
      { id: 'demo-a14', studentNumber: '14', name: '郭勝安', isPresent: true },
      { id: 'demo-a15', studentNumber: '15', name: '曾雅雯', isPresent: true },
      { id: 'demo-a16', studentNumber: '16', name: '邱啟明', isPresent: true },
      { id: 'demo-a17', studentNumber: '17', name: '廖珮君', isPresent: true },
      { id: 'demo-a18', studentNumber: '18', name: '賴俊霖', isPresent: true },
    ],
  },
];
