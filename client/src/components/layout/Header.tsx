import { Bell, Search, Sun, Moon, LogOut, DollarSign, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStore, Currency } from "@/lib/store";
import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, toggleTheme as toggleThemeMode } from "@/lib/theme";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { UtilityPanel } from "@/components/UtilityPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CURRENCIES: { label: string; value: Currency }[] = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'INR (₹)', value: 'INR' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
];

export function Header({ title, onMenuClick }: { title: string; onMenuClick?: () => void }) {
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const setCurrency = useStore((state) => state.setCurrency);
  const [theme, setTheme] = useState<'light' | 'dark'>(getStoredTheme());
  const [, navigate] = useLocation();

  useEffect(() => {
    const stored = applyTheme(getStoredTheme());
    setTheme(stored);
  }, []);

  const toggleTheme = () => {
    const next = toggleThemeMode(theme);
    setTheme(next);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      logout();
      navigate('/auth');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
      logout();
      navigate('/auth');
    }
  };

  const handleCurrencyChange = (currency: Currency) => {
    setCurrency(currency);
  };

  const currencyLabel = CURRENCIES.find(c => c.value === user?.currency)?.label || 'USD ($)';
  const userDisplayName = user?.name?.trim() || (user?.email ? user.email.split('@')[0] : 'Guest User');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="w-64 bg-background pl-9 md:w-80"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Currency Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-1 sm:gap-2 text-muted-foreground hover:text-foreground px-2 sm:px-3"
              >
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-xs font-medium">{currencyLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CURRENCIES.map((currency) => (
                <DropdownMenuItem 
                  key={currency.value}
                  onClick={() => handleCurrencyChange(currency.value)}
                  className="cursor-pointer"
                >
                  {currency.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="transition-all duration-300 hover:rotate-12"
          >
            {theme === 'light' ? (
              <Sun className="h-5 w-5 text-muted-foreground transition-transform duration-300" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground transition-transform duration-300" />
            )}
          </Button>

          <UtilityPanel />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative group"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:rotate-12" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Due payments</p>
                  <p className="text-xs text-muted-foreground">Review upcoming dues this week.</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-yellow-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Spending warnings</p>
                  <p className="text-xs text-muted-foreground">You are close to this month’s limit.</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-1 sm:ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity rounded-lg p-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium leading-none truncate">{userDisplayName}</p>
                  </div>
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-border flex-shrink-0">
                    <AvatarImage src={user?.avatar} alt={userDisplayName} />
                    <AvatarFallback>{(userDisplayName?.[0] || 'G').toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-semibold">{userDisplayName}</p>
                    {user?.email && <p className="text-xs text-muted-foreground mt-1">{user.email}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/settings") }>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
