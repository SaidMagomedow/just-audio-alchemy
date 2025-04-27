import { UUID } from 'crypto';

export interface UserProductPlan {
  product_id: UUID;
  minute_count_limit: number;
  minute_count_used: number;
  gpt_request_limit_one_file: number;
  is_can_select_gpt_model: number;
  vtt_file_ext_support: number;
  srt_file_ext_support: number;
  is_can_remove_melody: number;
  is_can_remove_vocal: number;
  is_can_remove_noise: number;
  is_subscription: boolean;
  amount: number;
  expires_at: string;
} 