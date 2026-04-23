"""
Fetch live Yahoo Finance quotes for every position in the personal portfolio,
convert everything to USD, and write a snapshot to:

    _data/portfolio.json

Jekyll exposes this file as `site.data.portfolio` at build time, so the
/portfolio/ page gets fresh numbers every time the market-data cron runs and
pushes a new JSON.

Positions, quantities, and average-cost basis (all pre-converted to USD) are
hard-coded below. Update them when you buy / sell. Live prices and USDKRW fx
are pulled at runtime; everything else is derived.

stdlib only — matches the existing fetch_market.py style.
"""
from __future__ import annotations

import json
import pathlib
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "_data" / "portfolio.json"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

# ---------------------------------------------------------------------------
# Static positions — update by hand when you buy / sell.
# avg_usd is the USD-equivalent average-cost basis PER UNIT. For KRW-denominated
# buys (KR equities / KRW-pair crypto), convert using the FX rate at the time
# of purchase so the cost basis stays stable across fx swings.
# cat: us | kr | crypto
# ---------------------------------------------------------------------------

# Logo URLs are mix-sourced: TradingView's public symbol-logo CDN where it
# has the ticker, Google's favicon service as a reliable fallback, and
# CoinGecko's image CDN for crypto. (Clearbit's free logo API went offline
# in early 2025, hence none of those endpoints here.)
POSITIONS = [
    {"sym": "MSTR",      "name": "Strategy",                "qty": 6,           "avg_usd":  145.7966, "cat": "us",
     "logo": "https://s3-symbol-logo.tradingview.com/microstrategy--big.svg"},
    {"sym": "MUFG",      "name": "Mitsubishi UFJ (ADR)",    "qty": 45,          "avg_usd":   18.9300, "cat": "us",
     "logo": "https://www.google.com/s2/favicons?sz=128&domain=mufgamericas.com"},
    {"sym": "BMNR",      "name": "BitMine Immersion",       "qty": 17,          "avg_usd":   23.3247, "cat": "us",
     "logo": "https://s3-symbol-logo.tradingview.com/bitmine-immersion-technologies--big.svg"},
    {"sym": "SPYM",      "name": "SPDR Portfolio S&P 500",  "qty": 4,           "avg_usd":   77.1300, "cat": "us",
     "logo": "https://www.google.com/s2/favicons?sz=128&domain=ssga.com"},
    {"sym": "JOBY",      "name": "Joby Aviation",           "qty": 14,          "avg_usd":   14.6100, "cat": "us",
     "logo": "https://s3-symbol-logo.tradingview.com/joby-aviation--big.svg"},
    {"sym": "SONY",      "name": "Sony Group (ADR)",        "qty": 6,           "avg_usd":   22.7766, "cat": "us",
     "logo": "https://s3-symbol-logo.tradingview.com/sony--big.svg"},
    {"sym": "069500.KS", "name": "KODEX 200",               "qty": 1,           "avg_usd":   55.47,   "cat": "kr",
     "logo": "https://www.google.com/s2/favicons?sz=128&domain=kodex.com"},
    {"sym": "ETH-USD",   "name": "Ethereum",                "qty": 0.00565847,  "avg_usd": 2392.30,   "cat": "crypto",
     "logo": "https://coin-images.coingecko.com/coins/images/279/small/ethereum.png"},
    {"sym": "W-USD",     "name": "Wormhole",                "qty": 1541.64,     "avg_usd":    0.01314,"cat": "crypto",
     "logo": "https://coin-images.coingecko.com/coins/images/35087/small/W_Token_%283%29.png?1758122686"},
]

# Idle cash balances (already USD-converted at the time you last updated them).
CASH_USD = 168.47   # KRW 146,460 ≈ $99 + USD 69.27 sweep account

FX_SYMBOL = "KRW=X"  # USDKRW on Yahoo (how many KRW per 1 USD)

CATEGORY_LABELS = {
    "us":     "US Equities",
    "kr":     "KR Equities",
    "crypto": "Crypto",
}
CATEGORY_COLORS = {
    "us":     "#b45309",  # amber-700
    "kr":     "#0891b2",  # cyan-600
    "crypto": "#7c3aed",  # violet-600
    "cash":   "#78716c",  # stone-500
}


def fetch_chart(symbol: str) -> dict | None:
    """Pull a minimal chart payload — we only need meta.regularMarketPrice."""
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        f"?interval=1d&range=5d"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.load(resp)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"  [fail] {symbol}: {exc}", file=sys.stderr)
        return None


def latest_price(payload: dict | None) -> float | None:
    if not payload:
        return None
    try:
        result = payload["chart"]["result"][0]
        meta = result["meta"]
    except (KeyError, IndexError, TypeError):
        return None

    price = meta.get("regularMarketPrice")
    if price is None:
        # Fallback to the last non-null close in the series.
        try:
            closes = result["indicators"]["quote"][0].get("close") or []
            closes = [c for c in closes if c is not None]
            price = closes[-1] if closes else None
        except (KeyError, IndexError, TypeError):
            price = None
    return float(price) if price is not None else None


def fmt_usd(value: float, precise: bool = False) -> str:
    """
    Default: large (>=1000) as integer, everything else 2 decimals.
    precise=True: keep 4 decimals for sub-$1 tick sizes (e.g. Wormhole).
    """
    neg = value < 0
    v = abs(value)
    if precise and v < 1:
        body = f"${v:,.4f}"
    elif v >= 1000:
        body = f"${v:,.0f}"
    else:
        body = f"${v:,.2f}"
    return f"-{body}" if neg else body


def fmt_signed_usd(value: float) -> str:
    if value >= 0:
        return f"+{fmt_usd(value)}"
    return fmt_usd(value)  # already has the minus


def fmt_pct(value: float) -> str:
    if value >= 0:
        return f"+{value:.2f}%"
    return f"{value:.2f}%"


def main() -> int:
    # 1. Fetch USDKRW first — we need it for any KRW-denominated quote.
    fx_payload = fetch_chart(FX_SYMBOL)
    fx_rate = latest_price(fx_payload) or 1477.60  # fallback to last known
    time.sleep(0.2)

    # 2. Fetch each position quote.
    rows_by_cat: dict[str, list[dict]] = {"us": [], "kr": [], "crypto": []}
    invested_value_usd = 0.0
    invested_cost_usd = 0.0

    for pos in POSITIONS:
        payload = fetch_chart(pos["sym"])
        price = latest_price(payload)
        time.sleep(0.25)

        if price is None:
            print(f"  [skip] {pos['sym']} — no price", file=sys.stderr)
            continue

        # Convert the broker-quoted price into USD.
        if pos["cat"] == "kr":
            last_usd = price / fx_rate           # price quoted in KRW
        else:
            last_usd = price                     # USD native (US stocks / *-USD crypto)

        qty = pos["qty"]
        cost_usd = qty * pos["avg_usd"]
        value_usd = qty * last_usd
        pnl_usd = value_usd - cost_usd
        pnl_pct = (pnl_usd / cost_usd * 100.0) if cost_usd else 0.0

        invested_value_usd += value_usd
        invested_cost_usd += cost_usd

        rows_by_cat[pos["cat"]].append({
            "sym":       pos["sym"].split(".")[0].replace("-USD", ""),
            "yahoo_sym": pos["sym"],
            "name":      pos["name"],
            "qty":       qty,
            "avg":       round(pos["avg_usd"], 4),
            "last":      round(last_usd, 4),
            "pnl_pct":   round(pnl_pct, 2),
            "value":     round(value_usd, 2),
            "pnl":       round(pnl_usd, 2),
            "logo":      pos.get("logo", ""),
            "avg_display":     fmt_usd(pos["avg_usd"], precise=True),
            "last_display":    fmt_usd(last_usd, precise=True),
            "value_display":   fmt_usd(value_usd),
            "pnl_display":     fmt_signed_usd(pnl_usd),
            "pnl_pct_display": fmt_pct(pnl_pct),
        })

    # 3. Sort holdings biggest-value first within each bucket.
    for cat in rows_by_cat:
        rows_by_cat[cat].sort(key=lambda r: -r["value"])

    # 4. Summary & allocation.
    aum_usd = invested_value_usd + CASH_USD
    total_pnl_pct = (
        (invested_value_usd - invested_cost_usd) / invested_cost_usd * 100.0
        if invested_cost_usd else 0.0
    )

    allocation = []
    for cat in ("us", "kr", "crypto"):
        cat_val = sum(r["value"] for r in rows_by_cat[cat])
        if cat_val > 0:
            allocation.append({
                "label": CATEGORY_LABELS[cat],
                "value": round(cat_val, 2),
                "color": CATEGORY_COLORS[cat],
            })
    if CASH_USD > 0:
        allocation.append({
            "label": "Cash",
            "value": round(CASH_USD, 2),
            "color": CATEGORY_COLORS["cash"],
        })

    # Pre-compute percentages so the template doesn't have to do float math.
    for slice in allocation:
        pct = slice["value"] / aum_usd * 100.0 if aum_usd else 0.0
        slice["pct"] = round(pct, 1)
        slice["pct_display"] = f"{pct:.1f}%"
        slice["pct_int"] = int(round(pct))

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    out = {
        "updated":   now,
        "fx_usdkrw": round(fx_rate, 2),
        "summary": {
            "aum_usd":            round(aum_usd, 2),
            "invested_value_usd": round(invested_value_usd, 2),
            "invested_cost_usd":  round(invested_cost_usd, 2),
            "pnl_usd":            round(invested_value_usd - invested_cost_usd, 2),
            "pnl_pct":            round(total_pnl_pct, 2),
            "cash_usd":           round(CASH_USD, 2),
            "positions":          sum(len(v) for v in rows_by_cat.values()),
            "aum_display":       fmt_usd(aum_usd),
            "pnl_display":       fmt_signed_usd(invested_value_usd - invested_cost_usd),
            "pnl_pct_display":   fmt_pct(total_pnl_pct),
            "cash_display":      fmt_usd(CASH_USD),
        },
        "allocation": allocation,
        "holdings": {
            "us_equities": rows_by_cat["us"],
            "kr_equities": rows_by_cat["kr"],
            "crypto":      rows_by_cat["crypto"],
        },
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT_JSON} — AUM {out['summary']['aum_display']}, P&L {out['summary']['pnl_display']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
