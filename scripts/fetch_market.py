"""
Fetch a rich multi-category market snapshot from Yahoo Finance and write:

  assets/data/ticker.json        - the scrolling ticker (headline symbols)
  assets/data/markets.json       - full dashboard: indices, sectors, yields,
                                   FX, commodities, crypto, with 30d sparklines
                                   and a derived Fear & Greed proxy
  assets/data/kospi_candles.json - 6mo daily OHLC for the KOSPI candlestick

Stdlib only — runs clean on a fresh GitHub Actions Python container.
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
DATA_DIR = ROOT / "assets" / "data"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

# Categories: each item is (label, yahoo_symbol). Order is presentation order.
CATEGORIES: dict[str, list[tuple[str, str]]] = {
    "headline": [
        ("KOSPI",   "^KS11"),
        ("KOSDAQ",  "^KQ11"),
        ("S&P 500", "^GSPC"),
        ("NDX",     "^NDX"),
        ("NQ1!",    "NQ=F"),
        ("WTI",     "CL=F"),
        ("GOLD",    "GC=F"),
        ("BTC",     "BTC-USD"),
        ("ETH",     "ETH-USD"),
        ("USDKRW",  "KRW=X"),
        ("DXY",     "DX-Y.NYB"),
        ("VIX",     "^VIX"),
    ],
    "global_indices": [
        ("KOSPI",      "^KS11"),
        ("Nikkei 225", "^N225"),
        ("Hang Seng",  "^HSI"),
        ("Shanghai",   "000001.SS"),
        ("S&P 500",    "^GSPC"),
        ("Nasdaq 100", "^NDX"),
        ("Dow",        "^DJI"),
        ("FTSE 100",   "^FTSE"),
        ("DAX",        "^GDAXI"),
        ("CAC 40",     "^FCHI"),
        ("STOXX 50",   "^STOXX50E"),
        ("Sensex",     "^BSESN"),
    ],
    "sectors_us": [
        ("Technology",       "XLK"),
        ("Communication",    "XLC"),
        ("Consumer Disc.",   "XLY"),
        ("Consumer Staples", "XLP"),
        ("Health Care",      "XLV"),
        ("Financials",       "XLF"),
        ("Industrials",      "XLI"),
        ("Energy",           "XLE"),
        ("Utilities",        "XLU"),
        ("Real Estate",      "XLRE"),
        ("Materials",        "XLB"),
    ],
    "yields_us": [
        ("3M", "^IRX"),
        ("5Y", "^FVX"),
        ("10Y", "^TNX"),
        ("30Y", "^TYX"),
    ],
    "commodities": [
        ("Crude WTI",  "CL=F"),
        ("Brent",      "BZ=F"),
        ("NatGas",     "NG=F"),
        ("Gold",       "GC=F"),
        ("Silver",     "SI=F"),
        ("Copper",     "HG=F"),
        ("Corn",       "ZC=F"),
        ("Wheat",      "ZW=F"),
    ],
    "fx": [
        ("EURUSD", "EURUSD=X"),
        ("GBPUSD", "GBPUSD=X"),
        ("USDJPY", "JPY=X"),
        ("USDCNY", "CNY=X"),
        ("USDKRW", "KRW=X"),
        ("AUDUSD", "AUDUSD=X"),
        ("USDCAD", "CAD=X"),
        ("USDCHF", "CHF=X"),
    ],
    "crypto": [
        ("Bitcoin",   "BTC-USD"),
        ("Ethereum",  "ETH-USD"),
        ("Solana",    "SOL-USD"),
        ("BNB",       "BNB-USD"),
        ("XRP",       "XRP-USD"),
        ("Dogecoin",  "DOGE-USD"),
    ],
}


def fetch_chart(symbol: str, interval: str, range_: str) -> dict | None:
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        f"?interval={interval}&range={range_}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.load(resp)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"  [fail] {symbol}: {exc}", file=sys.stderr)
        return None


def parse_snapshot(payload: dict) -> dict | None:
    """Pull latest price, 1-day change, and ~22d sparkline closes."""
    try:
        result = payload["chart"]["result"][0]
        meta = result["meta"]
    except (KeyError, IndexError, TypeError):
        return None

    closes: list[float] = []
    try:
        raw = result["indicators"]["quote"][0].get("close") or []
        closes = [float(c) for c in raw if c is not None]
    except (KeyError, IndexError, TypeError):
        closes = []

    price = meta.get("regularMarketPrice")
    if price is None and closes:
        price = closes[-1]

    # Prefer the prior trading day's close from the time series (1-day change),
    # not chartPreviousClose which refers to the close before the whole range.
    if len(closes) >= 2:
        prev = closes[-2]
    else:
        prev = meta.get("previousClose") or meta.get("chartPreviousClose")

    if price is None or prev is None:
        return None

    sparkline = closes[-22:]
    change = price - prev
    pct = (change / prev) * 100 if prev else 0.0

    return {
        "price": round(float(price), 4),
        "previous_close": round(float(prev), 4),
        "change": round(float(change), 4),
        "change_pct": round(float(pct), 3),
        "currency": meta.get("currency"),
        "sparkline": [round(c, 4) for c in sparkline],
    }


def format_price(value: float) -> str:
    if value >= 1000:
        return f"{value:,.2f}"
    if value >= 100:
        return f"{value:,.2f}"
    if value >= 1:
        return f"{value:,.4f}"
    return f"{value:,.6f}"


def parse_candles(payload: dict) -> dict | None:
    try:
        result = payload["chart"]["result"][0]
        ts = result["timestamp"]
        q = result["indicators"]["quote"][0]
        opens, highs, lows, closes = q["open"], q["high"], q["low"], q["close"]
        vols = q.get("volume", [None] * len(ts))
    except (KeyError, IndexError, TypeError):
        return None

    out = []
    for i, t in enumerate(ts):
        o, h, l, c = opens[i], highs[i], lows[i], closes[i]
        if None in (o, h, l, c):
            continue
        out.append({
            "t": int(t),
            "o": round(float(o), 4),
            "h": round(float(h), 4),
            "l": round(float(l), 4),
            "c": round(float(c), 4),
            "v": int(vols[i]) if vols[i] is not None else None,
        })
    return out


def fear_greed(vix: float | None, spx_snapshot: dict | None) -> tuple[int, str]:
    """
    Crude Fear & Greed proxy (0=extreme fear, 100=extreme greed).
    Weighted average of:
      - inverted VIX band (10..40 mapped to 100..0)
      - SPX momentum vs 22-day mean (bounded ±5% → 0..100)
    """
    pieces: list[float] = []
    if vix is not None:
        v = max(10.0, min(40.0, vix))
        pieces.append((40.0 - v) / 30.0 * 100.0)
    if spx_snapshot and spx_snapshot.get("sparkline"):
        closes = spx_snapshot["sparkline"]
        last = closes[-1]
        mean = sum(closes) / len(closes)
        momentum = (last - mean) / mean * 100.0
        # Map [-5%, +5%] to [0, 100]
        m = max(-5.0, min(5.0, momentum))
        pieces.append((m + 5.0) / 10.0 * 100.0)

    if not pieces:
        return 50, "Neutral"

    score = sum(pieces) / len(pieces)
    score = max(0, min(100, int(round(score))))

    if score >= 75:
        label = "Extreme Greed"
    elif score >= 55:
        label = "Greed"
    elif score >= 45:
        label = "Neutral"
    elif score >= 25:
        label = "Fear"
    else:
        label = "Extreme Fear"
    return score, label


def main() -> int:
    # Collect the full universe of unique Yahoo symbols to avoid duplicate calls.
    universe: dict[str, list[tuple[str, str]]] = {}
    for cat, items in CATEGORIES.items():
        for label, sym in items:
            universe.setdefault(sym, []).append((cat, label))

    cache: dict[str, dict] = {}
    for i, sym in enumerate(sorted(universe.keys())):
        print(f"-> [{i+1:>2}/{len(universe)}] {sym}")
        payload = fetch_chart(sym, interval="1d", range_="1mo")
        if payload is None:
            continue
        snap = parse_snapshot(payload)
        if snap is None:
            continue
        cache[sym] = snap
        time.sleep(0.2)

    # Build categorized output preserving the CATEGORIES order.
    data_out: dict[str, list[dict]] = {}
    for cat, items in CATEGORIES.items():
        rows = []
        for label, sym in items:
            snap = cache.get(sym)
            if snap is None:
                rows.append({"label": label, "symbol": sym, "error": True})
                continue
            rows.append({
                "label": label,
                "symbol": sym,
                "price": snap["price"],
                "price_display": format_price(snap["price"]),
                "change": snap["change"],
                "change_pct": snap["change_pct"],
                "direction": "up" if snap["change"] >= 0 else "down",
                "currency": snap.get("currency"),
                "sparkline": snap.get("sparkline", []),
            })
        data_out[cat] = rows

    # Derived metrics
    vix_snap = cache.get("^VIX")
    spx_snap = cache.get("^GSPC")
    fg_score, fg_label = fear_greed(
        vix_snap["price"] if vix_snap else None,
        spx_snap,
    )

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # --- ticker.json (backwards compatible shape) ---
    ticker_items = []
    for row in data_out.get("headline", []):
        if row.get("error"):
            ticker_items.append({"symbol": row["label"], "name": row["label"], "error": True})
            continue
        ticker_items.append({
            "symbol": row["label"],
            "name": row["label"],
            "price": row["price"],
            "price_display": row["price_display"],
            "change": row["change"],
            "change_pct": row["change_pct"],
            "direction": row["direction"],
            "currency": row.get("currency"),
            "sparkline": row.get("sparkline", []),
        })

    ticker_doc = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Yahoo Finance",
        "items": ticker_items,
    }
    (DATA_DIR / "ticker.json").write_text(
        json.dumps(ticker_doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[ok] wrote ticker.json ({len([i for i in ticker_items if not i.get('error')])} quotes)")

    # --- markets.json (full dashboard) ---
    markets_doc = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Yahoo Finance",
        "sparkline_bars": 22,
        "data": data_out,
        "derived": {
            "fear_greed": fg_score,
            "fear_greed_label": fg_label,
            "vix": vix_snap["price"] if vix_snap else None,
        },
    }
    (DATA_DIR / "markets.json").write_text(
        json.dumps(markets_doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total_rows = sum(len(v) for v in data_out.values())
    print(f"[ok] wrote markets.json ({total_rows} rows across {len(data_out)} categories, F&G {fg_score} {fg_label})")

    # --- kospi candles ---
    print("-> KOSPI candles (^KS11, 6mo daily)")
    kospi_payload = fetch_chart("^KS11", interval="1d", range_="6mo")
    if kospi_payload is not None:
        candles = parse_candles(kospi_payload)
        if candles:
            (DATA_DIR / "kospi_candles.json").write_text(
                json.dumps({
                    "symbol": "^KS11",
                    "interval": "1d",
                    "range": "6mo",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "candles": candles,
                }, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            print(f"[ok] wrote kospi_candles.json ({len(candles)} bars)")

    return 0 if cache else 1


if __name__ == "__main__":
    sys.exit(main())
