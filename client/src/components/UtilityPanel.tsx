import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { CurrencyConverter } from './CurrencyConverter';
import { MiniCalculator } from './MiniCalculator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface UtilityPanelProps {
  onConvertApply?: (amount: number, from: string, to: string) => void;
  onCalculateApply?: (result: number) => void;
}

export function UtilityPanel({ onConvertApply, onCalculateApply }: UtilityPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for applyAmount events to show feedback
  useEffect(() => {
    const handleApply = (e: CustomEvent) => {
      toast.success(`Applied ${e.detail.amount} to form`);
    };
    window.addEventListener('applyAmount', handleApply as EventListener);
    return () => window.removeEventListener('applyAmount', handleApply as EventListener);
  }, []);

  const handleApplyAmount = (amount: number) => {
    // Dispatch custom event for amount application
    window.dispatchEvent(new CustomEvent('applyAmount', { detail: { amount } }));
    onCalculateApply?.(amount);
    setIsOpen(false);
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
      <SheetContent side="right" className="w-full sm:w-[420px] p-0">
        <SheetHeader className="border-b p-6 pb-4">
          <SheetTitle>Quick Utilities</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="calculator" className="h-[calc(100vh-80px)] flex flex-col">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="converter">Converter</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="calculator" className="mt-0 space-y-4">
              <MiniCalculator
                onResult={handleApplyAmount}
              />
            </TabsContent>

            <TabsContent value="converter" className="mt-0 space-y-4">
              <CurrencyConverter
                onApply={(amount, from, to) => {
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
