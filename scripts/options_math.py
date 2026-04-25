"""
options_math.py — Black-Scholes Greeks + helpers for options analytics.

Self-contained, stdlib + numpy/scipy only. Used by fetch_options.py.

Greeks convention:
  - delta:    ∂V/∂S
  - gamma:    ∂²V/∂S²              (per $1 spot move)
  - vega:     ∂V/∂σ × 0.01         (per 1% IV move)
  - theta:    ∂V/∂t × (1/365)      (per calendar day)
  - vanna:    ∂²V/∂S∂σ ≡ ∂Δ/∂σ
  - charm:    ∂Δ/∂t × (1/365)      (delta drift per calendar day)

Dealer-positioning convention (SpotGamma-style):
  GEX  =  Γ × OI × 100 × S² × 0.01  with sign:  +calls,  −puts
    → assumed dealers are net long calls / short puts (retail writes puts
      and buys calls). Net positive GEX = stabilizing regime, dealers buy
      dips and sell rips. Net negative = destabilizing, dealers chase moves.

  VEX  =  vanna × OI × 100 × S × σ_in_pct       (vanna exposure)
  CEX  =  charm × OI × 100 × S                  (charm exposure, per day)
  DEX  =  Δ × OI × 100 × S                      (delta exposure, $)
"""
from __future__ import annotations

import math
from typing import Iterable

import numpy as np
from scipy.stats import norm


# ---------------------------------------------------------------------------
# Black-Scholes Greeks (vectorized — accepts scalars or numpy arrays)
# ---------------------------------------------------------------------------
SQRT_252 = math.sqrt(252.0)


def _safe_T(T):
    return np.maximum(T, 1.0 / 365.0 / 24.0)  # 1 hour floor


def bs_greeks(S, K, T, r, sigma, is_call, q: float = 0.0) -> dict:
    """All values returned as numpy arrays (or scalars if all inputs scalar)."""
    S = np.asarray(S, dtype=float)
    K = np.asarray(K, dtype=float)
    T = _safe_T(np.asarray(T, dtype=float))
    sigma = np.maximum(np.asarray(sigma, dtype=float), 1e-4)
    is_call = np.asarray(is_call, dtype=bool)

    sqrtT = np.sqrt(T)
    d1 = (np.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * sqrtT)
    d2 = d1 - sigma * sqrtT

    pdf_d1 = norm.pdf(d1)
    cdf_d1 = norm.cdf(d1)
    cdf_neg_d1 = norm.cdf(-d1)
    cdf_d2 = norm.cdf(d2)
    cdf_neg_d2 = norm.cdf(-d2)

    delta_call = np.exp(-q * T) * cdf_d1
    delta_put = np.exp(-q * T) * (cdf_d1 - 1.0)
    delta = np.where(is_call, delta_call, delta_put)

    gamma = np.exp(-q * T) * pdf_d1 / (S * sigma * sqrtT)
    vega = S * np.exp(-q * T) * pdf_d1 * sqrtT * 0.01

    theta_call = (
        -(S * np.exp(-q * T) * pdf_d1 * sigma) / (2 * sqrtT)
        - r * K * np.exp(-r * T) * cdf_d2
        + q * S * np.exp(-q * T) * cdf_d1
    )
    theta_put = (
        -(S * np.exp(-q * T) * pdf_d1 * sigma) / (2 * sqrtT)
        + r * K * np.exp(-r * T) * cdf_neg_d2
        - q * S * np.exp(-q * T) * cdf_neg_d1
    )
    theta = np.where(is_call, theta_call, theta_put) / 365.0

    # Vanna: ∂Δ/∂σ — same formula for calls and puts (under same sign convention)
    vanna = -np.exp(-q * T) * pdf_d1 * d2 / sigma

    # Charm: ∂Δ/∂t. Sign convention so positive charm = delta growing over time.
    charm_call = -np.exp(-q * T) * (
        pdf_d1 * (2 * (r - q) * T - d2 * sigma * sqrtT) / (2 * T * sigma * sqrtT)
        - q * cdf_d1
    )
    charm_put = -np.exp(-q * T) * (
        pdf_d1 * (2 * (r - q) * T - d2 * sigma * sqrtT) / (2 * T * sigma * sqrtT)
        + q * cdf_neg_d1
    )
    charm = np.where(is_call, charm_call, charm_put) / 365.0

    return {
        "delta": delta,
        "gamma": gamma,
        "vega": vega,
        "theta": theta,
        "vanna": vanna,
        "charm": charm,
        "d1": d1,
        "d2": d2,
    }


# ---------------------------------------------------------------------------
# Realized volatility (annualized, from daily log returns)
# ---------------------------------------------------------------------------
def realized_vol(closes: Iterable[float], window: int = 30) -> float:
    arr = np.asarray(list(closes), dtype=float)
    arr = arr[np.isfinite(arr) & (arr > 0)]
    if len(arr) < 5:
        return float("nan")
    rets = np.diff(np.log(arr))
    if len(rets) > window:
        rets = rets[-window:]
    if len(rets) < 5:
        return float("nan")
    return float(np.std(rets, ddof=1) * SQRT_252)


# ---------------------------------------------------------------------------
# Linear interpolation helpers (for ATM IV / fixed-delta IV)
# ---------------------------------------------------------------------------
def interp_at(xs: np.ndarray, ys: np.ndarray, x_target: float) -> float:
    """Linear interpolation in x; return ys at x_target. Sorted xs assumed."""
    if len(xs) == 0:
        return float("nan")
    if len(xs) == 1:
        return float(ys[0])
    if x_target <= xs[0]:
        return float(ys[0])
    if x_target >= xs[-1]:
        return float(ys[-1])
    return float(np.interp(x_target, xs, ys))


def percentile_of(value: float, history: Iterable[float]) -> float:
    """Return percentile (0..1) of value within history. NaN if no history."""
    arr = np.asarray([h for h in history if h is not None and math.isfinite(h)], dtype=float)
    if not len(arr):
        return float("nan")
    return float((arr <= value).mean())
