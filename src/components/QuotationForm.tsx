import React, { useEffect, useState } from 'react';
import { QuotationInput, SchemeType } from '../types';
import { Settings, User, FileText, Activity, Box } from 'lucide-react';
import tractionData from '../data/traction.json';

interface Props {
  value: QuotationInput;
  onChange: (value: QuotationInput) => void;
}

// Helper Component for Numeric Input to handle leading zeros and decimals correctly
const NumericInput = ({ 
  value, 
  onChange, 
  className, 
  ...props 
}: { 
  value: number | undefined; 
  onChange: (val: number | undefined) => void; 
  className?: string;
  [key: string]: any;
}) => {
  const [strVal, setStrVal] = useState(value?.toString() ?? '');

  useEffect(() => {
    // Sync local state with prop value if they differ significantly
    // This handles external updates (e.g. resets)
    // We compare parsed number to avoid overwriting "1.0" with "1" while typing
    const parsed = strVal === '' ? undefined : Number(strVal);
    if (parsed !== value) {
        setStrVal(value?.toString() ?? '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setStrVal(v);
    if (v === '') {
      onChange(undefined);
    } else {
      const n = Number(v);
      if (!isNaN(n)) {
        onChange(n);
      }
    }
  };

  return <input type="number" value={strVal} onChange={handleChange} className={className} {...props} />;
};

// Internal state interface for the wizard
interface ModificationChoices {
  selectedOption?: 'option1' | 'option2' | 'option3'; // Explicit selection state
  replaceTraction: boolean;
  
  // If Replace Traction
  replaceDoorMachineSet?: boolean; // true = set (Scheme 5), false = motor only (Scheme 4)
  
  // If Retain Traction
  tractionType?: 'async' | 'sync';
  oldEncoder?: 'heidenhain' | 'other';
  otherEncoderSolution?: 'kmc1000' | 'kmc5000' | 'replace_encoder';
}

export const QuotationForm: React.FC<Props> = ({ value, onChange }) => {
  const [choices, setChoices] = useState<ModificationChoices>({
    selectedOption: undefined, // Start with no selection
    replaceTraction: false,
    tractionType: 'sync',
    oldEncoder: 'heidenhain'
  });

  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);

  // Extract unique speeds from traction data
  const uniqueSpeeds = Array.from(new Set(tractionData.map(item => item["速度(m/s)"]))).sort((a, b) => a - b);

  const handleChange = (field: keyof QuotationInput, val: any) => {
    // Handle NumericInput returning undefined for required fields
    if (val === undefined && ['load', 'floors', 'doorWidth'].includes(field)) {
       val = 0;
    }

    if (field === 'load') {
      const numVal = Number(val);
      if (numVal < 550 || numVal > 2000) {
        setLoadError('载重必须在 550~2000 kg 之间');
      } else {
        setLoadError(null);
      }
    }

    if (field === 'oldMachineCurrent') {
      const numVal = Number(val);
      if (numVal > 110) {
        setCurrentError('没有匹配的控制系统');
      } else {
        setCurrentError(null);
      }
    }

    onChange({ ...value, [field]: val });
  };

  // Set default values for tractionRatio and doorWidth
  useEffect(() => {
    const updates: Partial<QuotationInput> = {};
    let shouldUpdate = false;
    
    if (!value.tractionRatio) {
      updates.tractionRatio = '2:1';
      shouldUpdate = true;
    }
    if (!value.doorWidth) {
      updates.doorWidth = 900;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      onChange({ ...value, ...updates });
    }
  }, []); // Run once on mount

  // Determine Scheme based on choices
  useEffect(() => {
    let newScheme: SchemeType = '方案1';

    if (!choices.selectedOption) {
        // If no option selected yet, maybe keep current or default?
        // But we want "unselected" state visually. 
        // For logic, we need a valid scheme. Default to Scheme 1 but maybe UI hides details?
        // Let's assume Scheme 1 is default logic-wise but UI shows nothing expanded if possible.
        // Or actually, if we want "none selected", we might need to handle that in UI.
        // For now, let's just let it default to Scheme 1 logic but UI shows unselected.
    }

    if (choices.selectedOption === 'option2') { // Option 2
       newScheme = '方案4';
    } else if (choices.selectedOption === 'option3') { // Option 3
       newScheme = '方案5';
    } else {
      // Option 1 or undefined (default)
      // Retain Traction - Option 1 base
      // Default to Scheme 1, refine based on sub-choices
      if (choices.tractionType === 'async') {
        newScheme = '方案3';
      } else {
        // Sync
        if (choices.oldEncoder === 'heidenhain') {
          newScheme = '方案1';
        } else {
          // Other Encoder
          switch (choices.otherEncoderSolution) {
            case 'kmc1000': newScheme = '方案2-1'; break;
            case 'kmc5000': newScheme = '方案2-2'; break;
            case 'replace_encoder': newScheme = '方案2-3'; break;
            default: newScheme = '方案2-1'; // Default fallback
          }
        }
      }
    }

    // Logic 3: Inverse Machine Room binding - Inorganic Room disables Option 2 and 3
    if (!value.hasMachineRoom && (choices.selectedOption === 'option2' || choices.selectedOption === 'option3')) {
       // If inorganic, force Option 1
       setChoices(prev => ({ ...prev, selectedOption: 'option1', replaceTraction: false }));
       return; // Re-run effect
    }

    if (newScheme !== value.scheme) {
      const updates: Partial<QuotationInput> = { scheme: newScheme };
      
      // Initialize doorType for Scheme 5 if not set
      if (newScheme === '方案5' && !value.doorType) {
        updates.doorType = '中分两扇';
      }
      
      onChange({ ...value, ...updates });
    } else {
      // Ensure Organic Room is enforced even if scheme doesn't change
       if (['方案4', '方案5'].includes(newScheme) && !value.hasMachineRoom) {
        onChange({ ...value, hasMachineRoom: true });
      }
    }
  }, [choices, value.hasMachineRoom]);

  const isOldMachineScheme = ['方案1', '方案2-1', '方案2-2', '方案2-3', '方案3'].includes(value.scheme);
  const isOption1 = isOldMachineScheme;
  const isOption2 = value.scheme === '方案4';
  const isOption3 = value.scheme === '方案5';

  return (
    <div className="bg-industrial-card border border-industrial-border p-6 rounded-sm shadow-lg text-industrial-text">
      <h2 className="text-xl font-bold mb-6 flex items-center text-industrial-accent border-b border-industrial-border pb-2">
        <Settings className="mr-2" /> 参数配置
      </h2>

      <div className="space-y-6">
        {/* Basic Info & Lift Specs Moved Here */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-industrial-muted mb-1">项目名称</label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-industrial-muted" />
                <input
                  type="text"
                  value={value.projectName}
                  onChange={(e) => handleChange('projectName', e.target.value)}
                  className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 pl-10 pr-3 focus:outline-none focus:border-industrial-accent focus:ring-1 focus:ring-industrial-accent"
                  placeholder="输入项目名称"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-industrial-muted mb-1">客户名称</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-industrial-muted" />
                <input
                  type="text"
                  value={value.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 pl-10 pr-3 focus:outline-none focus:border-industrial-accent focus:ring-1 focus:ring-industrial-accent"
                  placeholder="输入客户名称"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-industrial-muted mb-1">载重 (kg)</label>
              <NumericInput
                min={550}
                max={2000}
                value={value.load}
                onChange={(val) => handleChange('load', val)}
                className={`w-full bg-industrial-bg border rounded-sm py-2 px-3 focus:outline-none ${loadError ? 'border-red-500 focus:border-red-500' : 'border-industrial-border focus:border-industrial-accent'}`}
              />
              {loadError && <p className="text-red-500 text-xs mt-1">{loadError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-industrial-muted mb-1">速度 (m/s)</label>
              <select
                value={value.speed}
                onChange={(e) => handleChange('speed', Number(e.target.value))}
                className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 px-3 focus:outline-none focus:border-industrial-accent"
              >
                {uniqueSpeeds.map(speed => (
                  <option key={speed} value={speed}>{Number(speed).toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-industrial-muted mb-1">楼层数</label>
              <NumericInput
                value={value.floors}
                onChange={(val) => handleChange('floors', val)}
                className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 px-3 focus:outline-none focus:border-industrial-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-industrial-border pt-4 items-center">
            <div className="flex items-center pb-2">
              <div 
                className="flex items-center justify-between w-full cursor-pointer whitespace-nowrap px-3" 
                onClick={() => handleChange('hasMachineRoom', !value.hasMachineRoom)}
              >
                <span className={`text-sm transition-colors ${value.hasMachineRoom ? 'text-industrial-accent font-bold' : 'text-industrial-muted'}`}>有机房</span>
                <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${!value.hasMachineRoom ? 'bg-industrial-accent' : 'bg-industrial-border'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!value.hasMachineRoom ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className={`text-sm transition-colors ${!value.hasMachineRoom ? 'text-industrial-accent font-bold' : 'text-industrial-muted'}`}>无机房</span>
              </div>
            </div>

            <div className="flex items-center pb-2">
              <div className="flex items-center justify-between w-full cursor-pointer whitespace-nowrap px-3" onClick={() => handleChange('isThrough', !value.isThrough)}>
                <span className={`text-sm transition-colors ${!value.isThrough ? 'text-industrial-accent font-bold' : 'text-industrial-muted'}`}>单开门</span>
                <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${value.isThrough ? 'bg-industrial-accent' : 'bg-industrial-border'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value.isThrough ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className={`text-sm transition-colors ${value.isThrough ? 'text-industrial-accent font-bold' : 'text-industrial-muted'}`}>贯通门</span>
              </div>
            </div>

            <div className="flex items-center pb-2">
              <div
                className="flex items-center justify-between w-full cursor-pointer whitespace-nowrap px-3"
                onClick={() => handleChange('engineerMeasure', !value.engineerMeasure)}
              >
                <span className="text-sm text-industrial-muted">工程师现场测量</span>
                <span
                  className={`ml-2 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    value.engineerMeasure
                      ? 'bg-industrial-accent text-black border-industrial-accent'
                      : 'bg-transparent text-industrial-muted border-industrial-border'
                  }`}
                >
                  {value.engineerMeasure ? '是' : '否'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Renovation Scheme Selection --- */}
        <div className="bg-industrial-bg/50 p-4 border border-industrial-border rounded-sm space-y-4">
          <h3 className="font-bold text-industrial-accent flex items-center">
            <Activity className="mr-2 h-4 w-4" /> 改造方案
          </h3>
          
          <div className="space-y-3">
            {/* Option 1 */}
            <label className={`flex items-start space-x-3 p-3 rounded-sm border cursor-pointer transition-all ${choices.selectedOption === 'option1' ? 'border-industrial-accent bg-industrial-accent/10' : 'border-industrial-border hover:border-industrial-accent/50'}`}>
              <input 
                type="radio" 
                name="scheme_option"
                checked={choices.selectedOption === 'option1'}
                onChange={() => setChoices(prev => ({ ...prev, selectedOption: 'option1', replaceTraction: false }))}
                className="mt-1 accent-industrial-accent"
              />
              <div>
                <span className="font-bold block">保留原曳引机</span>
                <span className="text-xs text-industrial-muted">全套控制系统 + 门机马达及控制器</span>
              </div>
            </label>

            {/* Sub-options for Option 1 */}
            {choices.selectedOption === 'option1' && (
              <div className="ml-8 pl-4 border-l-2 border-industrial-border space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-sm font-medium text-industrial-muted mb-2">主机类型</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={choices.tractionType === 'sync'}
                        onChange={() => setChoices(prev => ({ ...prev, tractionType: 'sync' }))}
                        className="accent-industrial-accent"
                      />
                      <span>同步主机 (无齿轮)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={choices.tractionType === 'async'}
                        onChange={() => setChoices(prev => ({ ...prev, tractionType: 'async' }))}
                        className="accent-industrial-accent"
                      />
                      <span>异步主机 (有齿轮)</span>
                    </label>
                  </div>
                </div>

                {choices.tractionType === 'sync' && (
                  <div>
                    <label className="block text-sm font-medium text-industrial-muted mb-2">原编码器型号</label>
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={choices.oldEncoder === 'heidenhain'}
                          onChange={() => setChoices(prev => ({ ...prev, oldEncoder: 'heidenhain' }))}
                          className="accent-industrial-accent"
                        />
                        <span>海德汉 EN1387 (标准)</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={choices.oldEncoder === 'other'}
                          onChange={() => setChoices(prev => ({ ...prev, oldEncoder: 'other' }))}
                          className="accent-industrial-accent"
                        />
                        <span>其他型号</span>
                      </label>
                    </div>
                  </div>
                )}

                {choices.tractionType === 'sync' && choices.oldEncoder === 'other' && (
                  <div className="bg-industrial-card p-3 rounded-sm border border-yellow-700/50">
                    <label className="block text-sm font-medium text-yellow-500 mb-2">解决方案选择（需技术确认）</label>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={choices.otherEncoderSolution === 'kmc1000'}
                          onChange={() => setChoices(prev => ({ ...prev, otherEncoderSolution: 'kmc1000' }))}
                          className="accent-industrial-accent"
                        />
                        <span>使用 K-MC1000</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={choices.otherEncoderSolution === 'kmc5000'}
                          onChange={() => setChoices(prev => ({ ...prev, otherEncoderSolution: 'kmc5000' }))}
                          className="accent-industrial-accent"
                        />
                        <span>使用 K-MC5000</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={choices.otherEncoderSolution === 'replace_encoder'}
                          onChange={() => setChoices(prev => ({ ...prev, otherEncoderSolution: 'replace_encoder' }))}
                          className="accent-industrial-accent"
                        />
                        <span>更换为海德汉 EN1387 编码器</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Option 2 */}
            <label className={`flex items-start space-x-3 p-3 rounded-sm border cursor-pointer transition-all ${choices.selectedOption === 'option2' ? 'border-industrial-accent bg-industrial-accent/10' : 'border-industrial-border hover:border-industrial-accent/50'} ${!value.hasMachineRoom ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input 
                type="radio" 
                name="scheme_option"
                checked={choices.selectedOption === 'option2'}
                onChange={() => value.hasMachineRoom && setChoices(prev => ({ ...prev, selectedOption: 'option2', replaceTraction: true, replaceDoorMachineSet: false }))}
                disabled={!value.hasMachineRoom}
                className="mt-1 accent-industrial-accent"
              />
              <div>
                <span className="font-bold block">更换主机 (保留门机)</span>
                <span className="text-xs text-industrial-muted">全套控制系统 + 门机马达及控制器 + 主机 + 机架</span>
                {!value.hasMachineRoom && <span className="block text-xs text-red-500 mt-1">无机房不可选</span>}
              </div>
            </label>

            {/* Option 3 */}
            <label className={`flex items-start space-x-3 p-3 rounded-sm border cursor-pointer transition-all ${choices.selectedOption === 'option3' ? 'border-industrial-accent bg-industrial-accent/10' : 'border-industrial-border hover:border-industrial-accent/50'} ${!value.hasMachineRoom ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input 
                type="radio" 
                name="scheme_option"
                checked={choices.selectedOption === 'option3'}
                onChange={() => value.hasMachineRoom && setChoices(prev => ({ ...prev, selectedOption: 'option3', replaceTraction: true, replaceDoorMachineSet: true }))}
                disabled={!value.hasMachineRoom}
                className="mt-1 accent-industrial-accent"
              />
              <div>
                <span className="font-bold block">更换主机 + 更换门机</span>
                <span className="text-xs text-industrial-muted">全套控制系统 + 门机整组 + 主机 + 机架</span>
                {!value.hasMachineRoom && <span className="block text-xs text-red-500 mt-1">无机房不可选</span>}
              </div>
            </label>
          </div>
          
          <div className="mt-2 pt-2 border-t border-industrial-border text-xs text-right text-industrial-muted">
            当前匹配方案: <span className="text-industrial-accent font-bold text-sm">{value.scheme}</span>
          </div>
        </div>

        {/* Other Parameters (Renamed from Old Machine Info / Renovation Config) */}
        <div className="border-t border-industrial-border pt-4">
          <h3 className="text-sm font-bold text-industrial-accent mb-3 flex items-center">
            <Box className="mr-2 h-4 w-4" /> 其它参数
          </h3>
          
          {isOption1 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-industrial-muted mb-1">原曳引机额定电流 (A)</label>
                <NumericInput
                  step="0.1"
                  value={value.oldMachineCurrent}
                  onChange={(val) => handleChange('oldMachineCurrent', val)}
                  className={`w-full bg-industrial-bg border rounded-sm py-2 px-3 focus:outline-none ${currentError ? 'border-red-500 focus:border-red-500' : 'border-industrial-border focus:border-industrial-accent'}`}
                />
                {currentError && <p className="text-red-500 text-xs mt-1">{currentError}</p>}
              </div>
              {value.scheme === '方案3' && (
                 <div>
                  <label className="block text-sm font-medium text-industrial-muted mb-1">原机轴径 (mm)</label>
                  <input
                    type="text"
                    value={value.oldMachineShaftDiameter || ''}
                    onChange={(e) => handleChange('oldMachineShaftDiameter', e.target.value)}
                    className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 px-3 focus:outline-none focus:border-industrial-accent"
                    placeholder="如: 80"
                  />
                </div>
              )}
            </div>
          )}

          {(isOption2 || isOption3) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-industrial-muted mb-1">曳引比</label>
                <select
                  value={value.tractionRatio}
                  onChange={(e) => handleChange('tractionRatio', e.target.value)}
                  className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 px-3 focus:outline-none focus:border-industrial-accent"
                >
                  <option value="1:1">1:1</option>
                  <option value="2:1">2:1</option>
                </select>
              </div>
              
              {isOption3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-industrial-muted mb-1">开门方式</label>
                    <select
                      value={value.doorType}
                      onChange={(e) => handleChange('doorType', e.target.value)}
                      className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 px-3 focus:outline-none focus:border-industrial-accent"
                    >
                      <option value="中分两扇">中分两扇</option>
                      <option value="旁开两扇">旁开两扇</option>
                      <option value="中分四扇">中分四扇</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-industrial-muted mb-1">开门宽度 (mm)</label>
                    <NumericInput
                      value={value.doorWidth}
                      onChange={(val) => handleChange('doorWidth', val)}
                      className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 px-3 focus:outline-none focus:border-industrial-accent"
                    />
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};