import { useState, useEffect } from 'react';
import { QuotationForm } from './components/QuotationForm';
import { QuotationPreview } from './components/QuotationPreview';
import { calculateQuotation } from './lib/logic';
import { QuotationInput, QuotationResult } from './types';
import { Factory } from 'lucide-react';

const DEFAULT_INPUT: QuotationInput = {
  projectName: '',
  customerName: '',
  scheme: '方案1',
  load: 1000,
  speed: 1.0,
  floors: 10,
  isThrough: false,
  hasMachineRoom: true,
  engineerMeasure: true,
  
  // Defaults for conditionals
  // oldMachinePower: 5.5, // Removed default value to prevent unwanted fallback
  oldMachineCurrent: 13, // Default oldMachineCurrent to 13A as per user request
  tractionRatio: '2:1'
};

function App() {
  const [input, setInput] = useState<QuotationInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<QuotationResult>({ totalPrice: 0, items: [], warnings: [] });
  // Add state to track if a scheme has been selected in the UI
  const [hasSelectedScheme, setHasSelectedScheme] = useState(false);

  useEffect(() => {
    // If no scheme selected yet (and not just default '方案1'), 
    // we might want to suppress calculation or filter result.
    // However, logic.ts calculates based on 'scheme' string.
    // We can filter the result items if !hasSelectedScheme.
    
    const res = calculateQuotation(input);
    if (!hasSelectedScheme) {
        // If no scheme selected, hide scheme-specific items (Control, Door, Machine, etc.)
        // Keep common items? Or show empty?
        // Requirement: "Right side Control System and Door Motor rows also not shown"
        // Common items like "Field Measure", "Freight", "Packaging" might still be there?
        // Usually, without a scheme, we shouldn't show much.
        // Let's filter out everything EXCEPT maybe "Freight" or "Measure" if they are truly independent?
        // But "Packaging" depends on components. 
        // Safer to show empty or just basic info?
        // Let's filter out the main components.
        
        const hiddenNames = ['控制系统全套', '门机马达及控制器', '轿门机（不含门板和地坎）', '曳引机', '机架（含导向轮）', '编码器（含安装支架）', '包装'];
        res.items = res.items.filter(item => !hiddenNames.includes(item.name));
        res.totalPrice = res.items.reduce((sum, i) => sum + i.totalPrice, 0);
    }
    setResult(res);
  }, [input, hasSelectedScheme]);

  return (
    <div className="min-h-screen bg-industrial-bg text-industrial-text font-sans selection:bg-industrial-accent selection:text-black">
      {/* Header */}
      <header className="bg-industrial-card border-b border-industrial-border sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Factory className="h-8 w-8 text-industrial-accent mr-3" />
          <h1 className="text-xl font-bold tracking-wider uppercase">
            电梯改造报价系统 <span className="text-xs text-industrial-accent ml-2 px-2 py-0.5 border border-industrial-accent rounded-full">PRO</span>
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Form */}
          <div className="lg:col-span-5 space-y-6">
            <QuotationForm 
              value={input} 
              onChange={setInput} 
              onSchemeSelect={(selected) => setHasSelectedScheme(selected)} 
            />
            
            {/* Quick Stats or Helper Text could go here */}
            <div className="bg-industrial-card border border-industrial-border p-4 rounded-sm text-sm text-industrial-muted">
              <p>请根据实际勘测数据填写参数。部分方案需要特定的原机信息才能准确报价。</p>
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <QuotationPreview data={result} input={input} onInputChange={setInput} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
