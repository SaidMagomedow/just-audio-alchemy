import api from '../api';
import { UserProductPlan } from '@/types/userPlan';
import axios from 'axios';

/**
 * Fetches the current user's subscription plan with usage limits
 * Throws an error if the user has no subscription plan (404) or
 * if another error occurs.
 */
export const getUserPlan = async (): Promise<UserProductPlan> => {
  try {
    const response = await api.get<UserProductPlan>('/products/user-plan');
    return response.data;
  } catch (error) {
    // Propagate the error so it can be handled properly in the UI
    throw error;
  }
}; 