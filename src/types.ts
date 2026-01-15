export interface ControlItem {
  序号: number;
  控制柜型号: string;
  功率: number;
  含税价格: number;
  加减层: number;
  无机房: number;
  贯通: number;
}

export interface TractionItem {
  曳引机型号: string;
  载重?: number;
  "载重(kg)"?: number; // For 2:1 data
  "速度(m/s)": number;
  曳引比: string; // "1:1" or "2:1"
  曳引机含税价格?: number;
  "机架含税价格"?: number;
  "适配控制系统功率 (kw)"?: number;
  "额定功率 (kw)"?: number; // Fallback for power
  // Add other fields if necessary
}

export interface MiscItem {
  名称: string;
  规格?: string;
  含税价格: number;
}

export type SchemeType = '方案1' | '方案2-1' | '方案2-2' | '方案2-3' | '方案3' | '方案4' | '方案5';

export interface QuotationInput {
  projectName: string;
  customerName: string;
  scheme: SchemeType;
  
  // Common
  load: number; // 载重
  speed: number; // 梯速
  floors: number; // 楼层数
  isThrough: boolean; // 贯通
  hasMachineRoom: boolean; // 有机房/无机房 (true=有机房)
  
  // Old Machine Info (for Schemes 1-3)
  oldMachinePower?: number; // 原曳引机功率
  oldMachineCurrent?: number; // 原曳引机电流
  oldMachineType?: '同步' | '异步';
  oldEncoderType?: '海德汉EN1387' | '其他';
  oldMachineShaftDiameter?: string; // 原曳引机轴径 (Scheme 3)
  
  // New Machine Info (Scheme 4-5)
  tractionRatio?: '1:1' | '2:1';
  
  // Door Info (Scheme 5)
  doorType?: '中分两扇' | '旁开两扇' | '中分四扇';
  doorWidth?: number;
  
  // Misc
  engineerMeasure: boolean; // 工程师现场测量
  packagingPrice?: number; // 包装费 (手动)
  transportPrice?: number; // 运费 (手动)
  
  // Customizations
  customItems?: QuotationItem[];
  modifications?: Record<string, { unitPrice?: number; quantity?: number }>;
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
  totalPrice: number;
  items: QuotationItem[];
  warnings: string[];
}
