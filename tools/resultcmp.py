"""Engine-neutral normalisation and comparison of SQL result sets.

Firebird (firebird-driver) and PostgreSQL (PGlite) return the same logical
result in different shapes: padded CHAR values, Decimal vs. float, date
objects vs. ISO strings. `normalize` maps every value to a small canonical
set (None, bool, int, float, str) so results of both engines, and stored
snapshots, can be compared with `equal`.

Rules (the playground re-implements exactly these):
- None stays None (NULL).
- bool stays bool.
- Numbers are rounded to FIXED_SCALE decimal places (half-even). An integral
  result becomes int, anything else float. Non-finite floats are kept as is.
- Strings lose trailing blanks (CHAR padding).
- date -> "YYYY-MM-DD"; datetime -> "YYYY-MM-DD HH:MM:SS[.f]"; time ->
  "HH:MM:SS[.f]". Fractional seconds without trailing zeros, which matches
  PostgreSQL's text output. Aware datetimes are converted to UTC first and
  then treated as naive.
- bytes -> lowercase hex string; any other type -> str(value).
"""
from __future__ import annotations

import datetime
import math
from collections import Counter
from collections.abc import Mapping, Sequence
from decimal import ROUND_HALF_EVEN, Decimal, InvalidOperation
from typing import Any

FIXED_SCALE = 6
_QUANT = Decimal(1).scaleb(-FIXED_SCALE)


def _number(value: int | float | Decimal) -> int | float:
    if isinstance(value, int):
        return value
    if isinstance(value, float) and not math.isfinite(value):
        return value
    dec = value if isinstance(value, Decimal) else Decimal(repr(value))
    if not dec.is_finite():
        return float(dec)
    try:
        q = dec.quantize(_QUANT, rounding=ROUND_HALF_EVEN)
    except InvalidOperation:  # too many digits for the context; keep magnitude
        return float(dec)
    if q == q.to_integral_value():
        return int(q)
    return float(q)


def _frac(microsecond: int) -> str:
    if microsecond == 0:
        return ""
    return "." + f"{microsecond:06d}".rstrip("0")


def _time(t: datetime.time) -> str:
    return f"{t.hour:02d}:{t.minute:02d}:{t.second:02d}{_frac(t.microsecond)}"


def normalize_value(value: Any) -> Any:
    if value is None or isinstance(value, bool):
        return value
    if isinstance(value, (int, float, Decimal)):
        return _number(value)
    if isinstance(value, str):
        return value.rstrip(" ")
    if isinstance(value, datetime.datetime):
        if value.tzinfo is not None:
            value = value.astimezone(datetime.timezone.utc).replace(tzinfo=None)
        return f"{value.date().isoformat()} {_time(value.time())}"
    if isinstance(value, datetime.date):
        return value.isoformat()
    if isinstance(value, datetime.time):
        return _time(value)
    if isinstance(value, (bytes, bytearray, memoryview)):
        return bytes(value).hex()
    return str(value)


def normalize(rows: list[list], cols: list[str]) -> list[tuple]:
    """Normalise every value; raises ValueError if a row does not match cols."""
    width = len(cols)
    out: list[tuple] = []
    for i, row in enumerate(rows):
        if len(row) != width:
            raise ValueError(f"row {i} has {len(row)} values, expected {width}")
        out.append(tuple(normalize_value(v) for v in row))
    return out


def _unpack(result: Mapping | Sequence) -> tuple[list[str], list]:
    if isinstance(result, Mapping):
        if "cols" not in result or "rows" not in result:
            raise ValueError("result mapping needs 'cols' and 'rows'")
        return list(result["cols"]), list(result["rows"])
    raise TypeError(f"expected a result mapping with cols/rows, got {type(result).__name__}")


def equal(a: Mapping, b: Mapping, ordered: bool) -> bool:
    """Compare two results `{"cols": [...], "rows": [[...]]}`.

    Column names are ignored (engines differ in case and in names of
    unaliased expressions); the column count must match. With
    ordered=False the rows are compared as a multiset.
    """
    cols_a, rows_a = _unpack(a)
    cols_b, rows_b = _unpack(b)
    if len(cols_a) != len(cols_b):
        return False
    try:
        na = normalize(rows_a, cols_a)
        nb = normalize(rows_b, cols_b)
    except ValueError:
        return False
    if ordered:
        return na == nb
    return Counter(na) == Counter(nb)
