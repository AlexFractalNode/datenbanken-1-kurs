"""fb_runner must warn visibly when firebird-driver private APIs are missing."""
import types

import fb_runner


def test_cancel_warns_when_private_api_missing(capsys):
    fb_runner._WARNED.clear()
    con = types.SimpleNamespace()  # no _att
    d = fb_runner.Deadline(con, 1000)
    d._fire()
    assert d.fired
    assert "_att.cancel_operation" in capsys.readouterr().err


def test_char_columns_warns_when_private_api_missing(capsys):
    fb_runner._WARNED.clear()
    cur = types.SimpleNamespace()  # no _stmt
    assert fb_runner._char_columns(cur) is None
    assert "_out_desc" in capsys.readouterr().err


def test_warning_only_once(capsys):
    fb_runner._WARNED.clear()
    cur = types.SimpleNamespace()
    fb_runner._char_columns(cur)
    fb_runner._char_columns(cur)
    assert capsys.readouterr().err.count("_out_desc") == 1
