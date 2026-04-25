"""
Ticker universe used for SNS mention extraction.

Hand-curated set of the most-discussed US tickers + major crypto + index ETFs.
Bare uppercase tokens that match this set are counted as mentions even without
a `$` prefix. Common-English-word tickers (A, T, ARE, ON, ALL, ...) are
omitted — they cause too many false positives. They can still be picked up via
explicit `$T` style cashtags.
"""
from __future__ import annotations

# (symbol, display_name) — keep names short so they fit in cards
TICKERS: list[tuple[str, str]] = [
    # Mega-cap tech
    ("AAPL", "Apple"),
    ("MSFT", "Microsoft"),
    ("NVDA", "NVIDIA"),
    ("GOOGL", "Alphabet"),
    ("GOOG", "Alphabet C"),
    ("AMZN", "Amazon"),
    ("META", "Meta"),
    ("TSLA", "Tesla"),
    ("AVGO", "Broadcom"),
    ("ORCL", "Oracle"),
    ("CRM", "Salesforce"),
    ("ADBE", "Adobe"),
    ("NFLX", "Netflix"),
    ("INTC", "Intel"),
    ("AMD", "AMD"),
    ("QCOM", "Qualcomm"),
    ("MU", "Micron"),
    ("TSM", "TSMC"),
    ("ASML", "ASML"),
    ("SMCI", "Super Micro"),
    ("PLTR", "Palantir"),
    ("CRWD", "CrowdStrike"),
    ("PANW", "Palo Alto"),
    ("SNOW", "Snowflake"),
    ("MDB", "MongoDB"),
    ("DDOG", "Datadog"),
    ("NET", "Cloudflare"),
    ("SHOP", "Shopify"),
    ("UBER", "Uber"),
    ("ABNB", "Airbnb"),
    ("PYPL", "PayPal"),
    ("SQ", "Block"),
    ("COIN", "Coinbase"),
    ("HOOD", "Robinhood"),
    ("RBLX", "Roblox"),
    ("U", "Unity"),
    ("DKNG", "DraftKings"),
    ("RIVN", "Rivian"),
    ("LCID", "Lucid"),
    ("NIO", "NIO"),
    ("XPEV", "XPeng"),
    ("LI", "Li Auto"),
    ("BABA", "Alibaba"),
    ("PDD", "PDD"),
    ("JD", "JD.com"),
    # AI / momentum names
    ("AI", "C3.ai"),
    ("ARM", "ARM Holdings"),
    ("MRVL", "Marvell"),
    ("ANET", "Arista"),
    ("DELL", "Dell"),
    ("HPE", "HPE"),
    ("VRT", "Vertiv"),
    ("CRWV", "CoreWeave"),
    # Banks / financials
    ("JPM", "JPMorgan"),
    ("BAC", "Bank of America"),
    ("WFC", "Wells Fargo"),
    ("GS", "Goldman Sachs"),
    ("MS", "Morgan Stanley"),
    ("C", "Citigroup"),
    ("BRK.B", "Berkshire B"),
    ("V", "Visa"),
    ("MA", "Mastercard"),
    ("BLK", "BlackRock"),
    ("SCHW", "Schwab"),
    # Energy / commodities
    ("XOM", "Exxon"),
    ("CVX", "Chevron"),
    ("OXY", "Occidental"),
    ("COP", "ConocoPhillips"),
    ("SLB", "Schlumberger"),
    ("FCX", "Freeport"),
    ("NEM", "Newmont"),
    ("GOLD", "Barrick"),
    ("URA", "Uranium ETF"),
    ("CCJ", "Cameco"),
    ("LEU", "Centrus"),
    ("OKLO", "Oklo"),
    ("SMR", "NuScale"),
    # Healthcare / biotech
    ("LLY", "Eli Lilly"),
    ("UNH", "UnitedHealth"),
    ("JNJ", "J&J"),
    ("PFE", "Pfizer"),
    ("MRK", "Merck"),
    ("ABBV", "AbbVie"),
    ("NVO", "Novo Nordisk"),
    ("MRNA", "Moderna"),
    ("BNTX", "BioNTech"),
    ("VRTX", "Vertex"),
    # Consumer / retail
    ("WMT", "Walmart"),
    ("COST", "Costco"),
    ("HD", "Home Depot"),
    ("LOW", "Lowe's"),
    ("MCD", "McDonald's"),
    ("SBUX", "Starbucks"),
    ("NKE", "Nike"),
    ("LULU", "Lululemon"),
    ("DIS", "Disney"),
    ("KO", "Coca-Cola"),
    ("PEP", "PepsiCo"),
    ("PG", "P&G"),
    # Auto / industrial
    ("F", "Ford"),
    ("GM", "GM"),
    ("BA", "Boeing"),
    ("CAT", "Caterpillar"),
    ("DE", "Deere"),
    ("GE", "GE"),
    # Meme / WSB favorites
    ("GME", "GameStop"),
    ("AMC", "AMC"),
    ("BB", "BlackBerry"),
    ("BBBY", "Bed Bath"),
    ("MARA", "Marathon Digital"),
    ("RIOT", "Riot Platforms"),
    ("MSTR", "Strategy"),
    ("CLSK", "CleanSpark"),
    ("BMNR", "BitMine"),
    ("BTBT", "Bit Digital"),
    # Major ETFs / indices
    ("SPY", "S&P 500 ETF"),
    ("QQQ", "Nasdaq 100 ETF"),
    ("IWM", "Russell 2000 ETF"),
    ("DIA", "Dow ETF"),
    ("VIX", "VIX"),
    ("UVXY", "VIX 1.5x ETF"),
    ("VXX", "VIX ETF"),
    ("TLT", "20Y Treasury ETF"),
    ("IEF", "10Y Treasury ETF"),
    ("HYG", "High Yield ETF"),
    ("LQD", "IG Bond ETF"),
    ("GLD", "Gold ETF"),
    ("SLV", "Silver ETF"),
    ("USO", "Oil ETF"),
    ("UNG", "Nat Gas ETF"),
    ("XLE", "Energy SPDR"),
    ("XLF", "Financial SPDR"),
    ("XLK", "Tech SPDR"),
    ("XLV", "Healthcare SPDR"),
    ("XLI", "Industrial SPDR"),
    ("XLY", "Cons Disc SPDR"),
    ("XLP", "Cons Stap SPDR"),
    ("XLU", "Utility SPDR"),
    ("XLB", "Materials SPDR"),
    ("XLRE", "REIT SPDR"),
    ("SOXL", "Semis 3x"),
    ("TQQQ", "QQQ 3x"),
    ("SQQQ", "QQQ -3x"),
    ("SPXL", "SPY 3x"),
    ("SPXS", "SPY -3x"),
    # Crypto (treated as cashtag candidates too)
    ("BTC", "Bitcoin"),
    ("ETH", "Ethereum"),
    ("SOL", "Solana"),
    ("XRP", "Ripple"),
    ("DOGE", "Dogecoin"),
    ("ADA", "Cardano"),
    ("LINK", "Chainlink"),
    ("AVAX", "Avalanche"),
    ("MATIC", "Polygon"),
    ("DOT", "Polkadot"),
    ("BNB", "BNB"),
    # Korean ADR / KOSPI big names
    ("SONY", "Sony"),
    ("MUFG", "Mitsubishi UFJ"),
    # Newer hot names
    ("APP", "AppLovin"),
    ("SOFI", "SoFi"),
    ("RKLB", "Rocket Lab"),
    ("ASTS", "AST SpaceMobile"),
    ("JOBY", "Joby Aviation"),
    ("ACHR", "Archer Aviation"),
    ("DAVE", "Dave Inc"),
    ("UPST", "Upstart"),
    ("AFRM", "Affirm"),
]

# Bare-token mentions are only counted for symbols NOT in this blocklist of
# common English words / very ambiguous tokens. They can still be matched via
# explicit $TICKER cashtag form.
COMMON_WORDS = {
    "A", "T", "AT", "I", "ON", "ALL", "BE", "DO", "FOR", "GO", "HAS", "HE",
    "IT", "MY", "NO", "OR", "SO", "TO", "UP", "US", "WE", "WHO", "AM", "ARE",
    "ANY", "CAN", "GET", "HOW", "NOW", "OUT", "OWN", "SEE", "TWO", "WAY",
    "THE", "AND", "BUT", "NOT", "YOU", "YES", "ONE", "ITS", "OUR", "MAY",
    "GOOD", "OK", "BIG", "LOT", "NEW", "TOP", "OLD", "BAD", "EVE", "AGO",
    "PUMP", "DUMP", "MOON", "DD", "FD", "FOMC", "CPI", "GDP", "PMI", "FED",
    "CEO", "CFO", "ETF", "IPO", "ATH", "ATL", "EOM", "EOY", "EOD", "AH",
    "PM", "AM", "USA", "UK", "EU", "RIP", "LOL", "WTF", "OMG", "TLDR",
    "REIT", "NYSE", "NASDAQ", "DOW", "VIX", "USD", "EUR", "JPY", "KRW",
    # Common tickers that are also common abbreviations / words. Cashtag form
    # ($AI / $BA) still tracks them — only bare form is suppressed here.
    "AI", "BA", "BB", "GM", "ARM", "ALL", "APP", "AT", "TO", "OR",
    # NOTE: VIX / USD intentionally listed here so bare "VIX" doesn't match —
    # users typing "VIX" mean the index, but "$VIX" (cashtag) still works.
}

# Build lookup sets
SYMBOL_TO_NAME: dict[str, str] = dict(TICKERS)
SYMBOL_SET: set[str] = set(SYMBOL_TO_NAME.keys())
# bare-token-eligible: must be in universe AND not a common word
BARE_ELIGIBLE: set[str] = SYMBOL_SET - COMMON_WORDS


def normalize_symbol(s: str) -> str:
    """Yahoo-style normalization (strip $, uppercase)."""
    return s.lstrip("$").upper().strip()
