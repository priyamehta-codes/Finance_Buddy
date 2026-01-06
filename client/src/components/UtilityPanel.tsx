import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Calculator, Plus } from 'lucide-react';
import { CurrencyConverter } from './CurrencyConverter';
import { MiniCalculator } from './MiniCalculator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';

interface UtilityPanelProps {
  onConvertApply?: (amount: number, from: string, to: string) => void;
  onCalculateApply?: (result: number) => void;
}

export function UtilityPanel({ onConvertApply, onCalculateApply }: UtilityPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastCalculatedAmount, setLastCalculatedAmount] = useState<number>(0);
  const addTransaction = useStore((state) => state.addTransaction);
  const [, navigate] = useLocation();

  // Listen for applyAmount events to show feedback
  useEffect(() => {
    const handleApply = (e: CustomEvent) => {
      toast.success(`Applied ${e.detail.amount} to form`);
    };
    window.addEventListener('applyAmount', handleApply as EventListener);
    return () => window.removeEventListener('applyAmount', handleApply as EventListener);
  }, []);

  const handleApplyAmount = (amount: number) => {
    setLastCalculatedAmount(amount);
    // Dispatch custom event for amount application
    window.dispatchEvent(new CustomEvent('applyAmount', { detail: { amount } }));
    onCalculateApply?.(amount);
    setIsOpen(false);
  };

  const handleAddAsIncome = async () => {
    if (lastCalculatedAmount > 0) {
      await addTransaction({
        amount: lastCalculatedAmount,
        type: 'income',
        category: 'Other',
        date: new Date().toISOString(),
        description: 'Added from calculator'
      });
      toast.success(`Added ${lastCalculatedAmount} as income!`);
      setIsOpen(false);
    } else {
      toast.error('Calculate an amount first');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          title="Open calculator and converter"
        >
          <Calculator className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[360px] p-0">
        <SheetHeader className="border-b p-4 pb-3">
          <SheetTitle className="text-base">Quick Utilities</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="calculator" className="h-[calc(100vh-70px)] flex flex-col">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b h-9">
            <TabsTrigger value="calculator" className="text-sm">Calculator</TabsTrigger>
            <TabsTrigger value="converter" className="text-sm">Converter</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="calculator" className="mt-0 space-y-3">
              <MiniCalculator
                onResult={(result) => {
                  setLastCalculatedAmount(result);
                  handleApplyAmount(result);
                }}
                compact={true}
              />
              
              {/* Quick Add to Income Button */}
              <Button
                onClick={handleAddAsIncome}
                variant="outline"
                className="w-full h-9 text-sm border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Income
              </Button>
            </TabsContent>

            <TabsContent value="converter" className="mt-0 space-y-3">
              <CurrencyConverter
                compact={true}
                onApply={(amount, from, to) => {
                  setLastCalculatedAmount(amount);
                  onConvertApply?.(amount, from, to);
                  handleApplyAmount(amount);
                }}
              />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
