import { UUID } from 'crypto';

export interface UserProductPlan {
  product_id: UUID;
  minute_count_limit: number;
  minute_count_used: number;
  gpt_request_limit_one_file: number;
  is_can_select_gpt_model: boolean;
  vtt_file_ext_support: boolean;
  srt_file_ext_support: boolean;
  is_can_remove_melody: boolean;
  is_can_remove_vocal: boolean;
  is_can_remove_noise: boolean;
  is_can_enhance_audio: boolean;
  is_subscription: boolean;
  amount: number;
  expires_at: string;
  is_can_use_gpt: boolean;
} 