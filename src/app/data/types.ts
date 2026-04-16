export type UserRole = 'admin' | 'trainer' | 'trainee';

/**
 * حالة الحساب — تطابق enum `account_status` في قاعدة البيانات.
 * - active: نشط
 * - suspended: موقوف (تم إيقافه من الإدارة)
 * - inactive: غير نشط (حسابه موجود لكن لم يعد مستخدماً)
 */
export type AccountStatus = 'active' | 'suspended' | 'inactive';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  email: string;
  phone: string;
}

export interface Trainee {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  gender: 'male' | 'female';
  birthDate: string;
  branch: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: AccountStatus;
  notes: string;
  joinDate: string;
  subscription?: Subscription;
  lastAttendance?: string;
}

export interface Trainer {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  specialty: string;
  branch: string;
  status: AccountStatus;
  joinDate: string;
}

export interface Package {
  id: string;
  name: string;
  sessions: number;
  durationDays: number;
  price: number;
  cancellationHours: number;
  sessionTypes: string[];
  dailyLimit: number;
  renewable: boolean;
  description: string;
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  /** الباقة متاحة للإسناد للمتدربات الجدد. إذا غُفلت تُعامَل كـ true (توافق خلفي مع بيانات seed). */
  isActive?: boolean;
}

export interface Subscription {
  id: string;
  traineeId: string;
  packageId: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'frozen';
  cancellationHours: number;
}

export interface Session {
  id: string;
  name: string;
  type: string;
  trainerId: string;
  trainerName: string;
  date: string;
  startTime: string;
  endTime: string;
  branch: string;
  capacity: number;
  enrolled: number;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  notes: string;
}

export interface Booking {
  id: string;
  traineeId: string;
  traineeName: string;
  sessionId: string;
  sessionName: string;
  date: string;
  time: string;
  trainerName: string;
  branch: string;
  status: 'confirmed' | 'cancelled_with_refund' | 'cancelled_no_refund' | 'attended' | 'absent' | 'late' | 'waitlist';
  sessionDeducted: boolean;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  traineeId: string;
  date: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  balance: number;
}
