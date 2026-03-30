export interface Vertical {
  id: string;
  name: string;
  description: string;
  features: string[];
  isActive: boolean;
}

export interface UserVertical {
  userId: string;
  verticalId: string;
  selectedAt: Date;
}

export interface SelectVerticalRequest {
  verticalId: string;
}

