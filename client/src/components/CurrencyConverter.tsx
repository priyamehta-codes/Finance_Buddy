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
import { ArrowRightLeft, Copy, Check, Zap, WifiOff, AlertCircle } from 'lucide-react';
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
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PRESET_AMOUNTS = [100, 500, 1000];

  // Debounced conversion
  const handleConvert = useCallback(async () => {
    const numAmount = parseCurrencyInput(amount);
    if (!numAmount || from === to) {
      setConverted(numAmount);
      setRate(1);
      setError(null);
      setIsStale(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await convertCurrency(numAmount, from, to);
      setConverted(result.converted);
      setRate(result.rate);
      setLastUpdate(result.timestamp);
      setProvider(result.provider);
      // Check if data is stale (provider includes "stale")
      setIsStale(result.provider.includes('stale'));
    } catch (err) {
      console.error('Conversion failed:', err);
      setError('Failed to fetch rates');
      toast.error('Using cached rate - unable to refresh');
      setIsStale(true);
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
      toast.success(`Copied ${text}`);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleApply = () => {
    const numAmount = converted ?? parseCurrencyInput(amount);
    if (onApply && numAmount > 0) {
      onApply(numAmount, from, to);
      // Dispatch event for forms listening
      window.dispatchEvent(new CustomEvent('applyAmount', { detail: { amount: numAmount } }));
      toast.success('Amount applied!');
    }
  };

  const currencies: Currency[] = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'];

  // Compact mode for sidebar or utility panel
  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm">Currency Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-0">
          {/* Amount Input */}
          <div className="space-y-1">
            <Label className="text-xs">Amount</Label>
            <Input
              type="text"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Currency Selection */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Select value={from} onValueChange={(value) => setFrom(value as Currency)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency} className="text-xs">
                      {currency} {CURRENCY_SYMBOLS[currency]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Select value={to} onValueChange={(value) => setTo(value as Currency)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
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
            className="w-full h-7 text-xs"
          >
            <ArrowRightLeft className="h-3 w-3 mr-1" />
            Swap
          </Button>

          {/* Result */}
          {converted !== null && (
            <div className="bg-muted p-2 rounded-md space-y-1">
              <div className="text-xs text-muted-foreground">
                {formatCurrency(parseCurrencyInput(amount), from)} =
              </div>
              <div className="text-lg font-bold">
                {formatCurrency(converted, to)}
              </div>
              {rate && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {isStale && <WifiOff className="h-3 w-3 text-amber-500" />}
                  <span>1 {from} = {rate.toFixed(4)} {to}</span>
                </div>
              )}
              {isStale && lastUpdate && (
                <div className="flex items-center gap-1 text-[10px] text-amber-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>Cached rate ({getTimeSinceUpdate(lastUpdate)})</span>
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
            className="w-full h-7 text-xs"
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

          {/* Apply to Form Button */}
          {onApply && (
            <Button
              size="sm"
              onClick={handleApply}
              disabled={converted === null}
              className="w-full h-8 text-sm"
            >
              Apply to Form
            </Button>
          )}

          {isLoading && (
            <div className="text-[10px] text-muted-foreground text-center animate-pulse">
              Fetching rates...
            </div>
          )}
        </CardContent>
      </Card>
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isStale && <WifiOff className="h-3 w-3 text-amber-500" />}
                <span>1 {from} = {rate.toFixed(4)} {to}</span>
              </div>
            )}
            {lastUpdate && (
              <div className={`flex items-center gap-1 text-xs ${isStale ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {isStale && <AlertCircle className="h-3 w-3" />}
                <span>
                  {isStale ? 'Using cached rate' : 'Updated'} {getTimeSinceUpdate(lastUpdate)} • {provider}
                </span>
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
