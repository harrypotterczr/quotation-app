import React, { useEffect, useState } from 'react';
import { QuotationInput, SchemeType } from '../types';
import { Settings, User, FileText, Activity, Box } from 'lucide-react';

interface Props {
  value: QuotationInput;
  onChange: (value: QuotationInput) => void;
}

// Internal state interface for the wizard
interface ModificationChoices {
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
    replaceTraction: false,
    tractionType: 'sync',
    oldEncoder: 'heidenhain'
  });

  const handleChange = (field: keyof QuotationInput, val: any) => {
    onChange({ ...value, [field]: val });
  };

  // Determine Scheme based on choices
  useEffect(() => {
    let newScheme: SchemeType = '方案1';

    if (choices.replaceTraction) {
      if (choices.replaceDoorMachineSet) {
        newScheme = '方案5';
      } else {
        newScheme = '方案4';
      }
    } else {
      // Retain Traction
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

    if (newScheme !== value.scheme) {
      const updates: Partial<QuotationInput> = { scheme: newScheme };
      
      // Initialize doorType for Scheme 5 if not set
      if (newScheme === '方案5' && !value.doorType) {
        updates.doorType = '中分两扇';
      }
      
      onChange({ ...value, ...updates });
    }
  }, [choices]);

  const isOldMachineScheme = ['方案1', '方案2-1', '方案2-2', '方案2-3', '方案3'].includes(value.scheme);
  const isNewMachineScheme = ['方案4', '方案5'].includes(value.scheme);

  return (
    <div className="bg-industrial-card border border-industrial-border p-6 rounded-sm shadow-lg text-industrial-text">
      <h2 className="text-xl font-bold mb-6 flex items-center text-industrial-accent border-b border-industrial-border pb-2">
        <Settings className="mr-2" /> 参数配置
      </h2>

      <div className="space-y-6">
        {/* Basic Info */}
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

        {/* --- New Scheme Wizard --- */}
        <div className="bg-industrial-bg/50 p-4 border border-industrial-border rounded-sm space-y-4">
          <h3 className="font-bold text-industrial-accent flex items-center">
            <Activity className="mr-2 h-4 w-4" /> 改造范围选择 (自动匹配方案)
          </h3>
          
          {/* Q1: Traction Machine */}
          <div>
            <label className="block text-sm font-medium text-industrial-muted mb-2">是否更换曳引机?</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={!choices.replaceTraction}
                  onChange={() => setChoices(prev => ({ ...prev, replaceTraction: false }))}
                  className="accent-industrial-accent"
                />
                <span>保留原曳引机</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={choices.replaceTraction}
                  onChange={() => setChoices(prev => ({ ...prev, replaceTraction: true }))}
                  className="accent-industrial-accent"
                />
                <span>更换新曳引机</span>
              </label>
            </div>
          </div>

          {/* Branch A: Retain Traction */}
          {!choices.replaceTraction && (
            <div className="pl-4 border-l-2 border-industrial-border space-y-4 animate-in fade-in slide-in-from-left-2">
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

          {/* Branch B: Replace Traction */}
          {choices.replaceTraction && (
            <div className="pl-4 border-l-2 border-industrial-border space-y-4 animate-in fade-in slide-in-from-left-2">
              <div>
                <label className="block text-sm font-medium text-industrial-muted mb-2">门机改造范围</label>
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={!choices.replaceDoorMachineSet}
                      onChange={() => setChoices(prev => ({ ...prev, replaceDoorMachineSet: false }))}
                      className="accent-industrial-accent"
                    />
                    <span>仅更换门机马达 (保留机械机构)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={choices.replaceDoorMachineSet}
                      onChange={() => setChoices(prev => ({ ...prev, replaceDoorMachineSet: true }))}
                      className="accent-industrial-accent"
                    />
                    <span>更换整套门机 (含机械机构)</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-2 pt-2 border-t border-industrial-border text-xs text-right text-industrial-muted">
            当前匹配方案: <span className="text-industrial-accent font-bold text-sm">{value.scheme}</span>
          </div>
        </div>

        {/* Lift Specs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-industrial-muted mb-1">载重 (kg)</label>
            <input
              type="number"
              value={value.load}
              onChange={(e) => handleChange('load', Number(e.target.value))}
              className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 px-3 focus:outline-none focus:border-industrial-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-industrial-muted mb-1">速度 (m/s)</label>
            <input
              type="number"
              step="0.1"
              value={value.speed}
              onChange={(e) => handleChange('speed', Number(e.target.value))}
              className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 px-3 focus:outline-none focus:border-industrial-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-industrial-muted mb-1">楼层数</label>
            <input
              type="number"
              value={value.floors}
              onChange={(e) => handleChange('floors', Number(e.target.value))}
              className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 px-3 focus:outline-none focus:border-industrial-accent"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-industrial-border pt-4 items-center">
          <div className="flex items-center pb-2">
            <div className="flex items-center justify-between w-full cursor-pointer whitespace-nowrap px-3" onClick={() => handleChange('hasMachineRoom', !value.hasMachineRoom)}>
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

        {/* Conditional Fields based on Scheme */}
        {isOldMachineScheme && (
          <div className="border-t border-industrial-border pt-4">
            <h3 className="text-sm font-bold text-industrial-accent mb-3 flex items-center">
              <Activity className="mr-2 h-4 w-4" /> 原曳引机信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-industrial-muted mb-1">原机功率 (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  value={value.oldMachinePower || 0}
                  onChange={(e) => handleChange('oldMachinePower', Number(e.target.value))}
                  className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 px-3 focus:outline-none focus:border-industrial-accent"
                />
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
          </div>
        )}

        {isNewMachineScheme && (
          <div className="border-t border-industrial-border pt-4">
            <h3 className="text-sm font-bold text-industrial-accent mb-3 flex items-center">
              <Box className="mr-2 h-4 w-4" /> 改造部件配置
            </h3>
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
              
              {value.scheme === '方案5' && (
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
                    <input
                      type="number"
                      value={value.doorWidth === undefined ? '' : value.doorWidth}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const v = raw === '' ? undefined : Number(raw);
                        handleChange('doorWidth', v);
                      }}
                      className="w-full bg-industrial-bg border border-industrial-border rounded-sm py-2 px-3 focus:outline-none focus:border-industrial-accent"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
