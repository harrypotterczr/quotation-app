import controlDataRaw from '../data/control.json';
import tractionDataRaw from '../data/traction.json';
import miscDataRaw from '../data/misc.json';
import { ControlItem, MiscItem, QuotationInput, QuotationItem, QuotationResult, TractionItem } from '../types';

const controlData = controlDataRaw as ControlItem[];
const tractionData = tractionDataRaw as TractionItem[];
const tractionAll: TractionItem[] = tractionData;
const miscData = miscDataRaw as MiscItem[];

const round = (num: number) => Math.round(num);

function getMiscPrice(name: string, spec?: string): number {
  const item = miscData.find(i => i.名称 === name && (!spec || i.规格 === spec));
  return item ? item.含税价格 : 0;
}

function getControlPowerFromTraction(oldMachinePower: number): number | null {
  if (!oldMachinePower || oldMachinePower <= 0) return null;

  let best: TractionItem | undefined;
  let bestDiff = Number.POSITIVE_INFINITY;

  tractionAll.forEach(t => {
    const ratedPower = (t as any)["额定功率 (kw)"];
    if (typeof ratedPower !== 'number') return;
    if (ratedPower < oldMachinePower) return;
    const diff = ratedPower - oldMachinePower;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = t;
    }
  });

  if (!best) return null;
  const controlPower = (best as any)["适配控制系统功率 (kw)"];
  return typeof controlPower === 'number' ? controlPower : null;
}

function calculateControlPrice(
  model: 'K-MC1000' | 'K-MC5000',
  power: number,
  floors: number,
  hasMachineRoom: boolean,
  isThrough: boolean
): { price: number; item: ControlItem; spec: string } | null {
  
  // Find matching control cabinets (same model)
  const candidates = controlData.filter(c => c.控制柜型号 === model);
  
  // Find first one with sufficient power
  // Assuming data is sorted or we sort it
  const sorted = candidates.sort((a, b) => a.功率 - b.功率);
  const matched = sorted.find(c => c.功率 >= power);
  
  if (!matched) return null;

  let price = matched.含税价格;
  
  // Adjustments
  // Base is usually 10 floors? The prompt said "基价为10层站费用". 
  // Let's assume standard logic: (floors - 10) * adjustment
  const floorDiff = floors - 10;
  if (floorDiff !== 0) {
      price += floorDiff * matched.加减层;
  }

  if (!hasMachineRoom) {
    price += matched.无机房;
  }
  
  if (isThrough) {
    price += matched.贯通;
  }

  return {
    price: round(price),
    item: matched,
    spec: `${model}/${matched.功率}KW`
  };
}

export function calculateQuotation(input: QuotationInput): QuotationResult {
  const items: QuotationItem[] = [];
  const warnings: string[] = [];
  let totalPrice = 0;

  let controlModel: 'K-MC1000' | 'K-MC5000' = 'K-MC1000';
  let requiredPower = 0;
  let tractionMachine: TractionItem | undefined;
  let machineFramePrice = 0;

  if (['方案1', '方案2-1', '方案2-3', '方案3'].includes(input.scheme)) {
    controlModel = 'K-MC1000';
    const basePower = input.oldMachinePower || 0;
    const matchedPower = getControlPowerFromTraction(basePower);
    requiredPower = matchedPower !== null ? matchedPower : basePower * 2;
  } else if (input.scheme === '方案2-2') {
    controlModel = 'K-MC5000';
    const basePower = input.oldMachinePower || 0;
    const matchedPower = getControlPowerFromTraction(basePower);
    requiredPower = matchedPower !== null ? matchedPower : basePower * 2;
  } else if (['方案4', '方案5'].includes(input.scheme)) {
    const ratio = input.tractionRatio || '1:1';
    const sourceData = tractionData;
    const requiredLoad = input.load || 0;
    const requiredSpeed = input.speed || 0;

    // 自动匹配: 载重、速度均 >= 输入值，且尽量接近
    let best: TractionItem | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    sourceData.forEach(t => {
      if (t.曳引比 !== ratio) return;
      const tLoad = (t as any).载重 !== undefined ? (t as any).载重 : (t as any)["载重(kg)"];
      const tSpeed = (t as any)["速度(m/s)"] as number;
      if (tLoad === undefined || tSpeed === undefined) return;
      if (tLoad < requiredLoad || tSpeed < requiredSpeed) return;

      const loadDiff = tLoad - requiredLoad;
      const speedDiff = tSpeed - requiredSpeed;
      const score = loadDiff * 1000 + speedDiff * 100;
      if (score < bestScore) {
        bestScore = score;
        best = t;
      }
    });

    // 如果没有找到“都 >= 输入值”的，就退回到原来的近似匹配逻辑
    if (!best) {
      best = sourceData.find(t => {
        const tLoad = (t as any).载重 !== undefined ? (t as any).载重 : (t as any)["载重(kg)"];
        return tLoad === requiredLoad &&
          Math.abs((t as any)["速度(m/s)"] - requiredSpeed) < 0.01 &&
          t.曳引比 === ratio;
      });
    }

    tractionMachine = best;

    if (tractionMachine) {
      controlModel = 'K-MC1000';
      requiredPower = tractionMachine["适配控制系统功率 (kw)"] || tractionMachine["额定功率 (kw)"] || 0;
      
      const machinePrice = tractionMachine.曳引机含税价格 || 0;

      // Add Machine Item
      items.push({
        name: '曳引机',
        spec: tractionMachine.曳引机型号,
        quantity: 1,
        unitPrice: round(machinePrice),
        totalPrice: round(machinePrice),
        remark: (machinePrice === 0 ? '未在数据库中找到价格; ' : '') + `曳引比 ${ratio}`
      });

      // Add Frame Item
      // The logic says "机架（含导向轮）"
      // Check if machine room has specific logic. Logic doc says "当 机房=有机房...". 
      // Assuming inorganic room logic is manual or different, but let's apply standard for now.
      machineFramePrice = tractionMachine["机架含税价格"] || 0;
       items.push({
        name: '机架（含导向轮）',
        spec: '配套',
        quantity: 1,
        unitPrice: round(machineFramePrice),
        totalPrice: round(machineFramePrice),
        remark: '现场保留承重梁' + (machineFramePrice === 0 ? ' (未在数据库中找到价格)' : '')
      });

    } else {
      warnings.push(`未找到匹配的曳引机 (载重:${input.load}, 速度:${input.speed}, 曳引比:${ratio})`);
    }
  }

  // 2. Calculate Control System Price
  const controlRes = calculateControlPrice(
    controlModel, 
    requiredPower, 
    input.floors, 
    input.hasMachineRoom, 
    input.isThrough
  );

  if (controlRes) {
    items.push({
      name: '控制系统全套',
      spec: controlRes.spec,
      quantity: 1,
      unitPrice: controlRes.price,
      totalPrice: controlRes.price
    });
  } else {
    warnings.push(`未找到匹配的控制系统 (${controlModel}, 功率>=${requiredPower}KW)`);
  }

  // 3. Add Common Components & Specifics
  
  // Door Motor (All schemes except Scheme 5 might vary, but logic doc says:)
  // Scheme 1, 2-1, 2-2, 2-3, 3, 4: "门机马达及控制器"
  // Scheme 5: "门机整组"
  
  if (input.scheme === '方案5') {
    let doorPrice = 5000;
    let doorSpec = '其他';
    if (input.doorType === '中分两扇' && (input.doorWidth || 0) <= 1200) {
      doorPrice = 3000;
      doorSpec = '中分两扇且开门宽度<=1200';
    }
    items.push({
      name: '轿门机（不含门板和地坎）', // As per Scheme 5 template
      spec: doorSpec,
      quantity: 1,
      unitPrice: round(doorPrice),
      totalPrice: round(doorPrice)
    });
  } else {
    // Standard Door Motor
    const doorMotorPrice = getMiscPrice('门机马达及控制器') || 2000;
    items.push({
      name: '门机马达及控制器',
      spec: '含变频器',
      quantity: 1,
      unitPrice: round(doorMotorPrice),
      totalPrice: round(doorMotorPrice)
    });
  }

  // Encoders
  if (input.scheme === '方案2-3') {
     const encoderPrice = getMiscPrice('EN1387编码器（含安装支架）') || 1000;
     items.push({
       name: '编码器（含安装支架）',
       spec: 'EN1387',
       quantity: 1,
       unitPrice: round(encoderPrice),
       totalPrice: round(encoderPrice)
     });
  } else if (input.scheme === '方案3') {
     // Logic: "需根据轴径匹配编码器"
     // We'll add it as a placeholder or standard if needed.
     // Doc says "编码器... (视情况)". 
     // Template has "编码器（含安装支架）".
     const encoderPrice = getMiscPrice('EN1387编码器（含安装支架）') || 1000;
      items.push({
       name: '编码器（含安装支架）',
       spec: input.oldMachineShaftDiameter ? `轴径:${input.oldMachineShaftDiameter}` : '',
       quantity: 1,
       unitPrice: round(encoderPrice),
       totalPrice: round(encoderPrice),
       remark: '根据轴径定制'
     });
  }

  // Field Measure
  if (input.engineerMeasure) {
    const measurePrice = getMiscPrice('现场检测费用') || 500;
    items.push({
      name: '现场测量',
      spec: '',
      quantity: 1,
      unitPrice: round(measurePrice),
      totalPrice: round(measurePrice)
    });
  }

  // Packaging & Freight (Manual Input)
  const pkgPrice = input.packagingPrice || 0;
  items.push({
    name: '包装',
    spec: '木箱',
    quantity: 1,
    unitPrice: round(pkgPrice),
    totalPrice: round(pkgPrice),
    remark: ''
  });
  
  const transPrice = input.transportPrice || 0;
  items.push({
    name: '运费',
    spec: '',
    quantity: 1,
    unitPrice: round(transPrice),
    totalPrice: round(transPrice),
    remark: ''
  });

  // Apply Modifications
  if (input.modifications) {
    items.forEach(item => {
      const mod = input.modifications?.[item.name];
      if (mod) {
        if (mod.unitPrice !== undefined) {
          item.unitPrice = mod.unitPrice;
        }
        if (mod.quantity !== undefined) {
          item.quantity = mod.quantity;
        }
        item.totalPrice = round(item.unitPrice * item.quantity);
      }
    });
  }

  // Add Custom Items
  if (input.customItems) {
    items.push(...input.customItems.map(item => ({
      ...item,
      totalPrice: round(item.unitPrice * item.quantity)
    })));
  }

  // Calculate Total
  totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    totalPrice: round(totalPrice),
    items,
    warnings
  };
}
