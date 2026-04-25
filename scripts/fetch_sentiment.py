"""
fetch_sentiment.py — Multi-platform retail sentiment ingestion.

Crawls Reddit / StockTwits / Bluesky / 4chan/biz / HackerNews for ticker
mentions, scores sentiment, and emits aggregated signals to:

    _data/sentiment/summary.json   # latest snapshot for the page
    _data/sentiment/history.json   # rolling 30-day per-ticker time series

Each source is wrapped in its own try/except so one platform going down
doesn't kill the run. Designed for the 30-min GitHub Actions cron in
.github/workflows/sentiment-data.yml.
"""
from __future__ import annotations

import html
import json
import math
import pathlib
import re
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone

# Local
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from ticker_universe import (  # noqa: E402
    BARE_ELIGIBLE,
    SYMBOL_SET,
    SYMBOL_TO_NAME,
    normalize_symbol,
)

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    _VADER = SentimentIntensityAnalyzer()
except Exception:  # pragma: no cover
    _VADER = None

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "_data" / "sentiment"
OUT_DIR.mkdir(parents=True, exist_ok=True)
SUMMARY_PATH = OUT_DIR / "summary.json"
HISTORY_PATH = OUT_DIR / "history.json"

USER_AGENT = "dh-quant-sentiment/1.0 (https://dh-quant.github.io)"

NOW = datetime.now(timezone.utc)

# ---------------------------------------------------------------------------
# Finance lexicon — VADER overrides for retail-trading slang. Values added on
# top of base VADER score (per-token, capped). Tuned by hand.
# ---------------------------------------------------------------------------
FINANCE_LEXICON: dict[str, float] = {
    # bullish
    "moon": 2.5, "mooning": 2.5, "rocket": 2.5, "rockets": 2.5,
    "tendies": 2.0, "yolo": 1.5, "calls": 1.2, "long": 0.8,
    "bullish": 2.5, "bull": 1.5, "ath": 1.8, "breakout": 2.0,
    "squeeze": 2.0, "rally": 1.8, "ripping": 2.2, "ripped": 1.8,
    "pumping": 1.8, "send": 1.5, "buy": 1.0, "bought": 0.8,
    "diamond": 1.5, "hodl": 1.2, "hodling": 1.2, "hold": 0.5,
    "green": 1.0, "rip": 1.5, "moass": 2.5, "stonks": 1.5,
    "lambo": 2.0, "printer": 1.8, "brrrr": 1.5, "godcandle": 2.5,
    # bearish
    "puts": -1.2, "short": -0.8, "shorts": -0.8, "shorted": -1.0,
    "bearish": -2.5, "bear": -1.5, "dump": -2.0, "dumped": -2.0,
    "dumping": -2.2, "rug": -2.5, "rugged": -2.5, "rugpull": -2.5,
    "drilling": -2.0, "drilled": -2.0, "tanking": -2.2, "tanked": -2.0,
    "crash": -2.5, "crashed": -2.5, "crashing": -2.5, "bagholder": -2.0,
    "baghold": -2.0, "bagholding": -2.0, "rekt": -2.5, "rektt": -2.5,
    "wiped": -2.0, "blown": -1.5, "blew": -1.0, "fud": -1.5,
    "scam": -2.0, "fraud": -2.5, "delisted": -2.5, "halt": -1.8,
    "halted": -1.8, "red": -1.0, "bleeding": -2.0, "bloodbath": -2.5,
    "bagholders": -2.0, "puke": -2.0, "capitulation": -2.0,
    "deathcandle": -2.5,
}

# Pre-compile regexes
RE_CASHTAG = re.compile(r"\$([A-Z][A-Z\.]{0,5})\b")
RE_BARE = re.compile(r"\b([A-Z]{2,5})\b")  # min length 2 to cut single letters
RE_URL = re.compile(r"https?://\S+")
RE_WS = re.compile(r"\s+")


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------
def _get(url: str, timeout: float = 12.0, headers: dict | None = None) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def _get_json(url: str, **kw):
    return json.loads(_get(url, **kw).decode("utf-8", errors="replace"))


def _log(msg: str) -> None:
    print(f"[sentiment] {msg}", file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# Ticker extraction
# ---------------------------------------------------------------------------
def extract_tickers(text: str) -> set[str]:
    """Return set of ticker symbols mentioned. Cashtag form ($AAPL) accepts
    anything in our universe; bare form (AAPL) requires it to be in
    BARE_ELIGIBLE (excludes common-word ambiguous tickers)."""
    if not text:
        return set()
    text = html.unescape(text)
    found: set[str] = set()
    for m in RE_CASHTAG.finditer(text):
        sym = normalize_symbol(m.group(1))
        if sym in SYMBOL_SET:
            found.add(sym)
    for m in RE_BARE.finditer(text):
        sym = m.group(1)
        if sym in BARE_ELIGIBLE:
            found.add(sym)
    return found


# ---------------------------------------------------------------------------
# Sentiment scoring
# ---------------------------------------------------------------------------
def score_text(text: str) -> float:
    """Return sentiment in [-1, 1]. VADER compound + finance-lexicon nudge."""
    if not text:
        return 0.0
    text = html.unescape(text)
    text = RE_URL.sub("", text)
    text = RE_WS.sub(" ", text).strip()
    base = _VADER.polarity_scores(text)["compound"] if _VADER else 0.0
    # finance lexicon delta (sum, then squash to keep bounded)
    delta = 0.0
    low = text.lower()
    for tok, weight in FINANCE_LEXICON.items():
        if tok in low:
            delta += weight
    # squash delta with tanh so it stays in (-1, 1) and combine via average
    delta_n = math.tanh(delta / 5.0)
    combined = (base + delta_n) / 2 if (base or delta_n) else 0.0
    return max(-1.0, min(1.0, combined))


# ---------------------------------------------------------------------------
# Source: Reddit (no auth, public JSON)
# ---------------------------------------------------------------------------
REDDIT_SUBS = [
    ("wallstreetbets", 100),
    ("options", 100),
    ("stocks", 100),
    ("investing", 80),
    ("StockMarket", 80),
    ("Daytrading", 60),
    ("CryptoCurrency", 80),
    ("Bitcoin", 60),
    ("ethfinance", 50),
    ("SecurityAnalysis", 40),
    ("ValueInvesting", 40),
    ("stockstobuytoday", 40),
    ("pennystocks", 40),
    ("smallstreetbets", 40),
]


def fetch_reddit() -> list[dict]:
    """Fetch hot posts + their top-level visible content. Each post becomes a
    'doc' with text, author score weight, url, platform."""
    docs: list[dict] = []
    for sub, limit in REDDIT_SUBS:
        url = f"https://www.reddit.com/r/{sub}/hot.json?limit={limit}"
        try:
            data = _get_json(url)
            for post in data.get("data", {}).get("children", []):
                d = post.get("data", {})
                title = d.get("title", "") or ""
                body = d.get("selftext", "") or ""
                ts = d.get("created_utc", 0) or 0
                docs.append({
                    "platform": "reddit",
                    "subreddit": sub,
                    "text": (title + "\n" + body).strip(),
                    "score": int(d.get("score", 0) or 0),
                    "comments": int(d.get("num_comments", 0) or 0),
                    "url": "https://www.reddit.com" + (d.get("permalink", "") or ""),
                    "ts": ts,
                    "author": d.get("author", "") or "",
                })
            time.sleep(1.2)  # be polite — reddit ratelimits anonymous JSON
        except Exception as e:
            _log(f"reddit r/{sub} failed: {e}")
            continue
    _log(f"reddit: {len(docs)} docs")
    return docs


# ---------------------------------------------------------------------------
# Source: StockTwits (no auth, per-ticker stream)
# ---------------------------------------------------------------------------
def fetch_stocktwits(symbols: list[str]) -> list[dict]:
    docs: list[dict] = []
    for sym in symbols:
        # StockTwits doesn't know dotted tickers like BRK.B
        sym_q = sym.replace(".", "")
        url = f"https://api.stocktwits.com/api/2/streams/symbol/{sym_q}.json"
        try:
            data = _get_json(url, timeout=10.0)
            for msg in data.get("messages", []) or []:
                body = msg.get("body", "") or ""
                created = msg.get("created_at", "")
                # Parse ISO-8601 to epoch
                ts = 0
                try:
                    ts = int(datetime.fromisoformat(created.replace("Z", "+00:00")).timestamp())
                except Exception:
                    pass
                ent = msg.get("entities", {}) or {}
                bb = ((ent.get("sentiment") or {}).get("basic") or "").lower()
                # Anchor sentiment to user-tagged Bull/Bear when present
                anchor = 0.7 if bb == "bullish" else (-0.7 if bb == "bearish" else None)
                docs.append({
                    "platform": "stocktwits",
                    "text": body,
                    "score": 1,
                    "url": f"https://stocktwits.com/symbol/{sym_q}",
                    "ts": ts,
                    "anchor": anchor,
                    "ticker_hint": sym,
                })
            time.sleep(0.4)
        except Exception as e:
            _log(f"stocktwits {sym} failed: {e}")
            continue
    _log(f"stocktwits: {len(docs)} docs across {len(symbols)} syms")
    return docs


# ---------------------------------------------------------------------------
# Source: Bluesky (public search, no auth)
# ---------------------------------------------------------------------------
def fetch_bluesky(symbols: list[str]) -> list[dict]:
    docs: list[dict] = []
    base = "https://api.bsky.app/xrpc/app.bsky.feed.searchPosts"
    for sym in symbols:
        # cashtag form to keep noise down
        q = urllib.parse.quote(f"${sym}")
        url = f"{base}?q={q}&limit=50"
        try:
            data = _get_json(url, timeout=10.0)
            for post in data.get("posts", []) or []:
                rec = post.get("record", {}) or {}
                text = rec.get("text", "") or ""
                created = rec.get("createdAt", "") or ""
                ts = 0
                try:
                    ts = int(datetime.fromisoformat(created.replace("Z", "+00:00")).timestamp())
                except Exception:
                    pass
                handle = (post.get("author") or {}).get("handle", "")
                docs.append({
                    "platform": "bluesky",
                    "text": text,
                    "score": int(post.get("likeCount", 0) or 0),
                    "url": f"https://bsky.app/profile/{handle}/post/{post.get('uri', '').rsplit('/', 1)[-1]}",
                    "ts": ts,
                    "ticker_hint": sym,
                })
            time.sleep(0.4)
        except Exception as e:
            _log(f"bluesky {sym} failed: {e}")
            continue
    _log(f"bluesky: {len(docs)} docs across {len(symbols)} syms")
    return docs


# ---------------------------------------------------------------------------
# Source: 4chan /biz/ (no auth)
# ---------------------------------------------------------------------------
def fetch_4chan_biz() -> list[dict]:
    docs: list[dict] = []
    try:
        catalog = _get_json("https://a.4cdn.org/biz/catalog.json", timeout=12.0)
    except Exception as e:
        _log(f"4chan catalog failed: {e}")
        return docs
    # Only inspect first ~30 OPs from first 2 catalog pages — comments left aside
    op_count = 0
    for page in (catalog or [])[:2]:
        for thr in page.get("threads", []) or []:
            if op_count >= 30:
                break
            sub = thr.get("sub", "") or ""
            com = thr.get("com", "") or ""
            text = re.sub(r"<[^>]+>", " ", sub + " " + com)
            text = html.unescape(text)
            ts = thr.get("time", 0) or 0
            docs.append({
                "platform": "4chan",
                "text": text,
                "score": int(thr.get("replies", 0) or 0),
                "url": f"https://boards.4chan.org/biz/thread/{thr.get('no')}",
                "ts": ts,
            })
            op_count += 1
        if op_count >= 30:
            break
        time.sleep(0.5)
    _log(f"4chan: {len(docs)} ops")
    return docs


# ---------------------------------------------------------------------------
# Source: HackerNews (Algolia search)
# ---------------------------------------------------------------------------
HN_QUERIES = ["stocks", "bitcoin", "crypto", "options trading", "fed", "tesla", "nvidia"]


def fetch_hn() -> list[dict]:
    docs: list[dict] = []
    for q in HN_QUERIES:
        url = f"https://hn.algolia.com/api/v1/search_by_date?query={urllib.parse.quote(q)}&tags=story&hitsPerPage=20"
        try:
            data = _get_json(url, timeout=10.0)
            for h in data.get("hits", []) or []:
                title = h.get("title", "") or ""
                body = h.get("story_text", "") or ""
                created = h.get("created_at_i", 0) or 0
                docs.append({
                    "platform": "hn",
                    "text": title + " " + body,
                    "score": int(h.get("points", 0) or 0),
                    "url": f"https://news.ycombinator.com/item?id={h.get('objectID')}",
                    "ts": int(created),
                })
            time.sleep(0.3)
        except Exception as e:
            _log(f"hn '{q}' failed: {e}")
    _log(f"hn: {len(docs)} hits")
    return docs


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------
def aggregate(docs: list[dict]) -> dict[str, dict]:
    """Per-ticker rollup."""
    now_ts = int(NOW.timestamp())
    by_sym: dict[str, dict] = defaultdict(lambda: {
        "mentions": 0,
        "mentions_6h": 0,
        "mentions_24h": 0,
        "platforms": defaultdict(int),
        "scores": [],            # weighted sentiment list
        "bull_count": 0,
        "bear_count": 0,
        "samples": [],           # top-scored docs
    })
    for doc in docs:
        text = doc.get("text", "") or ""
        ts = int(doc.get("ts") or 0)
        age_s = max(0, now_ts - ts) if ts else 0
        # Tickers either from text extraction or stocktwits/bluesky hint
        tickers = extract_tickers(text)
        if doc.get("ticker_hint"):
            tickers.add(doc["ticker_hint"])
        if not tickers:
            continue
        # Sentiment
        if doc.get("anchor") is not None:
            sent = doc["anchor"]
        else:
            sent = score_text(text)
        # Engagement weight (log so a 10k-upvote post doesn't dwarf everything)
        w = math.log1p(max(1, int(doc.get("score", 1) or 1)))
        for sym in tickers:
            agg = by_sym[sym]
            agg["mentions"] += 1
            if age_s and age_s <= 6 * 3600:
                agg["mentions_6h"] += 1
            if age_s and age_s <= 24 * 3600:
                agg["mentions_24h"] += 1
            agg["platforms"][doc["platform"]] += 1
            agg["scores"].append((sent, w))
            if sent > 0.15:
                agg["bull_count"] += 1
            elif sent < -0.15:
                agg["bear_count"] += 1
            agg["samples"].append({
                "text": text[:240],
                "platform": doc["platform"],
                "score": int(doc.get("score", 0) or 0),
                "url": doc.get("url", ""),
                "sent": round(sent, 3),
                "ts": ts,
            })

    # Finalize per-symbol
    out: dict[str, dict] = {}
    for sym, agg in by_sym.items():
        if agg["mentions"] < 2:
            continue  # noise
        # Weighted sentiment
        total_w = sum(w for _, w in agg["scores"]) or 1.0
        sent_w = sum(s * w for s, w in agg["scores"]) / total_w
        bp = agg["mentions"] or 1
        # Pick top samples (one per platform if possible, by score)
        agg["samples"].sort(key=lambda d: -d["score"])
        seen_pf = set()
        top_samples = []
        for s in agg["samples"]:
            if s["platform"] in seen_pf and len(top_samples) >= 3:
                continue
            seen_pf.add(s["platform"])
            top_samples.append(s)
            if len(top_samples) >= 5:
                break
        out[sym] = {
            "sym": sym,
            "name": SYMBOL_TO_NAME.get(sym, sym),
            "mentions": agg["mentions"],
            "mentions_6h": agg["mentions_6h"],
            "mentions_24h": agg["mentions_24h"],
            "velocity_per_hour": round(agg["mentions_6h"] / 6.0, 2),
            "sentiment": round(sent_w, 3),
            "bull_pct": round(agg["bull_count"] / bp, 3),
            "bear_pct": round(agg["bear_count"] / bp, 3),
            "platforms": dict(agg["platforms"]),
            "samples": top_samples,
        }
    return out


# ---------------------------------------------------------------------------
# History + z-score
# ---------------------------------------------------------------------------
def load_history() -> dict:
    if HISTORY_PATH.exists():
        try:
            return json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def update_history(history: dict, snapshot: dict[str, dict]) -> dict:
    iso = NOW.isoformat()
    cutoff = (NOW - timedelta(days=30)).timestamp()
    by_sym = history.setdefault("by_symbol", {})
    for sym, s in snapshot.items():
        bucket = by_sym.setdefault(sym, [])
        bucket.append({
            "t": iso,
            "mentions": s["mentions"],
            "sentiment": s["sentiment"],
        })
        # prune
        keep = []
        for pt in bucket:
            try:
                pt_ts = datetime.fromisoformat(pt["t"]).timestamp()
            except Exception:
                continue
            if pt_ts >= cutoff:
                keep.append(pt)
        by_sym[sym] = keep[-200:]  # also cap length
    history["updated"] = iso
    return history


def compute_zscores(snapshot: dict[str, dict], history: dict) -> None:
    """Add z_score field to each ticker = (current - mean) / std over last 30d."""
    by_sym = history.get("by_symbol", {})
    for sym, s in snapshot.items():
        series = [pt["mentions"] for pt in by_sym.get(sym, [])[:-1]]
        if len(series) < 5:
            s["z_score"] = None
            continue
        mu = statistics.mean(series)
        sd = statistics.pstdev(series) or 1.0
        s["z_score"] = round((s["mentions"] - mu) / sd, 2)


# ---------------------------------------------------------------------------
# Conclusion generator (rules-based)
# ---------------------------------------------------------------------------
def make_conclusions(snapshot: dict[str, dict]) -> list[dict]:
    """Synthesize 3-6 punchy headline conclusions from the snapshot."""
    out: list[dict] = []
    items = list(snapshot.values())
    # Helper to push a conclusion
    def push(text, tone="info", icon="•", sym=None):
        out.append({"text": text, "tone": tone, "icon": icon, "sym": sym})

    # 1. Most-mentioned overall
    if items:
        top = sorted(items, key=lambda x: -x["mentions"])[:3]
        names = " · ".join(f"{t['sym']}({t['mentions']})" for t in top)
        push(f"오늘의 화제: {names}", tone="neutral", icon="🔥")

    # 2. Overheated (high z + bullish)
    over = [x for x in items if x.get("z_score") and x["z_score"] >= 2.0 and x["sentiment"] > 0.2]
    over.sort(key=lambda x: -x["z_score"])
    for t in over[:2]:
        push(
            f"{t['sym']} 과열 (z=+{t['z_score']:.1f}, 감성 {t['sentiment']:+.2f}) — 단기 평균회귀 후보",
            tone="warn", icon="↗", sym=t["sym"],
        )

    # 3. Capitulation (high z + bearish)
    cap = [x for x in items if x.get("z_score") and x["z_score"] >= 2.0 and x["sentiment"] < -0.2]
    cap.sort(key=lambda x: -x["z_score"])
    for t in cap[:2]:
        push(
            f"{t['sym']} 패닉 (z=+{t['z_score']:.1f}, 감성 {t['sentiment']:+.2f}) — 역발상 매수 후보",
            tone="warn", icon="↘", sym=t["sym"],
        )

    # 4. Quiet — low velocity + previously hot (mention drop)
    drops = [x for x in items if x.get("z_score") is not None and x["z_score"] <= -1.5 and x["mentions"] >= 5]
    for t in drops[:1]:
        push(
            f"{t['sym']} 조용 (z={t['z_score']:.1f}) — 관심 소실, 추세 끝물 가능",
            tone="info", icon="⤵", sym=t["sym"],
        )

    # 5. Sentiment polarized
    pol = [x for x in items if x["mentions"] >= 10 and abs(x["sentiment"]) < 0.05 and (x["bull_pct"] + x["bear_pct"]) > 0.5]
    for t in pol[:1]:
        push(
            f"{t['sym']} 의견 갈림 (강세 {int(t['bull_pct']*100)}% / 약세 {int(t['bear_pct']*100)}%) — 변동성 확대 가능",
            tone="info", icon="⇄", sym=t["sym"],
        )

    return out[:6]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
# StockTwits/Bluesky are queried per-ticker; pick the most likely candidates so
# we don't burn rate limit on dead names. Mix universe-staple ETFs/megacaps
# with current WSB favorites.
ST_BSKY_QUERY_TICKERS = [
    "SPY", "QQQ", "IWM", "VIX", "TLT", "HYG", "GLD",
    "AAPL", "NVDA", "TSLA", "META", "GOOGL", "AMZN", "MSFT", "AMD",
    "AVGO", "PLTR", "SMCI", "COIN", "MSTR", "GME", "AMC", "HOOD",
    "BTC", "ETH", "SOL",
]


def main() -> int:
    if _VADER is None:
        _log("WARN: vaderSentiment not available — sentiment scores will be 0")
    docs: list[dict] = []
    docs.extend(fetch_reddit())
    docs.extend(fetch_4chan_biz())
    docs.extend(fetch_hn())
    docs.extend(fetch_stocktwits(ST_BSKY_QUERY_TICKERS))
    docs.extend(fetch_bluesky(ST_BSKY_QUERY_TICKERS))

    _log(f"total docs: {len(docs)}")

    snapshot = aggregate(docs)
    history = load_history()
    compute_zscores(snapshot, history)
    history = update_history(history, snapshot)

    # Sort + cap output to top 50 by mentions
    items = sorted(snapshot.values(), key=lambda x: -x["mentions"])[:50]

    # Platform totals
    platform_totals: dict[str, int] = defaultdict(int)
    for d in docs:
        platform_totals[d["platform"]] += 1

    summary = {
        "updated": NOW.isoformat(),
        "doc_count": len(docs),
        "platforms": dict(platform_totals),
        "tickers": items,
        "conclusions": make_conclusions(snapshot),
    }

    SUMMARY_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    HISTORY_PATH.write_text(json.dumps(history, ensure_ascii=False), encoding="utf-8")
    _log(f"wrote {SUMMARY_PATH.name} ({len(items)} tickers) + history")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
