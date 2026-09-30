export interface Student {
  id: string;
  name: string;
  number: number;
  color?: string;
  calledCount?: number;
  lastCalledAt?: number;
}

export type GameMode = 'cage' | 'wheel' | 'box' | 'balloon' | 'number';

export interface AppSettings {
  className: string;
  teacherName: string;
  duration: number; // in seconds (3, 5, 10)
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  speechEnabled: boolean;
  confettiEnabled: boolean;
  noRepeat: boolean;
}

export interface CallHistoryItem {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: number;
  calledAt: number;
  mode: GameMode;
  order: number;
}

export const DEFAULT_STUDENTS: Omit<Student, 'id' | 'number'>[] = [
  { name: 'Nguyễn Văn An' },
  { name: 'Trần Minh Anh' },
  { name: 'Lê Hoàng Bảo' },
  { name: 'Phạm Gia Hân' },
  { name: 'Nguyễn Thành Nam' },
  { name: 'Đặng Quỳnh Chi' },
  { name: 'Vũ Đức Huy' },
  { name: 'Hoàng Hải Đăng' },
  { name: 'Bùi Ngọc Mai' },
  { name: 'Đỗ Minh Khôi' },
  { name: 'Phan Bảo Ngọc' },
  { name: 'Ngô Tuấn Kiệt' },
  { name: 'Võ Thảo Linh' },
  { name: 'Dương Quang Vinh' },
  { name: 'Lý Gia Phúc' },
  { name: 'Hà Phương Anh' },
  { name: 'Đinh Trọng Nhân' },
  { name: 'Trịnh Kim Ngân' },
  { name: 'Mai Quốc Bảo' },
  { name: 'Lâm Bảo Trâm' },
];

export const BALL_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
];
