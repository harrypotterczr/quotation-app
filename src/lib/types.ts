export interface ControlItem {
  "序号": number;
  "控制柜型号": string;
  "功率": number;
  "含税价格": number;
  "加减层": number;
  "无机房": number;
  "贯通": number;
}

export interface TractionItem {
  "曳引机型号": string;
  "载重": number;
  "速度(m/s)": number;
  "曳引比": string;
  "含税价格": number | string; // Might be a string if data has issues, but likely number
  "机架含税价格": number;
  "适配控制系统功率 (kw)": number;
  // Add other fields if needed
}

export interface MiscItem {
  "名称": string;
  "规格": string | null;
  "含税价格": number;
}

export interface QuotationInput {
  projectName: string;
  customer: string;
  scheme: 'Scheme1' | 'Scheme2-1' | 'Scheme2-2' | 'Scheme2-3' | 'Scheme3' | 'Scheme4' | 'Scheme5';
  load: number;
  speed: number;
  tractionRatio: '1:1' | '2:1';
  floors: number;
  isThrough: boolean; // 贯通
  machineRoom: 'Organic' | 'Inorganic'; // 有机房/无机房
  originalTractionPower: number;
  originalTractionCurrent?: number;
  originalTractionType?: 'Sync' | 'Async';
  encoderType?: 'Heidenhain' | 'Other';
  engineerCheck?: boolean;
  originalAxisDiameter?: string; // For Scheme 3
  doorOpeningType?: 'Center2' | 'Side2' | 'Center4'; // For Scheme 5
  doorOpeningWidth?: number; // For Scheme 5
}

export interface QuotationItem {
  name: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  remark?: string;
}

export interface QuotationResult {
  items: QuotationItem[];
  totalPrice: number;
}
