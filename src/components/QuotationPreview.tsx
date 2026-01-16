import React, { useRef, useState, useEffect } from 'react';
import { QuotationResult, QuotationInput, QuotationItem } from '../types';
import { Download, AlertTriangle, Plus, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type DetailKey = 'controlSystem' | 'tractionSystem' | 'doorOperator';

const BASE = import.meta.env.BASE_URL || '/';

const DETAIL_CONFIG: Record<DetailKey, {
  title: string;
  mainImage: string;
  listImage: string;
  names: string[];
}> = {
  controlSystem: {
    title: '控制系统全套明细',
    mainImage: `${BASE}Control System.jpg`,
    listImage: `${BASE}Control System List.jpg`,
    names: ['控制系统全套']
  },
  tractionSystem: {
    title: '曳引系统明细',
    mainImage: `${BASE}Traction System.jpg`,
    listImage: `${BASE}Traction System List.jpg`,
    names: ['曳引机', '机架（含导向轮）']
  },
  doorOperator: {
    title: '门机马达及控制器明细',
    mainImage: `${BASE}DoorOperatorMotor.jpeg`,
    listImage: `${BASE}DoorOperatorMotor List.jpg`,
    names: ['门机马达及控制器']
  }
};

const findDetailKeyByName = (name: string): DetailKey | null => {
  const keys = Object.keys(DETAIL_CONFIG) as DetailKey[];
  for (const key of keys) {
    if (DETAIL_CONFIG[key].names.includes(name)) {
      return key;
    }
  }
  return null;
};

const renderDetailTable = (key: DetailKey) => {
  if (key === 'controlSystem') {
    return (
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 w-10">序号</th>
            <th className="border border-gray-300 px-2 py-1 w-32">名称</th>
            <th className="border border-gray-300 px-2 py-1">描述</th>
            <th className="border border-gray-300 px-2 py-1 w-10">数量</th>
            <th className="border border-gray-300 px-2 py-1 w-12">单位</th>
            <th className="border border-gray-300 px-2 py-1 w-24">备注</th>
          </tr>
        </thead>
        <tbody>
          {[{
            no: 1, name: '控制柜', desc: '', qty: 1, unit: '套', remark: ''
          }, {
            no: 2, name: '配电箱', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 3, name: '轿顶检修盒', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 4, name: '底坑检修盒', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 5, name: '急停开关', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 6, name: '主机侧隔离开关', desc: '', qty: 1, unit: '', remark: '无机房配置'
          }, {
            no: 7, name: '第二急停开关盒', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 8, name: '全套电缆', desc: '', qty: 1, unit: '', remark: '不含网线'
          }, {
            no: 9, name: '操纵箱', desc: '', qty: 1, unit: '', remark: '点阵显示'
          }, {
            no: 10, name: '外呼盒（挂壁式）', desc: '', qty: 1, unit: '层站', remark: '点阵显示'
          }, {
            no: 11, name: '语音报站', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 12, name: '消防开关', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 13, name: '五方对讲', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 14, name: '称重装置', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 15, name: '光电开关', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 16, name: '井道限位开关', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 17, name: '电光报警器', desc: '', qty: 1, unit: '个', remark: ''
          }, {
            no: 18, name: '井道照明灯组件', desc: '', qty: 1, unit: '套', remark: '每6米配置'
          }, {
            no: 19, name: '编码器线', desc: '', qty: 1, unit: '根', remark: ''
          }, {
            no: 20, name: '电气安装辅料', desc: '', qty: 1, unit: '', remark: ''
          }].map(row => (
            <tr key={row.no}>
              <td className="border border-gray-300 px-2 py-1 text-center">{row.no}</td>
              <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{row.name}</td>
              <td className="border border-gray-300 px-2 py-1">{row.desc}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">{row.qty}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">{row.unit}</td>
              <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{row.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (key === 'tractionSystem') {
    return (
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 w-10">序号</th>
            <th className="border border-gray-300 px-2 py-1 w-32">名称</th>
            <th className="border border-gray-300 px-2 py-1">描述</th>
            <th className="border border-gray-300 px-2 py-1 w-10">数量</th>
            <th className="border border-gray-300 px-2 py-1 w-12">单位</th>
            <th className="border border-gray-300 px-2 py-1 w-24">备注</th>
          </tr>
        </thead>
        <tbody>
          {[{
            no: 1, name: '主机（含护罩）', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 2, name: '编码器及连接线', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 3, name: '机架', desc: '', qty: 1, unit: '', remark: '不含承重梁'
          }, {
            no: 4, name: '减震垫', desc: '', qty: 1, unit: '', remark: ''
          }, {
            no: 5, name: '导向轮', desc: '', qty: 1, unit: '', remark: ''
          }].map(row => (
            <tr key={row.no}>
              <td className="border border-gray-300 px-2 py-1 text-center">{row.no}</td>
              <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{row.name}</td>
              <td className="border border-gray-300 px-2 py-1">{row.desc}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">{row.qty}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">{row.unit}</td>
              <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{row.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="space-y-2 text-xs">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 w-32">品牌</th>
            <th className="border border-gray-300 px-2 py-1">型号</th>
          </tr>
        </thead>
        <tbody>
          {[['MITSUBISHI', 'TKP131'], ['KONE', 'AMD'], ['HITACHI', 'MD'], ['Schindler', 'V15'], ['Schindler', 'V30'], ['OTIS', 'NAPA'], ['OTIS', 'AT120'], ['YUNGTAY', 'PD-SG'], ['TK Elevator (TKE)', 'K200']].map(([brand, model]) => (
            <tr key={brand + model}>
              <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{brand}</td>
              <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{model}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-gray-500">支持多品牌门机马达及控制器改造，以上为部分典型型号。</p>
    </div>
  );
};

// Helper component to handle IME composition (Chinese input)
const CompositionInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, className, placeholder }) => {
  const [innerValue, setInnerValue] = useState(value);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    setInnerValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInnerValue(e.target.value);
    if (!isComposing) {
      onChange(e.target.value);
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    onChange(e.currentTarget.value);
  };

  return (
    <input
      type="text"
      value={innerValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className={className}
      placeholder={placeholder}
    />
  );
};

interface Props {
  data: QuotationResult;
  input: QuotationInput;
  onInputChange: (input: QuotationInput) => void;
}

export const QuotationPreview: React.FC<Props> = ({ data, input, onInputChange }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [detailView, setDetailView] = useState<DetailKey | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailFullscreen, setDetailFullscreen] = useState(false);

  const handleExportPDF = async () => {
    if (!printRef.current) return;

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        onclone: (clonedDoc) => {
          const root = clonedDoc.querySelector('[data-scheme]') as HTMLElement | null;
          const scheme = root?.getAttribute('data-scheme') || '';

          const noPrintElements = clonedDoc.querySelectorAll('.no-print');
          noPrintElements.forEach(el => {
            if (el instanceof HTMLElement) el.style.display = 'none';
          });

          const inputs = root ? root.querySelectorAll('input') : clonedDoc.querySelectorAll('input');
          inputs.forEach((input) => {
            if (input instanceof HTMLInputElement) {
              const span = clonedDoc.createElement('span');
              span.textContent = input.value;
              const isNumberInput = input.type === 'number';
              if (!isNumberInput) {
                span.className = input.className;
              }
              span.style.border = 'none';
              span.style.borderBottom = 'none';
              span.style.background = 'transparent';
              span.style.padding = '0';
              span.style.margin = '0';
              span.style.display = 'inline-block';
              span.style.width = '100%';
              span.style.textAlign = isNumberInput ? 'right' : 'left';

              span.style.lineHeight = '1.0';
              span.style.verticalAlign = 'middle';
              span.style.position = 'relative';
              span.style.top = '0px';

              if (input.parentElement) {
                const td = input.closest('td');
                if (td instanceof HTMLElement && (scheme === '方案4' || scheme === '方案5') && isNumberInput) {
                  td.style.borderBottom = 'none';
                  td.style.borderTop = 'none';
                }

                input.parentElement.replaceChild(span, input);
                if (input.parentElement instanceof HTMLElement) {
                  input.parentElement.style.verticalAlign = 'middle';
                }
              }
            }
          });
           
           // 3. Ensure all table cells are vertically aligned to middle
           const cells = clonedDoc.querySelectorAll('td, th');
           cells.forEach(cell => {
             if (cell instanceof HTMLElement) {
               cell.style.verticalAlign = 'middle';
             }
           });
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${input.projectName}_报价单.pdf`);
    } catch (err) {
      console.error('PDF Export failed', err);
      alert('导出PDF失败，请重试');
    }
  };

  const handleModification = (name: string, field: 'unitPrice' | 'quantity', value: number) => {
    const newModifications = { ...(input.modifications || {}) };
    
    if (!newModifications[name]) {
      newModifications[name] = {};
    }
    
    newModifications[name] = {
      ...newModifications[name],
      [field]: value
    };

    onInputChange({
      ...input,
      modifications: newModifications
    });
  };

  const handleCustomItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newCustomItems = [...(input.customItems || [])];
    if (newCustomItems[index]) {
      newCustomItems[index] = {
        ...newCustomItems[index],
        [field]: value
      };
      onInputChange({
        ...input,
        customItems: newCustomItems
      });
    }
  };

  const handleAddCustomItem = () => {
    const newItem: QuotationItem = {
      name: '新增项',
      spec: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      remark: ''
    };
    onInputChange({
      ...input,
      customItems: [...(input.customItems || []), newItem]
    });
  };

  const handleRemoveCustomItem = (index: number) => {
    const newCustomItems = [...(input.customItems || [])];
    newCustomItems.splice(index, 1);
    onInputChange({
      ...input,
      customItems: newCustomItems
    });
  };

  const standardItemsCount = data.items.length - (input.customItems?.length || 0);

  const openDetail = (key: DetailKey) => {
    setDetailView(key);
    setDetailFullscreen(false);
    setDetailVisible(false);
    setTimeout(() => {
      setDetailVisible(true);
    }, 10);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setTimeout(() => {
      setDetailView(null);
    }, 400);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">

        <h2 className="text-xl font-bold text-industrial-accent">报价单预览</h2>
        <button
          onClick={handleExportPDF}
          className="flex items-center bg-industrial-accent text-black font-bold py-2 px-4 rounded-sm hover:bg-orange-500 transition-colors"
        >
          <Download className="mr-2 h-4 w-4" /> 导出 PDF
        </button>
      </div>

      {data.warnings.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 text-yellow-500 p-4 rounded-sm">
          <div className="flex items-center font-bold mb-2">
            <AlertTriangle className="mr-2 h-4 w-4" /> 注意事项
          </div>
          <ul className="list-disc list-inside text-sm">
            {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Printable Area */}
      <div className="overflow-auto bg-neutral-900 rounded-sm p-1">
        <div 
          ref={printRef} 
          data-scheme={input.scheme}
          className={`relative bg-white text-black p-8 min-h-[297mm] w-[210mm] mx-auto shadow-2xl origin-top ${detailFullscreen ? '' : 'transform scale-75 md:scale-100'}`}
          style={{ fontFamily: 'sans-serif' }}
        >
          {/* Header */}
          <div className="relative border-b-2 border-black pb-4 mb-6 flex items-center justify-center min-h-[4rem]">
            {/* Logo */}
            <div className="absolute left-0 h-full flex items-center">
              <img src={`${BASE}NidecElevator-logo.png`} alt="Nidec Elevator" className="h-12 w-auto object-contain" />
            </div>
            
            <h1 className="text-3xl font-bold tracking-widest uppercase">电梯改造报价单</h1>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
            <div className="flex border-b border-gray-300 pb-1">
              <span className="font-bold w-24">项目名称:</span>
              <span>{input.projectName}</span>
            </div>
            <div className="flex border-b border-gray-300 pb-1">
              <span className="font-bold w-24">客户名称:</span>
              <span>{input.customerName}</span>
            </div>
            <div className="flex border-b border-gray-300 pb-1">
              <span className="font-bold w-24">报价日期:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex border-b border-gray-300 pb-1">
              <span className="font-bold w-24">载重/速度:</span>
              <span>{input.load}kg / {input.speed}m/s</span>
            </div>
             <div className="flex border-b border-gray-300 pb-1">
              <span className="font-bold w-24">楼层数:</span>
              <span>{input.floors} 层</span>
            </div>
             <div className="flex border-b border-gray-300 pb-1">
              <span className="font-bold w-24">机房/开门:</span>
              <span>{input.hasMachineRoom ? '有机房' : '无机房'} / {input.isThrough ? '贯通门' : '单开门'}</span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr className="bg-gray-100 border-y-2 border-black">
                <th className="py-3 px-2 text-left w-12">序号</th>
                <th className="py-3 px-2 text-left w-64">部件名称</th>
                <th className="py-3 px-2 text-left w-48">规格型号</th>
                <th className="py-3 px-2 text-center w-16">数量</th>
                <th className="py-3 px-2 text-right w-24">单价 (¥)</th>
                <th className="py-3 px-2 text-right w-28">总价 (¥)</th>
                <th className="py-3 px-2 text-left w-32 pl-4">备注</th>
                <th className="py-3 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => {
                const isCustom = index >= standardItemsCount;
                const customIndex = index - standardItemsCount;

                const detailKey = findDetailKeyByName(item.name);

                return (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 group">
                    <td className="py-3 px-2 text-gray-500">{index + 1}</td>
                    <td className="py-3 px-2 font-medium w-64">
                      {isCustom ? (
                        <CompositionInput
                          value={item.name}
                          onChange={(val) => handleCustomItemChange(customIndex, 'name', val)}
                          className="w-full bg-transparent border-b border-transparent focus:border-industrial-accent focus:outline-none"
                        />
                      ) : (
                        detailKey ? (
                          <button
                            type="button"
                            className="relative inline-flex items-center cursor-pointer group/name"
                            onClick={() => openDetail(detailKey)}
                          >
                            <span className="font-semibold" style={{ color: '#193527' }}>
                              {item.name}
                            </span>
                            <img
                              src={DETAIL_CONFIG[detailKey].mainImage}
                              alt={item.name}
                              className="absolute left-full ml-2 top-1/2 -translate-y-1/2 max-w-[600px] max-h-[520px] object-contain rounded-sm border border-gray-300 bg-white shadow-lg opacity-0 pointer-events-none z-50 group-hover/name:opacity-100 group-hover/name:pointer-events-auto transition-opacity duration-400"
                            />
                          </button>
                        ) : (
                          item.name
                        )
                      )}
                    </td>
                    <td className="py-3 px-2 text-gray-600 font-mono text-xs w-48">
                      {isCustom ? (
                        <CompositionInput
                          value={item.spec || ''}
                          onChange={(val) => handleCustomItemChange(customIndex, 'spec', val)}
                          className="w-full bg-transparent border-b border-transparent focus:border-industrial-accent focus:outline-none"
                        />
                      ) : (
                        item.name === '轿门机（不含门板和地坎）' ? '-' : (item.spec || '-')
                      )}
                    </td>
                    <td className="py-3 px-2 text-center w-16">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => isCustom 
                          ? handleCustomItemChange(customIndex, 'quantity', Number(e.target.value))
                          : handleModification(item.name, 'quantity', Number(e.target.value))
                        }
                        className="w-14 text-center bg-transparent border-b border-gray-300 focus:border-industrial-accent focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-2 text-right font-mono">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => isCustom
                          ? handleCustomItemChange(customIndex, 'unitPrice', Number(e.target.value))
                          : handleModification(item.name, 'unitPrice', Number(e.target.value))
                        }
                        className="w-20 text-right bg-transparent border-b border-gray-300 focus:border-industrial-accent focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold">
                      {item.totalPrice > 0 ? item.totalPrice.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-2 pl-4 text-xs text-gray-500 w-32">
                      {isCustom ? (
                        <CompositionInput
                          value={item.remark || ''}
                          onChange={(val) => handleCustomItemChange(customIndex, 'remark', val)}
                          className="w-full bg-transparent border-b border-transparent focus:border-industrial-accent focus:outline-none"
                          placeholder="备注"
                        />
                      ) : (
                        item.remark
                      )}
                    </td>
                    <td className="py-3 px-2 text-center align-middle">
                      {isCustom && (
                        <button 
                          onClick={() => handleRemoveCustomItem(customIndex)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity no-print"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="no-print">
                <td colSpan={8} className="py-4 text-center border-b border-gray-200">
                    <button
                      onClick={handleAddCustomItem}
                      className="flex items-center justify-center mx-auto transition-colors"
                      style={{ color: '#193527' }}
                    >
                      <Plus className="h-5 w-5 mr-1" /> 添加项目
                    </button>
                </td>
              </tr>
              <tr className="bg-gray-100 border-t-2 border-black">
                <td colSpan={5} className="py-4 px-2 text-right font-bold text-lg uppercase">总计 (含税):</td>
                <td colSpan={3} className="py-4 px-2 text-right font-bold text-xl font-mono whitespace-nowrap" style={{ color: '#193527' }}>
                  ¥ {data.totalPrice.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div className="mt-12 text-xs text-gray-400 text-center border-t border-gray-200 pt-4">
            <p>报价有效期：15天 | 最终解释权归尼得科康迪克电梯技术(有限公司)所有</p>
          </div>
          {detailView && (
            <div
              className={`${
                detailFullscreen 
                  ? 'fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-12' 
                  : 'absolute inset-0 z-10 bg-white'
              } flex flex-col origin-top ${
                detailVisible ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-200`}
              onClick={detailFullscreen ? () => setDetailFullscreen(false) : undefined}
            >
              <div 
                className={`${
                  detailFullscreen 
                    ? 'bg-white h-full max-h-[90vh] w-auto max-w-5xl rounded-lg shadow-2xl flex flex-col p-8 overflow-hidden' 
                    : 'w-full h-full flex flex-col p-10 overflow-hidden'
                } transform ${
                  detailVisible ? (detailFullscreen ? 'scale-90' : 'scale-95') : 'scale-100'
                } transition-transform duration-300 ease-out`} 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-gray-300 pb-2 mb-4">
                  <h2 className="text-xl font-bold">{DETAIL_CONFIG[detailView].title}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-black p-1 cursor-pointer border border-gray-300 rounded-sm"
                      onClick={() => setDetailFullscreen(!detailFullscreen)}
                    >
                      {detailFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="text-gray-500 hover:text-black text-xl font-bold px-2 cursor-pointer"
                      onClick={closeDetail}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="flex-1 grid gap-8 overflow-auto items-start" style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 4fr)' }}>
                  <div>
                    {renderDetailTable(detailView)}
                  </div>
                  <div className="flex justify-center items-start">
                    <img
                      src={DETAIL_CONFIG[detailView].mainImage}
                      alt="系统图片"
                      className="max-w-full h-auto object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
