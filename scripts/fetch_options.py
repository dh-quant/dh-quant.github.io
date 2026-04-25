"""
fetch_options.py — Yahoo Finance options chain → desk-grade analytics.

For each tracked ticker:
  - Pull spot + full options chain across all expiries
  - Pull 1Y daily closes for realized vol
  - Compute BS Greeks per contract (calls + puts)
  - Aggregate by strike: GEX, VEX (vanna), CEX (charm), DEX, OI/volume
  - Aggregate by expiry: ATM IV, 25Δ put-call skew, ATM straddle / implied move
  - Compute summary signals:
      * ATM-IV-30d (linearly interpolated to 30 days)
      * realized vol 30d, VRP = IV − RV
      * 25Δ skew at 30d
      * term-structure slope (60d ATM IV − 7d ATM IV)
      * net GEX, zero-gamma flip strike, pin candidate, max pain (0DTE)
      * put/call OI + volume ratios
      * IV history percentile (from rolling history file)
  - Generate practitioner-style conclusions (gamma-flip regime, vol cheap/rich,
    skew steep/flat, pin candidates, dispersion, term-structure flips).

Outputs:
  _data/options/snapshot.json       # all tickers, current snapshot
  _data/options/iv_history.json     # rolling per-ticker IV/skew/VRP series
"""
from __future__ import annotations

import http.cookiejar
import json
import math
import pathlib
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from options_math import (  # noqa: E402
    bs_greeks, interp_at, percentile_of, realized_vol,
)

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "_data" / "options"
OUT_DIR.mkdir(parents=True, exist_ok=True)
SNAPSHOT_PATH = OUT_DIR / "snapshot.json"
IVHIST_PATH = OUT_DIR / "iv_history.json"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

NOW = datetime.now(timezone.utc)

# Risk-free rate assumption — short T-bill yield. Used for BS Greeks. The
# Greeks themselves are not very sensitive to small r changes; this matters
# more for theta and tail values. Hardcode for portability.
RISK_FREE = 0.045

# Tickers in priority order (first one is the page's default flagship)
TICKERS = [
    ("SPY", "S&P 500 ETF"),
    ("QQQ", "Nasdaq 100 ETF"),
    ("IWM", "Russell 2000 ETF"),
    ("NVDA", "NVIDIA"),
    ("TSLA", "Tesla"),
    ("AAPL", "Apple"),
    ("MSFT", "Microsoft"),
]

YH_CHAIN = "https://query1.finance.yahoo.com/v7/finance/options/{sym}"
YH_HIST = "https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&range=1y"

# Yahoo Finance now requires cookie-based crumb auth for many endpoints.
# We grab a session cookie + crumb on first call and reuse for the run.
_OPENER: urllib.request.OpenerDirector | None = None
_CRUMB: str = ""


def _build_opener() -> urllib.request.OpenerDirector:
    """Build a urllib opener with a CookieJar so Yahoo session cookies stick."""
    global _OPENER, _CRUMB
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    opener.addheaders = [
        ("User-Agent", USER_AGENT),
        ("Accept", "application/json,text/plain,*/*"),
        ("Accept-Language", "en-US,en;q=0.9"),
    ]
    # Trigger consent + cookie set
    try:
        opener.open("https://fc.yahoo.com/", timeout=8.0).read()
    except Exception:
        pass  # often returns non-200 but still sets cookies
    try:
        opener.open("https://finance.yahoo.com/", timeout=8.0).read(2048)
    except Exception:
        pass
    # Fetch crumb (needed for v7/options endpoint)
    try:
        with opener.open("https://query2.finance.yahoo.com/v1/test/getcrumb", timeout=8.0) as r:
            _CRUMB = r.read().decode("utf-8").strip()
    except Exception as e:
        _log(f"crumb fetch failed: {e}")
        _CRUMB = ""
    _OPENER = opener
    return opener


def _log(msg: str) -> None:
    print(f"[options] {msg}", file=sys.stderr, flush=True)


def _get_json(url: str, timeout: float = 12.0, attach_crumb: bool = True) -> dict:
    global _OPENER
    if _OPENER is None:
        _build_opener()
    if attach_crumb and _CRUMB and "crumb=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}crumb={urllib.parse.quote(_CRUMB)}"
    with _OPENER.open(url, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


# ---------------------------------------------------------------------------
# Yahoo fetchers
# ---------------------------------------------------------------------------
def fetch_chain_all(sym: str) -> dict | None:
    """Fetch full chain across all expiries. Returns dict with spot + per-expiry
    contract arrays."""
    try:
        first = _get_json(YH_CHAIN.format(sym=sym))
    except Exception as e:
        _log(f"{sym} chain root failed: {e}")
        return None
    res = (first.get("optionChain") or {}).get("result") or []
    if not res:
        return None
    r0 = res[0]
    quote = r0.get("quote") or {}
    spot = quote.get("regularMarketPrice")
    if not spot:
        return None
    expiries = r0.get("expirationDates") or []
    chain_by_expiry: list[dict] = []
    # First expiry already in r0.options[0]; fetch the rest individually
    if r0.get("options"):
        chain_by_expiry.append(r0["options"][0])
    for ts in expiries[1:]:
        url = YH_CHAIN.format(sym=sym) + f"?date={ts}"
        try:
            d = _get_json(url)
            opts = ((d.get("optionChain") or {}).get("result") or [{}])[0].get("options") or []
            if opts:
                chain_by_expiry.append(opts[0])
            time.sleep(0.25)  # be polite
        except Exception as e:
            _log(f"{sym} expiry {ts} failed: {e}")
            continue
    return {"spot": float(spot), "expiries": expiries, "chains": chain_by_expiry}


def fetch_history(sym: str) -> list[float]:
    try:
        d = _get_json(YH_HIST.format(sym=sym))
    except Exception as e:
        _log(f"{sym} history failed: {e}")
        return []
    res = (d.get("chart") or {}).get("result") or []
    if not res:
        return []
    quotes = ((res[0].get("indicators") or {}).get("quote") or [{}])[0]
    closes = quotes.get("close") or []
    return [c for c in closes if c is not None]


# ---------------------------------------------------------------------------
# Per-contract math
# ---------------------------------------------------------------------------
def _flatten(chain: dict, spot: float, expiry_ts: int) -> list[dict]:
    """Convert one expiry's calls+puts into a list of clean contract dicts."""
    out: list[dict] = []
    expiry_dt = datetime.fromtimestamp(expiry_ts, tz=timezone.utc)
    T = max(0.5 / 365.0, (expiry_dt - NOW).total_seconds() / (365.0 * 86400))
    for side, is_call in (("calls", True), ("puts", False)):
        for c in chain.get(side, []) or []:
            iv = c.get("impliedVolatility")
            strike = c.get("strike")
            if not strike or not iv or iv <= 0 or iv > 5.0:
                continue
            oi = int(c.get("openInterest") or 0)
            vol = int(c.get("volume") or 0)
            bid = c.get("bid") or 0.0
            ask = c.get("ask") or 0.0
            last = c.get("lastPrice") or 0.0
            mid = (bid + ask) / 2 if (bid > 0 and ask > 0) else last
            out.append({
                "K": float(strike),
                "T": float(T),
                "iv": float(iv),
                "is_call": is_call,
                "oi": oi,
                "vol": vol,
                "mid": float(mid),
                "expiry": expiry_dt.strftime("%Y-%m-%d"),
                "expiry_ts": int(expiry_ts),
            })
    return out


def annotate_greeks(contracts: list[dict], spot: float) -> None:
    """Mutate contracts in-place to add Greeks + dealer exposures."""
    if not contracts:
        return
    K = np.array([c["K"] for c in contracts])
    T = np.array([c["T"] for c in contracts])
    sigma = np.array([c["iv"] for c in contracts])
    is_call = np.array([c["is_call"] for c in contracts])
    g = bs_greeks(spot, K, T, RISK_FREE, sigma, is_call)
    for i, c in enumerate(contracts):
        c["delta"] = float(g["delta"][i])
        c["gamma"] = float(g["gamma"][i])
        c["vega"] = float(g["vega"][i])
        c["theta"] = float(g["theta"][i])
        c["vanna"] = float(g["vanna"][i])
        c["charm"] = float(g["charm"][i])
        # Dealer-positioning exposures (sign convention: dealers long calls,
        # short puts — positive GEX = stabilizing)
        sign = 1.0 if c["is_call"] else -1.0
        c["gex"] = sign * c["gamma"] * c["oi"] * 100 * spot * spot * 0.01
        c["vex"] = sign * c["vanna"] * c["oi"] * 100 * spot * c["iv"] * 100  # vol-points
        c["cex"] = sign * c["charm"] * c["oi"] * 100 * spot
        c["dex"] = sign * c["delta"] * c["oi"] * 100 * spot


# ---------------------------------------------------------------------------
# Aggregations
# ---------------------------------------------------------------------------
def aggregate_by_strike(contracts: list[dict], spot: float) -> list[dict]:
    """Return list of {strike, gex, vex, cex, dex, call_oi, put_oi, call_vol, put_vol}.
    Restricted to strikes within ±25% of spot."""
    by_strike: dict[float, dict] = {}
    lo = spot * 0.75
    hi = spot * 1.25
    for c in contracts:
        K = c["K"]
        if K < lo or K > hi:
            continue
        b = by_strike.setdefault(K, {
            "strike": K, "gex": 0.0, "vex": 0.0, "cex": 0.0, "dex": 0.0,
            "call_oi": 0, "put_oi": 0, "call_vol": 0, "put_vol": 0,
        })
        b["gex"] += c["gex"]
        b["vex"] += c["vex"]
        b["cex"] += c["cex"]
        b["dex"] += c["dex"]
        if c["is_call"]:
            b["call_oi"] += c["oi"]
            b["call_vol"] += c["vol"]
        else:
            b["put_oi"] += c["oi"]
            b["put_vol"] += c["vol"]
    rows = sorted(by_strike.values(), key=lambda r: r["strike"])
    for r in rows:
        # round for compactness
        for k in ("gex", "vex", "cex", "dex"):
            r[k] = round(r[k], 2)
    return rows


def fixed_delta_iv(side_contracts: list[dict], target_abs_delta: float) -> float:
    """Linearly interpolate IV at |delta|=target across a single side
    (calls or puts) within one expiry. Returns NaN if not enough points."""
    if not side_contracts:
        return float("nan")
    # sort by absolute delta
    pts = sorted([(abs(c["delta"]), c["iv"]) for c in side_contracts], key=lambda x: x[0])
    deltas = np.array([p[0] for p in pts])
    ivs = np.array([p[1] for p in pts])
    return interp_at(deltas, ivs, target_abs_delta)


def aggregate_by_expiry(contracts: list[dict], spot: float) -> list[dict]:
    """Per-expiry summary: ATM IV, 25Δ skew, straddle, implied move."""
    by_exp: dict[str, list[dict]] = {}
    for c in contracts:
        by_exp.setdefault(c["expiry"], []).append(c)
    rows: list[dict] = []
    for expiry, cts in sorted(by_exp.items()):
        T = cts[0]["T"]
        dte = max(0, (datetime.fromtimestamp(cts[0]["expiry_ts"], tz=timezone.utc).date() - NOW.date()).days)

        calls = [c for c in cts if c["is_call"]]
        puts = [c for c in cts if not c["is_call"]]

        # ATM IV: average of nearest-strike call+put
        all_strikes = sorted({c["K"] for c in cts})
        if not all_strikes:
            continue
        atm_K = min(all_strikes, key=lambda k: abs(k - spot))
        atm_calls = [c for c in calls if c["K"] == atm_K]
        atm_puts = [c for c in puts if c["K"] == atm_K]
        atm_iv_vals = [c["iv"] for c in atm_calls] + [c["iv"] for c in atm_puts]
        atm_iv = float(np.mean(atm_iv_vals)) if atm_iv_vals else float("nan")

        # 25Δ put-call skew
        iv_25c = fixed_delta_iv(calls, 0.25)
        iv_25p = fixed_delta_iv(puts, 0.25)
        skew_25 = (iv_25p - iv_25c) if (math.isfinite(iv_25p) and math.isfinite(iv_25c)) else float("nan")

        # ATM straddle premium → implied move %
        straddle = 0.0
        if atm_calls and atm_puts:
            straddle = (atm_calls[0]["mid"] + atm_puts[0]["mid"])
        implied_move_pct = (straddle / spot) if (straddle > 0 and spot > 0) else float("nan")

        rows.append({
            "expiry": expiry,
            "dte": dte,
            "T": round(T, 5),
            "atm_strike": atm_K,
            "atm_iv": round(atm_iv, 4) if math.isfinite(atm_iv) else None,
            "iv_25c": round(iv_25c, 4) if math.isfinite(iv_25c) else None,
            "iv_25p": round(iv_25p, 4) if math.isfinite(iv_25p) else None,
            "skew_25": round(skew_25, 4) if math.isfinite(skew_25) else None,
            "straddle": round(straddle, 2),
            "implied_move_pct": round(implied_move_pct, 4) if math.isfinite(implied_move_pct) else None,
        })
    return rows


def vol_surface_grid(by_expiry: list[dict], contracts: list[dict], spot: float) -> dict:
    """Build a moneyness × expiry IV heatmap. Moneyness = K/S. For each expiry
    interpolate IV at the moneyness grid points using available strikes."""
    if not by_expiry:
        return {}
    moneyness = [0.90, 0.95, 0.97, 0.99, 1.00, 1.01, 1.03, 1.05, 1.10]
    expiries = [e["expiry"] for e in by_expiry[:8]]  # first 8 expiries
    # Build IV grid
    by_exp_contracts: dict[str, list[dict]] = {}
    for c in contracts:
        by_exp_contracts.setdefault(c["expiry"], []).append(c)
    grid: list[list[float | None]] = []
    for exp in expiries:
        row: list[float | None] = []
        cts = by_exp_contracts.get(exp, [])
        # Use combined call+put IVs sorted by moneyness (use OTM side)
        pts = []
        for c in cts:
            m = c["K"] / spot
            # Use OTM side: puts for m<1, calls for m>=1
            if (c["is_call"] and m >= 1) or ((not c["is_call"]) and m < 1):
                pts.append((m, c["iv"]))
        pts.sort()
        if len(pts) < 2:
            row = [None] * len(moneyness)
        else:
            xs = np.array([p[0] for p in pts])
            ys = np.array([p[1] for p in pts])
            for m_target in moneyness:
                if m_target < xs[0] or m_target > xs[-1]:
                    row.append(None)
                else:
                    row.append(round(float(np.interp(m_target, xs, ys)), 4))
        grid.append(row)
    return {"moneyness": moneyness, "expiries": expiries, "iv": grid}


# ---------------------------------------------------------------------------
# Summary signal computation
# ---------------------------------------------------------------------------
def interp_30d_atm(by_expiry: list[dict]) -> float:
    pts = [(e["dte"], e["atm_iv"]) for e in by_expiry if e["atm_iv"] is not None]
    if not pts:
        return float("nan")
    pts.sort()
    xs = np.array([p[0] for p in pts])
    ys = np.array([p[1] for p in pts])
    return interp_at(xs, ys, 30.0)


def interp_30d_skew(by_expiry: list[dict]) -> float:
    pts = [(e["dte"], e["skew_25"]) for e in by_expiry if e["skew_25"] is not None]
    if not pts:
        return float("nan")
    pts.sort()
    xs = np.array([p[0] for p in pts])
    ys = np.array([p[1] for p in pts])
    return interp_at(xs, ys, 30.0)


def zero_gamma_flip(by_strike: list[dict], spot: float) -> float:
    """Strike where cumulative GEX (sorted by strike, rolling sum) crosses zero.
    Searches near spot first."""
    if not by_strike:
        return float("nan")
    # cumulative sum of GEX from low strike up
    cum = 0.0
    cums: list[tuple[float, float]] = []
    for r in sorted(by_strike, key=lambda x: x["strike"]):
        cum += r["gex"]
        cums.append((r["strike"], cum))
    # find sign change
    for i in range(1, len(cums)):
        a_K, a_v = cums[i - 1]
        b_K, b_v = cums[i]
        if a_v == 0:
            return float(a_K)
        if (a_v < 0) != (b_v < 0):
            # linear interp
            if b_v == a_v:
                return float(b_K)
            t = -a_v / (b_v - a_v)
            return float(a_K + t * (b_K - a_K))
    return float("nan")


def max_pain(contracts: list[dict], expiry: str) -> float:
    """Max pain strike for a single expiry."""
    cts = [c for c in contracts if c["expiry"] == expiry]
    if not cts:
        return float("nan")
    strikes = sorted({c["K"] for c in cts})
    if not strikes:
        return float("nan")
    best_K = strikes[0]
    best_payout = math.inf
    for K_test in strikes:
        payout = 0.0
        for c in cts:
            if c["is_call"]:
                payout += max(0.0, K_test - c["K"]) * c["oi"] * 100
            else:
                payout += max(0.0, c["K"] - K_test) * c["oi"] * 100
        if payout < best_payout:
            best_payout = payout
            best_K = K_test
    return float(best_K)


def pin_candidate(by_strike: list[dict], spot: float) -> dict:
    """Return the strike with the largest |GEX| within ±2% of spot."""
    near = [r for r in by_strike if abs(r["strike"] - spot) / spot <= 0.02]
    if not near:
        return {}
    top = max(near, key=lambda r: abs(r["gex"]))
    return {"strike": float(top["strike"]), "gex": float(top["gex"])}


# ---------------------------------------------------------------------------
# IV history
# ---------------------------------------------------------------------------
def load_iv_history() -> dict:
    if IVHIST_PATH.exists():
        try:
            return json.loads(IVHIST_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def update_iv_history(history: dict, sym: str, iv30: float, skew30: float, vrp: float) -> None:
    series = history.setdefault(sym, [])
    series.append({
        "t": NOW.isoformat(),
        "iv30": round(iv30, 4) if math.isfinite(iv30) else None,
        "skew30": round(skew30, 4) if math.isfinite(skew30) else None,
        "vrp": round(vrp, 4) if math.isfinite(vrp) else None,
    })
    cutoff = (NOW - timedelta(days=400)).isoformat()
    history[sym] = [pt for pt in series if pt["t"] >= cutoff][-2000:]


# ---------------------------------------------------------------------------
# Conclusions — practitioner-style headlines
# ---------------------------------------------------------------------------
def make_conclusions(sym: str, summary: dict, by_strike: list[dict], by_expiry: list[dict]) -> list[dict]:
    out: list[dict] = []

    def push(text, tone="info", icon="•"):
        out.append({"text": text, "tone": tone, "icon": icon})

    spot = summary["spot"]
    flip = summary.get("zero_gamma_flip")
    net_gex = summary.get("net_gex")

    # 1. GEX regime
    if net_gex is not None:
        if net_gex > 0:
            push(
                f"Net GEX {net_gex/1e9:+.2f}B → 안정 레짐 (딜러 dip 매수, rip 매도)",
                tone="info", icon="🟢",
            )
        else:
            push(
                f"Net GEX {net_gex/1e9:+.2f}B → 변동성 확대 레짐 (딜러 모멘텀 추격)",
                tone="warn", icon="🔴",
            )
    if flip is not None and math.isfinite(flip):
        rel = (flip - spot) / spot * 100
        side = "위로 뚫으면 안정성 강화" if rel > 0 else "아래로 깨지면 변동성 점화"
        push(
            f"제로감마 플립 {flip:.2f} (spot 대비 {rel:+.2f}%) — {side}",
            tone="warn" if abs(rel) < 1.5 else "info", icon="⚡",
        )

    # 2. Pin candidate
    pin = summary.get("pin_candidate") or {}
    if pin and pin.get("strike"):
        rel = (pin["strike"] - spot) / spot * 100
        gex_b = pin["gex"] / 1e9
        push(
            f"핀 후보 {pin['strike']:.2f} ({rel:+.2f}%) · GEX {gex_b:+.2f}B — 만기 임박 시 이쪽으로 끌림",
            tone="info", icon="📌",
        )

    # 3. Vol regime — IV percentile + VRP
    pct = summary.get("iv_pct_history")
    vrp = summary.get("vrp_30d")
    if pct is not None:
        if pct >= 0.8:
            push(f"IV 30D {pct*100:.0f}%ile (비싸다) — 단기 vol 매도 (cov call/put-write) 매력",
                 tone="info", icon="📉")
        elif pct <= 0.2:
            push(f"IV 30D {pct*100:.0f}%ile (싸다) — long premium / 캘린더 매수 매력",
                 tone="info", icon="📈")
    if vrp is not None and math.isfinite(vrp):
        if vrp > 0.05:
            push(f"VRP {vrp*100:.1f}vol pts — IV가 실현보다 두툼, 시스템적 short-vol edge",
                 tone="info", icon="✚")
        elif vrp < 0:
            push(f"VRP {vrp*100:.1f}vol pts (음수) — 실현이 IV 추월, 변동성 매수 우위",
                 tone="warn", icon="✚")

    # 4. Skew (25Δ put − call)
    skew = summary.get("skew_25_30d")
    if skew is not None and math.isfinite(skew):
        if skew >= 0.07:
            push(f"25Δ put-call skew {skew*100:.1f}vol (가파름) — 다운사이드 헷지 수요 강함, 역발상 long 가능",
                 tone="info", icon="⤵")
        elif skew <= 0.02:
            push(f"25Δ skew {skew*100:.1f}vol (납작) — 컴플레이슨시, 헷지 매수 매력",
                 tone="warn", icon="⤴")

    # 5. Term structure
    ts = summary.get("term_state")
    slope = summary.get("term_slope")
    if ts and slope is not None:
        if ts == "backwardation":
            push(f"Term 백워데이션 (단기>장기, slope {slope*100:+.1f}vol) — 스트레스 신호, 평균회귀 후보",
                 tone="warn", icon="↘")
        elif ts == "contango":
            if slope > 0.03:
                push(f"Term 콘탱고 가파름 (slope {slope*100:+.1f}vol) — 캘린더 spread 매력",
                     tone="info", icon="↗")

    # 6. Put/Call ratio
    pcr = summary.get("pcr_oi")
    if pcr is not None:
        if pcr >= 1.4:
            push(f"P/C OI {pcr:.2f} (높음) — 헷지 과다, 역발상 long 가능", tone="info", icon="🛡")
        elif pcr <= 0.7:
            push(f"P/C OI {pcr:.2f} (낮음) — 헷지 부재, 다운사이드 무방비", tone="warn", icon="🚨")

    # 7. 0DTE pin / max pain
    if by_expiry:
        nearest = by_expiry[0]
        if nearest["dte"] <= 1:
            mp = summary.get("max_pain_0dte")
            if mp is not None:
                rel = (mp - spot) / spot * 100
                push(f"오늘 만기 max-pain {mp:.2f} ({rel:+.2f}%) — 종가 끌림 후보",
                     tone="info", icon="🎯")

    return out[:8]


# ---------------------------------------------------------------------------
# Per-ticker driver
# ---------------------------------------------------------------------------
def process_ticker(sym: str, name: str, iv_history: dict) -> dict | None:
    chain = fetch_chain_all(sym)
    if not chain:
        return None
    spot = chain["spot"]
    closes = fetch_history(sym)
    rv30 = realized_vol(closes, 30)

    # Flatten contracts
    contracts: list[dict] = []
    for ts, ch in zip(chain["expiries"], chain["chains"]):
        contracts.extend(_flatten(ch, spot, ts))
    if not contracts:
        _log(f"{sym}: no usable contracts")
        return None
    annotate_greeks(contracts, spot)

    by_strike = aggregate_by_strike(contracts, spot)
    by_expiry = aggregate_by_expiry(contracts, spot)

    # 30d-interpolated metrics
    atm_iv30 = interp_30d_atm(by_expiry)
    skew30 = interp_30d_skew(by_expiry)
    vrp = atm_iv30 - rv30 if (math.isfinite(atm_iv30) and math.isfinite(rv30)) else float("nan")

    # term-structure: ATM IV at 7d vs 60d
    pts = [(e["dte"], e["atm_iv"]) for e in by_expiry if e["atm_iv"] is not None]
    pts.sort()
    iv7 = interp_at(np.array([p[0] for p in pts]), np.array([p[1] for p in pts]), 7.0) if pts else float("nan")
    iv60 = interp_at(np.array([p[0] for p in pts]), np.array([p[1] for p in pts]), 60.0) if pts else float("nan")
    term_slope = (iv60 - iv7) if (math.isfinite(iv7) and math.isfinite(iv60)) else float("nan")
    term_state = "contango" if term_slope > 0 else "backwardation" if term_slope < 0 else "flat"

    # Pin / flip / max-pain
    flip = zero_gamma_flip(by_strike, spot)
    pin = pin_candidate(by_strike, spot)
    nearest_expiry = by_expiry[0]["expiry"] if by_expiry else None
    mp_0dte = max_pain(contracts, nearest_expiry) if nearest_expiry else float("nan")

    # P/C ratios
    total_call_oi = sum(r["call_oi"] for r in by_strike) or 1
    total_put_oi = sum(r["put_oi"] for r in by_strike)
    total_call_vol = sum(r["call_vol"] for r in by_strike) or 1
    total_put_vol = sum(r["put_vol"] for r in by_strike)

    # IV percentile vs our recorded history
    hist = [pt["iv30"] for pt in iv_history.get(sym, []) if pt.get("iv30")]
    iv_pct = percentile_of(atm_iv30, hist) if math.isfinite(atm_iv30) else float("nan")

    summary = {
        "spot": round(spot, 4),
        "atm_iv_30d": round(atm_iv30, 4) if math.isfinite(atm_iv30) else None,
        "realized_vol_30d": round(rv30, 4) if math.isfinite(rv30) else None,
        "vrp_30d": round(vrp, 4) if math.isfinite(vrp) else None,
        "iv_pct_history": round(iv_pct, 3) if math.isfinite(iv_pct) else None,
        "iv_history_n": len(hist),
        "skew_25_30d": round(skew30, 4) if math.isfinite(skew30) else None,
        "iv_7d": round(iv7, 4) if math.isfinite(iv7) else None,
        "iv_60d": round(iv60, 4) if math.isfinite(iv60) else None,
        "term_slope": round(term_slope, 4) if math.isfinite(term_slope) else None,
        "term_state": term_state,
        "net_gex": round(sum(r["gex"] for r in by_strike), 2),
        "net_vex": round(sum(r["vex"] for r in by_strike), 2),
        "net_dex": round(sum(r["dex"] for r in by_strike), 2),
        "zero_gamma_flip": round(flip, 4) if math.isfinite(flip) else None,
        "pin_candidate": pin if pin else None,
        "max_pain_0dte": round(mp_0dte, 4) if math.isfinite(mp_0dte) else None,
        "pcr_oi": round(total_put_oi / total_call_oi, 3),
        "pcr_vol": round(total_put_vol / total_call_vol, 3),
    }

    # Update IV history (after we read it for percentile)
    update_iv_history(iv_history, sym, atm_iv30, skew30, vrp)

    surface = vol_surface_grid(by_expiry, contracts, spot)

    summary_for_concl = {**summary, "spot": spot}
    conclusions = make_conclusions(sym, summary_for_concl, by_strike, by_expiry)

    return {
        "sym": sym,
        "name": name,
        "spot": round(spot, 4),
        "summary": summary,
        "by_strike": by_strike,
        "by_expiry": by_expiry,
        "vol_surface": surface,
        "conclusions": conclusions,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    iv_history = load_iv_history()
    out_tickers: list[dict] = []
    for sym, name in TICKERS:
        try:
            res = process_ticker(sym, name, iv_history)
            if res:
                out_tickers.append(res)
                _log(f"{sym}: ok — atm30 {res['summary'].get('atm_iv_30d')}, "
                     f"netGEX {res['summary'].get('net_gex')/1e9 if res['summary'].get('net_gex') else None}")
            time.sleep(0.5)
        except Exception as e:
            _log(f"{sym}: FAILED {e}")
            continue

    snapshot = {
        "updated": NOW.isoformat(),
        "tickers": out_tickers,
    }
    SNAPSHOT_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    IVHIST_PATH.write_text(json.dumps(iv_history, ensure_ascii=False), encoding="utf-8")
    _log(f"wrote snapshot ({len(out_tickers)} tickers) + iv_history")
    return 0 if out_tickers else 1


if __name__ == "__main__":
    raise SystemExit(main())
