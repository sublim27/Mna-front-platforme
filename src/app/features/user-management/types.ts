export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleStyle {
  bg: string;
  color: string;
}

export const ROLE_STYLES: Record<string, RoleStyle> = {
  admin: { bg: '#F0F4FF', color: '#2563EB' },
  user: { bg: '#E6F7F9', color: '#1AABBA' },
};
