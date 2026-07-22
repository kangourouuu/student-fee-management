export type StudentStatus = 'enrolled' | 'inactive' | 'graduated' | 'suspended';

export interface Student {
  id: string;
  student_id: string;
  name: string;
  alias?: string;
  phone?: string;
  fee_per_session?: number;
  status: StudentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  record_date: string;
  is_present: boolean;
  created_at?: string;
}

export interface FeeStatement {
  id: string;
  student_id: string;
  billing_start_date: string;
  billing_end_date: string;
  fee_per_session?: number;
  total_days: number;
  total_fee: number;
  created_at?: string;
}
