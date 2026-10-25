import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Coins } from "lucide-react";
import { fetchExchangeRate, FX_CURRENCIES } from "@/lib/exchange-rates";
import { dailyMoney } from "./DailyBudget";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
export function CurrencyConverter({
  currency = "EUR",
  active = true,
}: {
  currency?: string;
  active?: boolean;
}) {
  const id = useId();
  const [requested, setRequested] = useState(false),
    [amount, setAmount] = useState("100");
  const [base, setBase] = useState(FX_CURRENCIES.includes(currency) ? currency : "EUR");
  const [quote, setQuote] = useState(currency === "USD" ? "EUR" : "USD");
  const rate = useQuery({
    queryKey: ["reference-exchange-rate", base, quote],
    queryFn: ({ signal }) => fetchExchangeRate(base, quote, signal),
    enabled: active && requested && base !== quote,
    staleTime: 1800000,
    retry: false,
  });
  const number = Number(amount),
    valid = amount.trim() !== "" && Number.isFinite(number) && number >= 0 && number <= 1e12;
  return (
    <section className="tool-card mx-auto max-w-2xl" aria-label="Currency converter">
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-xl bg-secondary/10 p-3 text-secondary">
          <Coins className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-2xl font-semibold">Currency converter</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A quick reference for everyday travel spending.
          </p>
        </div>
      </div>
      <div className="space-y-4">
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
        <div
          aria-live="polite"
          className="flex min-h-[110px] flex-col justify-center rounded-2xl bg-gradient-to-br from-secondary/15 to-secondary/5 p-5"
        >
          {!valid ? (
            <p className="text-sm">Enter a valid, non-negative amount.</p>
          ) : base === quote ? (
            <p className="text-lg font-semibold">{dailyMoney(number, quote)} · same currency</p>
          ) : !requested ? (
            <p className="text-sm text-muted-foreground">
              Choose your currencies, then check the reference rate.
            </p>
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
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={base === quote || (requested && rate.isFetching)}
          onClick={() => {
            if (requested) void rate.refetch();
            else setRequested(true);
          }}
        >
          {requested && rate.isFetching
            ? "Checking rate…"
            : requested
              ? "Refresh rate"
              : "Check exchange rate"}
        </Button>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          ECB reference rates via{" "}
          <a className="underline" href="https://frankfurter.dev/" target="_blank" rel="noreferrer">
            Frankfurter
          </a>
          . Not a bank or exchange-desk quote; fees and spreads are excluded. Rates may use the
          previous business day. This calculator does not change your trip budget.
        </p>
      </div>
    </section>
  );
}
