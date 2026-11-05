import datetime
from decimal import Decimal

import pytest

from resultcmp import equal, normalize


def res(cols, rows):
    return {"cols": cols, "rows": rows}


def test_char_padding_trimmed():
    assert normalize([["abc   "]], ["c"]) == [("abc",)]
    assert equal(res(["c"], [["abc   "]]), res(["c"], [["abc"]]), ordered=True)


def test_decimal_scale_equal():
    assert Decimal("2.50") == 2.5
    assert normalize([[Decimal("2.50")]], ["x"]) == normalize([[2.5]], ["x"])
    assert equal(res(["x"], [[Decimal("2.50")]]), res(["x"], [[2.5]]), ordered=True)
    # integral decimals compare equal to integers (SUM over NUMERIC vs. COUNT)
    assert equal(res(["x"], [[Decimal("3.00")]]), res(["x"], [[3]]), ordered=True)
    # float noise below the fixed scale is ignored, real differences are not
    assert equal(res(["x"], [[0.1 + 0.2]]), res(["x"], [[Decimal("0.3")]]), ordered=True)
    assert not equal(res(["x"], [[Decimal("2.51")]]), res(["x"], [[2.5]]), ordered=True)


def test_null_equal():
    assert normalize([[None, 1]], ["a", "b"]) == [(None, 1)]
    assert equal(res(["a"], [[None]]), res(["a"], [[None]]), ordered=True)
    assert not equal(res(["a"], [[None]]), res(["a"], [[""]]), ordered=True)
    assert not equal(res(["a"], [[None]]), res(["a"], [[0]]), ordered=True)


def test_date_iso():
    rows = [[
        datetime.date(2024, 3, 1),
        datetime.datetime(2024, 3, 1, 16, 30, 0),
        datetime.datetime(2024, 3, 1, 16, 30, 0, 500000),
        datetime.time(9, 5, 0),
    ]]
    assert normalize(rows, ["d", "ts", "ts2", "t"]) == [
        ("2024-03-01", "2024-03-01 16:30:00", "2024-03-01 16:30:00.5", "09:05:00")
    ]
    # PostgreSQL text output for the same values
    pg = res(["d", "ts", "ts2", "t"], [["2024-03-01", "2024-03-01 16:30:00", "2024-03-01 16:30:00.5", "09:05:00"]])
    assert equal(res(["d", "ts", "ts2", "t"], rows), pg, ordered=True)


def test_unordered_multiset():
    a = res(["x"], [[1], [2], [2]])
    assert equal(a, res(["x"], [[2], [1], [2]]), ordered=False)
    # duplicates count: {1, 2, 2} != {1, 1, 2}
    assert not equal(a, res(["x"], [[1], [1], [2]]), ordered=False)
    assert not equal(a, res(["x"], [[1], [2]]), ordered=False)


def test_ordered_order_matters():
    a = res(["x"], [[1], [2]])
    assert equal(a, res(["x"], [[1], [2]]), ordered=True)
    assert not equal(a, res(["x"], [[2], [1]]), ordered=True)


def test_column_count_mismatch_unequal():
    assert not equal(res(["a", "b"], [[1, 2]]), res(["a"], [[1]]), ordered=False)
    # also when both results are empty
    assert not equal(res(["a", "b"], []), res(["a"], []), ordered=True)
    # column names are not compared (Firebird reports them upper case)
    assert equal(res(["NAME"], [["x"]]), res(["name"], [["x"]]), ordered=True)


def test_normalize_rejects_ragged_rows():
    with pytest.raises(ValueError):
        normalize([[1, 2], [3]], ["a", "b"])


def test_normalize_is_idempotent():
    rows = [[Decimal("2.50"), "a  ", datetime.date(2024, 1, 2), True, None, 7]]
    once = normalize(rows, list("abcdef"))
    assert normalize([list(r) for r in once], list("abcdef")) == once
