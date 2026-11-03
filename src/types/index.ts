export type MembershipStatus = 'non_member' | 'member' | 'admin';

export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  password?: string;
  membership_status: MembershipStatus;
  created_at?: Date;
}

export interface Message {
  id: number;
  title: string;
  text: string;
  timestamp: Date;
  username: string;
}

declare global {
  namespace Express {
    interface User {
      id: number;
      full_name: string;
      username: string;
      email: string;
      membership_status: MembershipStatus;
      created_at?: Date;
    }
  }
}
