import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, X, Divide, Percent, Users, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface MiniCalculatorProps {
  onResult?: (result: number) => void;
  showConvert?: boolean;
}

export function MiniCalculator({ onResult, showConvert = true }: MiniCalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [tipPercent, setTipPercent] = useState(15);
  const [splitCount, setSplitCount] = useState(2);

  const current = parseFloat(display) || 0;

  const handleNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op: string) => {
    const currentValue = parseFloat(display) || 0;

    if (previousValue !== null && operation && !waitingForNewValue) {
      const result = calculate(previousValue, currentValue, operation);
      setDisplay(result.toString());
      setPreviousValue(result);
    } else {
      setPreviousValue(currentValue);
    }

    setOperation(op);
    setWaitingForNewValue(true);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+':
        return Math.round((prev + current) * 100) / 100;
      case '-':
        return Math.round((prev - current) * 100) / 100;
      case '×':
        return Math.round(prev * current * 100) / 100;
      case '÷':
        return current === 0 ? 0 : Math.round((prev / current) * 100) / 100;
      case '%':
        return Math.round((prev * current / 100) * 100) / 100;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const result = calculate(previousValue, current, operation);
      setDisplay(result.toString());
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const calculateTip = () => {
    const tip = Math.round((current * tipPercent / 100) * 100) / 100;
    const total = Math.round((current + tip) * 100) / 100;
    setDisplay(total.toString());
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(true);
    toast.success(`Tip: +${tip.toFixed(2)} (Total: ${total.toFixed(2)})`);
  };

  const calculateSplit = () => {
    if (splitCount < 1) {
      toast.error('Split count must be at least 1');
      return;
    }
    const perPerson = Math.round((current / splitCount) * 100) / 100;
    setDisplay(perPerson.toString());
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(true);
    toast.success(`Per person: ${perPerson.toFixed(2)}`);
  };

  const handleApply = () => {
    if (onResult) {
      onResult(current);
      toast.success('Amount applied!');
    }
  };

  const buttons = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Calculator</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Display */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="text-right text-3xl font-bold font-mono break-words">
            {display}
          </div>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((row) =>
            row.map((btn) => (
              <Button
                key={btn}
                size="sm"
                variant={btn === '=' ? 'default' : 'outline'}
                onClick={() => {
                  if (btn === '=') handleEquals();
                  else if (['+', '-', '×', '÷', '%'].includes(btn))
                    handleOperation(btn);
                  else if (btn === '.') handleDecimal();
                  else handleNumber(btn);
                }}
                className="font-semibold"
              >
                {btn === '×' ? 'x' : btn === '÷' ? '/' : btn}
              </Button>
            ))
          )}
        </div>

        {/* Clear Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleClear}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear
        </Button>

        {/* Tip Calculator */}
        <div className="space-y-2 border-t pt-3">
          <label className="text-xs font-medium">Tip {tipPercent}%</label>
          <div className="flex gap-2">
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={tipPercent}
              onChange={(e) => setTipPercent(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-mono w-8">{tipPercent}%</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={calculateTip}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tip
          </Button>
        </div>

        {/* Split Calculator */}
        <div className="space-y-2 border-t pt-3">
          <label className="text-xs font-medium">Split Among</label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="1"
              value={splitCount}
              onChange={(e) => setSplitCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 text-center"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSplitCount(splitCount + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={calculateSplit}
            className="w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            Split Bill
          </Button>
        </div>

        {/* Apply Button */}
        {onResult && (
          <Button onClick={handleApply} className="w-full">
            Apply to Form
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
