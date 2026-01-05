import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRightLeft, Copy, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  type Currency,
  CURRENCY_SYMBOLS,
  CURRENCY_NAMES,
  convertCurrency,
  formatCurrency,
  parseCurrencyInput,
  getTimeSinceUpdate,
} from '@/lib/currency-utils';

interface CurrencyConverterProps {
  defaultFrom?: Currency;
  defaultTo?: Currency;
  onApply?: (amount: number, from: Currency, to: Currency) => void;
  compact?: boolean;
}

export function CurrencyConverter({
  defaultFrom = 'USD',
  defaultTo = 'INR',
  onApply,
  compact = false,
}: CurrencyConverterProps) {
  const [from, setFrom] = useState<Currency>(defaultFrom);
  const [to, setTo] = useState<Currency>(defaultTo);
  const [amount, setAmount] = useState('1');
  const [converted, setConverted] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [provider, setProvider] = useState('exchangerate.host');

  const PRESET_AMOUNTS = [100, 500, 1000];

  // Debounced conversion
  const handleConvert = useCallback(async () => {
    const numAmount = parseCurrencyInput(amount);
    if (!numAmount || from === to) {
      setConverted(numAmount);
      setRate(1);
      return;
    }

    setIsLoading(true);
    try {
      const result = await convertCurrency(numAmount, from, to);
      setConverted(result.converted);
      setRate(result.rate);
      setLastUpdate(result.timestamp);
      setProvider(result.provider);
    } catch (error) {
      console.error('Conversion failed:', error);
      toast.error('Failed to fetch exchange rate');
    } finally {
      setIsLoading(false);
    }
  }, [amount, from, to]);

  // Debounce conversion
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      handleConvert();
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [handleConvert]);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setAmount(converted?.toString() || '1');
  };

  const handlePresetAmount = (preset: number) => {
    setAmount(preset.toString());
  };

  const handleCopyResult = async () => {
    if (converted === null) return;

    try {
      const text = formatCurrency(converted, to);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleApply = () => {
    const numAmount = parseCurrencyInput(amount);
    if (onApply && numAmount > 0) {
      onApply(numAmount, from, to);
      toast.success('Amount applied!');
    }
  };

  const currencies: Currency[] = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'];

  // Compact mode for sidebar
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Amount Input */}
        <div className="space-y-1">
          <Label className="text-xs text-sidebar-foreground/70">Amount</Label>
          <Input
            type="text"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-8 text-sm bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
          />
        </div>

        {/* Currency Selection */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-sidebar-foreground/70">From</Label>
            <Select value={from} onValueChange={(value) => setFrom(value as Currency)}>
              <SelectTrigger className="h-8 text-xs bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency} className="text-xs">
                    {currency} {CURRENCY_SYMBOLS[currency]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-sidebar-foreground/70">To</Label>
            <Select value={to} onValueChange={(value) => setTo(value as Currency)}>
              <SelectTrigger className="h-8 text-xs bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency} className="text-xs">
                    {currency} {CURRENCY_SYMBOLS[currency]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleSwap}
          className="w-full h-7 text-xs bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
        >
          <ArrowRightLeft className="h-3 w-3 mr-1" />
          Swap
        </Button>

        {/* Result */}
        {converted !== null && (
          <div className="bg-sidebar-accent/50 p-2 rounded-md space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-xs text-sidebar-foreground/70">
              {formatCurrency(parseCurrencyInput(amount), from)} =
            </div>
            <div className="text-lg font-bold text-sidebar-foreground">
              {formatCurrency(converted, to)}
            </div>
            {rate && (
              <div className="text-[10px] text-sidebar-foreground/50">
                1 {from} = {rate.toFixed(4)} {to}
              </div>
            )}
          </div>
        )}

        {/* Copy Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyResult}
          disabled={converted === null}
          className="w-full h-7 text-xs bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy Result
            </>
          )}
        </Button>

        {isLoading && (
          <div className="text-[10px] text-sidebar-foreground/50 text-center animate-pulse">
            Fetching rates...
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Currency Converter</CardTitle>
            <CardDescription>Quick currency conversion</CardDescription>
          </div>
          <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">
            Amount
          </Label>
          <Input
            id="amount"
            type="text"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-base"
          />
        </div>

        {/* Preset Chips */}
        <div className="flex gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <Button
              key={preset}
              size="sm"
              variant={amount === preset.toString() ? 'default' : 'outline'}
              onClick={() => handlePresetAmount(preset)}
              className="flex-1 text-xs"
            >
              {CURRENCY_SYMBOLS[from]}
              {preset.toLocaleString()}
            </Button>
          ))}
        </div>

        {/* Currency Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium">From</Label>
            <Select value={from} onValueChange={(value) => setFrom(value as Currency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency} {CURRENCY_SYMBOLS[currency]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">To</Label>
            <Select value={to} onValueChange={(value) => setTo(value as Currency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency} {CURRENCY_SYMBOLS[currency]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleSwap}
          className="w-full"
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Swap Currencies
        </Button>

        {/* Result */}
        {converted !== null && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="text-sm text-muted-foreground">
              {formatCurrency(parseCurrencyInput(amount), from)} =
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(converted, to)}
            </div>
            {rate && (
              <div className="text-xs text-muted-foreground">
                1 {from} = {rate.toFixed(4)} {to}
              </div>
            )}
            {lastUpdate && (
              <div className="text-xs text-muted-foreground">
                Updated {getTimeSinceUpdate(lastUpdate)} • {provider}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyResult}
            disabled={converted === null}
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </Button>

          {onApply && (
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!converted || isLoading}
              className="flex-1"
            >
              Apply
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="text-xs text-muted-foreground text-center">
            Fetching rates...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
