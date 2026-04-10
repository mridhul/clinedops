import { type MeResponse } from '../types/auth';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export type ProfileUpdateData = {
  full_name?: string;
  title?: string;
};

export const updateProfile = async (token: string, data: ProfileUpdateData): Promise<MeResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  const result = await response.json();
  return result.data;
};

export const uploadProfilePhoto = async (token: string, file: File): Promise<MeResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/auth/me/profile-photo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload profile photo');
  }

  const result = await response.json();
  return result.data;
};
