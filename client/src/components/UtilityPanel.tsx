import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { CurrencyConverter } from './CurrencyConverter';
import { MiniCalculator } from './MiniCalculator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UtilityPanelProps {
  onConvertApply?: (amount: number, from: string, to: string) => void;
  onCalculateApply?: (result: number) => void;
}

export function UtilityPanel({ onConvertApply, onCalculateApply }: UtilityPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          title="Open converter and calculator"
        >
          <DollarSign className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[500px] p-0">
        <SheetHeader className="border-b p-6 pb-4">
          <SheetTitle>Utilities</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="converter" className="h-[calc(100vh-80px)] flex flex-col">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger value="converter">Converter</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="converter" className="mt-0 space-y-4">
              <CurrencyConverter
                onApply={(amount, from, to) => {
                  onConvertApply?.(amount, from, to);
                  setIsOpen(false);
                }}
              />
            </TabsContent>

            <TabsContent value="calculator" className="mt-0 space-y-4">
              <MiniCalculator
                onResult={(result) => {
                  onCalculateApply?.(result);
                  setIsOpen(false);
                }}
              />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
