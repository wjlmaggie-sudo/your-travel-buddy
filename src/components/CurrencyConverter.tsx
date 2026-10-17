import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Coins } from "lucide-react";
import { fetchExchangeRate, FX_CURRENCIES } from "@/lib/exchange-rates";
import { dailyMoney } from "./DailyBudget";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
export function CurrencyConverter({ currency = "EUR" }: { currency?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false),
    [amount, setAmount] = useState("100");
  const [base, setBase] = useState(FX_CURRENCIES.includes(currency) ? currency : "EUR");
  const [quote, setQuote] = useState(currency === "USD" ? "EUR" : "USD");
  const rate = useQuery({
    queryKey: ["reference-exchange-rate", base, quote],
    queryFn: ({ signal }) => fetchExchangeRate(base, quote, signal),
    enabled: open && base !== quote,
    staleTime: 1800000,
    retry: false,
  });
  const number = Number(amount),
    valid = amount.trim() !== "" && Number.isFinite(number) && number >= 0 && number <= 1e12;
  return (
    <details
      className="rounded-xl border bg-card p-4 shadow-sm"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          Currency exchange
        </span>
      </summary>
      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor={`${id}-amount`}>Amount to convert</Label>
          <Input
            id={`${id}-amount`}
            type="number"
            min={0}
            max={1e12}
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <Label htmlFor={`${id}-from`}>From currency</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-2"
              id={`${id}-from`}
              value={base}
              onChange={(e) => setBase(e.target.value)}
            >
              {FX_CURRENCIES.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Swap currencies"
            onClick={() => {
              setBase(quote);
              setQuote(base);
            }}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <div>
            <Label htmlFor={`${id}-to`}>To currency</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-2"
              id={`${id}-to`}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            >
              {FX_CURRENCIES.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>
        <div aria-live="polite" className="rounded-lg bg-secondary/10 p-3">
          {!valid ? (
            <p className="text-sm">Enter a valid, non-negative amount.</p>
          ) : base === quote ? (
            <p className="text-lg font-semibold">{dailyMoney(number, quote)} · same currency</p>
          ) : rate.isPending ? (
            <p className="text-sm">Checking reference rate…</p>
          ) : rate.isError ? (
            <p className="text-sm">
              The rate is unavailable. Try another pair or check again later.
            </p>
          ) : (
            <>
              <p className="break-words text-xl font-semibold">
                {dailyMoney(number * rate.data.rate, quote)}
              </p>
              <p className="mt-1 text-xs">
                1 {base} = {rate.data.rate.toFixed(5)} {quote} · published {rate.data.date}
              </p>
            </>
          )}
        </div>
        {base !== quote && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={rate.isFetching}
            onClick={() => rate.refetch()}
          >
            Refresh rate
          </Button>
        )}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          ECB reference rates via{" "}
          <a className="underline" href="https://frankfurter.dev/" target="_blank" rel="noreferrer">
            Frankfurter
          </a>
          . Not a bank or exchange-desk quote; fees and spreads are excluded. Rates may use the
          previous business day. This calculator does not change your trip budget.
        </p>
      </div>
    </details>
  );
}
