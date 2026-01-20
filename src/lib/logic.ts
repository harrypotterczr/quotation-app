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

function getControlPowerFromCurrent(oldMachineCurrent: number): { power: number; model: string } | null {
  if (!oldMachineCurrent || oldMachineCurrent <= 0) return null;

  // Find suitable control item based on current
  // Filter for K-MC1000 or K-MC5000 is needed?
  // The requirement says "match control system 'Adapted Traction Current' >= oldMachineCurrent and closest"
  // It implies we should look at control.json data.
  
  // Let's look across all control data (both 1000 and 5000 models?)
  // Usually Scheme 1 prefers K-MC1000 unless specified otherwise by logic, 
  // but if we just match by current, we should pick the best fit.
  // However, existing logic forces model based on sub-scheme (e.g. 2-2 uses 5000).
  // Let's assume we search within the assigned model later, or search globally and return the model too?
  // Requirement 5 says: "Option 1 control system match logic change: based on old rated current..."
  // Option 1 includes Scheme 1, 2-1, 2-3, 3. (Scheme 2-2 is Option 1 but specific model).
  // Let's genericize: find best fit in controlData.
  
  let best: ControlItem | undefined;
  let bestDiff = Number.POSITIVE_INFINITY;

  controlData.forEach(c => {
    // Only consider K-MC1000 for standard Option 1 cases unless 2-2 overrides later?
    // Actually, K-MC1000 and 5000 have similar current specs usually?
    // Let's prioritize K-MC1000 if both fit, or just find best fit regardless of model first?
    // To be safe and follow "Option 1" context (which defaults to K-MC1000 in code), let's prefer K-MC1000.
    
    // But wait, Scheme 2-2 explicitly needs K-MC5000.
    // Let's make this function take a preferred model or filter? 
    // Or just return the specs.
    
    const adaptedCurrent = (c as any)["适配曳引机电流"]; // Need to ensure this field exists in types
    if (typeof adaptedCurrent !== 'number') return;
    
    if (adaptedCurrent < oldMachineCurrent) return;
    
    const diff = adaptedCurrent - oldMachineCurrent;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    } else if (diff === bestDiff) {
      // Tie-breaker: prefer K-MC1000 over 5000 if diff is same, or lower price?
      if (best?.控制柜型号 !== 'K-MC1000' && c.控制柜型号 === 'K-MC1000') {
        best = c;
      }
    }
  });

  if (!best) return null;
  return { power: best.功率, model: best.控制柜型号 };
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
    // Option 1 logic (mostly)
    controlModel = 'K-MC1000';
    
    // New Logic: Match based on Old Current
    const oldCurrent = input.oldMachineCurrent || 0;
    const match = getControlPowerFromCurrent(oldCurrent);
    
    if (match) {
      requiredPower = match.power;
      // Note: We might want to force the model found by match if strictly following "match spec",
      // but scheme definition often dictates model (e.g. 2-2).
      // For Scheme 1, 2-1, 2-3, 3 -> K-MC1000 is standard.
      // Check if match.model is different? 
      // K-MC5000 is usually expensive, so if K-MC1000 fits, use it.
    } else {
      // Fallback if no current provided or no match: Use Old Power * 2 logic?
      // Or just default to min power?
      // Let's keep old power logic as backup if current is missing?
      // The prompt specifically said "Option 1... based on old rated current".
      // If current is 0/missing, maybe fallback to old power logic for safety?
      const basePower = input.oldMachinePower || 0;
      if (basePower > 0) {
         const matchedPower = getControlPowerFromTraction(basePower);
         requiredPower = matchedPower !== null ? matchedPower : basePower * 2;
      }
    }

  } else if (input.scheme === '方案2-2') {
    controlModel = 'K-MC5000';
    // Scheme 2-2 is also "Option 1" in UI but with specific choice.
    // Should it also use Current matching? Yes, likely.
    
    const oldCurrent = input.oldMachineCurrent || 0;
    // We need to find match within K-MC5000 specifically?
    // getControlPowerFromCurrent searches all.
    // Let's refine getControlPowerFromCurrent to accept model filter or handle it here.
    
    // Let's do specific lookup for K-MC5000 based on current
    let best5000: ControlItem | undefined;
    let bestDiff = Number.POSITIVE_INFINITY;
    
    controlData.filter(c => c.控制柜型号 === 'K-MC5000').forEach(c => {
       const adapted = (c as any)["适配曳引机电流"];
       if (typeof adapted !== 'number' || adapted < oldCurrent) return;
       const diff = adapted - oldCurrent;
       if (diff < bestDiff) {
         bestDiff = diff;
         best5000 = c;
       }
    });
    
    if (best5000) {
      requiredPower = best5000.功率;
    } else {
       // Fallback
       const basePower = input.oldMachinePower || 0;
       const matchedPower = getControlPowerFromTraction(basePower);
       requiredPower = matchedPower !== null ? matchedPower : basePower * 2;
    }

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

  // Packaging Logic based on misc.json
  // Rules:
  // Control Cabinet box (always): "包装(木箱)" spec "控制柜"
  // Frame box (if replace traction): "包装(木箱)" spec "机架"
  // Door machine box? Not specified in json, maybe included or separate?
  // Current misc.json has: 
  // "包装(木箱)" spec "机架" = 500
  // "包装(木箱)" spec "控制柜" = 500
  
  // Logic: 
  // Always have 1 control cabinet box.
  // If replacing traction (Option 2 or 3 / Scheme 4 or 5), add 1 frame box.
  // Note: input.packagingPrice is MANUAL override. We should calculate default if not overridden?
  // Or just display calculated item.
  // The current code uses `input.packagingPrice` as a single manual item.
  // We should split it into calculated items OR use manual.
  // Let's implement auto-calculation.
  
  let autoPkgPrice = 0;
  const pkgItems: {name: string, spec: string, price: number}[] = [];
  
  // 1. Control Cabinet Box
  const controlBoxPrice = getMiscPrice('包装(木箱)', '控制柜') || 500;
  pkgItems.push({ name: '包装', spec: '控制柜木箱', price: controlBoxPrice });
  autoPkgPrice += controlBoxPrice;
  
  // 2. Machine/Frame Box (only for Scheme 4 & 5)
  if (['方案4', '方案5'].includes(input.scheme)) {
     const frameBoxPrice = getMiscPrice('包装(木箱)', '机架') || 500;
     pkgItems.push({ name: '包装', spec: '主机/机架木箱', price: frameBoxPrice });
     autoPkgPrice += frameBoxPrice;
  }
  
  // If user provided manual packaging price (override), use it as a single lump sum?
  // Or just ignore manual input field for now and use auto?
  // The UI has "Packaging Price" input. If we want auto, we should probably remove that input or use it as "Additional Packaging".
  // Let's assume the requirement "增加包装费判定" means auto-calculate.
  // We will Replace the old manual logic with this auto logic.
  // If we still want to support manual override, we can check if input.packagingPrice is set (non-zero?)
  // But usually "judgment logic" implies system calculation.
  
  // Let's add the items.
  pkgItems.forEach(p => {
    items.push({
      name: p.name,
      spec: p.spec,
      quantity: 1,
      unitPrice: round(p.price),
      totalPrice: round(p.price)
    });
  });

  // Freight (Manual Input)
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
