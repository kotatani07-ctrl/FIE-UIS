import re
from html import unescape

import nh3

ALLOWED_TAGS = {
    "p",
    "br",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "a",
    "strong",
    "em",
    "blockquote",
    "figure",
    "figcaption",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "code",
    "pre",
    "hr",
}
ALLOWED_ATTRIBUTES = {
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "width", "height", "loading"},
    "td": {"colspan", "rowspan"},
    "th": {"colspan", "rowspan"},
}
_TAG_PATTERN = re.compile(r"<[^>]*>")


def sanitize_html(value: str) -> str:
    """Keep editor markup safe and predictable for every later renderer."""
    return nh3.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes={"http", "https", "mailto", "tel"},
        link_rel="noopener noreferrer",
    )


def plain_text(value: str) -> str:
    return unescape(_TAG_PATTERN.sub(" ", value)).strip()
