from apps.core.sanitizer import plain_text, sanitize_html


def test_sanitizer_removes_word_markup_and_unsafe_urls() -> None:
    cleaned = sanitize_html(
        '<p class="MsoNormal" style="color:red">Teks '
        '<a href="file:///C:/berkas.docx">lokal</a> '
        '<img src="x" onerror="alert(1)"></p>'
        "<o:p>word</o:p><script>alert(1)</script>"
    )

    assert "MsoNormal" not in cleaned
    assert "style=" not in cleaned
    assert "file:///" not in cleaned
    assert "onerror" not in cleaned
    assert "<script" not in cleaned
    assert "Teks" in plain_text(cleaned)


def test_sanitizer_keeps_safe_editor_markup_and_secures_links() -> None:
    cleaned = sanitize_html('<h2>Judul</h2><a href="https://example.test">Situs</a>')

    assert "<h2>Judul</h2>" in cleaned
    assert 'rel="noopener noreferrer"' in cleaned
