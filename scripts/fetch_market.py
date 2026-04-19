"""
Fetch real-time market quotes from Yahoo Finance and write to
assets/data/ticker.json. Intended to run on a GitHub Actions cron.

Stdlib only — no external dependencies.
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
OUT = ROOT / "assets" / "data" / "ticker.json"
CANDLES_OUT = ROOT / "assets" / "data" / "kospi_candles.json"

# (display_symbol, yahoo_symbol, display_name)
TICKERS = [
    ("KOSPI",   "^KS11",    "KOSPI"),
    ("KOSDAQ",  "^KQ11",    "KOSDAQ"),
    ("S&P 500", "^GSPC",    "S&P 500"),
    ("NDX",     "^NDX",     "Nasdaq 100"),
    ("NQ1!",    "NQ=F",     "Nasdaq Futures"),
    ("WTI",     "CL=F",     "WTI Crude"),
    ("GOLD",    "GC=F",     "Gold"),
    ("BTC",     "BTC-USD",  "Bitcoin"),
    ("ETH",     "ETH-USD",  "Ethereum"),
    ("USDKRW",  "KRW=X",    "USD/KRW"),
    ("DXY",     "DX-Y.NYB", "Dollar Index"),
    ("VIX",     "^VIX",     "VIX"),
]

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


def fetch_quote(symbol: str) -> dict | None:
    """Hit the public Yahoo chart endpoint and pull the meta block."""
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        "?interval=1d&range=5d"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            payload = json.load(resp)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"  [fail] {symbol}: {exc}", file=sys.stderr)
        return None

    try:
        meta = payload["chart"]["result"][0]["meta"]
    except (KeyError, IndexError, TypeError):
        print(f"  [fail] {symbol}: unexpected payload shape", file=sys.stderr)
        return None

    price = meta.get("regularMarketPrice")
    prev = meta.get("chartPreviousClose") or meta.get("previousClose")
    if price is None or prev is None:
        return None

    change = price - prev
    pct = (change / prev) * 100 if prev else 0.0

    return {
        "price": round(float(price), 4),
        "previous_close": round(float(prev), 4),
        "change": round(float(change), 4),
        "change_pct": round(float(pct), 3),
        "currency": meta.get("currency"),
    }


def fetch_candles(symbol: str, interval: str = "1d", range_: str = "6mo") -> dict | None:
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        f"?interval={interval}&range={range_}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload = json.load(resp)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"  [fail] candles {symbol}: {exc}", file=sys.stderr)
        return None

    try:
        result = payload["chart"]["result"][0]
        ts = result["timestamp"]
        q = result["indicators"]["quote"][0]
        opens = q["open"]
        highs = q["high"]
        lows = q["low"]
        closes = q["close"]
        vols = q.get("volume", [None] * len(ts))
    except (KeyError, IndexError, TypeError):
        print(f"  [fail] candles {symbol}: unexpected shape", file=sys.stderr)
        return None

    candles = []
    for i, t in enumerate(ts):
        o, h, l, c = opens[i], highs[i], lows[i], closes[i]
        if None in (o, h, l, c):
            continue
        candles.append({
            "t": int(t),
            "o": round(float(o), 4),
            "h": round(float(h), 4),
            "l": round(float(l), 4),
            "c": round(float(c), 4),
            "v": int(vols[i]) if vols[i] is not None else None,
        })
    return {"symbol": symbol, "interval": interval, "range": range_, "candles": candles}


def format_price(value: float) -> str:
    if value >= 10_000:
        return f"{value:,.2f}"
    if value >= 100:
        return f"{value:,.2f}"
    if value >= 1:
        return f"{value:,.3f}"
    return f"{value:,.4f}"


def main() -> int:
    items: list[dict] = []
    successes = 0

    for display_symbol, yahoo_symbol, display_name in TICKERS:
        print(f"-> {display_symbol} ({yahoo_symbol})")
        quote = fetch_quote(yahoo_symbol)
        if quote is None:
            # Keep a placeholder so the UI doesn't lose the slot entirely.
            items.append({
                "symbol": display_symbol,
                "name": display_name,
                "error": True,
            })
            continue

        successes += 1
        items.append({
            "symbol": display_symbol,
            "name": display_name,
            "price": quote["price"],
            "price_display": format_price(quote["price"]),
            "change": quote["change"],
            "change_pct": quote["change_pct"],
            "direction": "up" if quote["change"] >= 0 else "down",
            "currency": quote["currency"],
        })
        time.sleep(0.25)  # be polite to Yahoo's edge

    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Yahoo Finance",
        "items": items,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[ok] wrote {OUT} ({successes}/{len(TICKERS)} quotes)")

    # Also refresh the KOSPI daily candles used by the landing-page chart.
    print("-> KOSPI candles (^KS11, 6mo daily)")
    candles = fetch_candles("^KS11", interval="1d", range_="6mo")
    if candles is not None and candles["candles"]:
        candles["updated_at"] = datetime.now(timezone.utc).isoformat()
        CANDLES_OUT.write_text(
            json.dumps(candles, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"[ok] wrote {CANDLES_OUT} ({len(candles['candles'])} bars)")
    else:
        print("[warn] candles skipped (fetch failed)", file=sys.stderr)

    # Only fail the job if everything flopped — single-symbol hiccups are fine.
    return 0 if successes > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
