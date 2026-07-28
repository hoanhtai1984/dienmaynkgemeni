"""Rule-based chatbot: keyword/intent matching + product lookup against the live
database. No external LLM API key is configured for this project, so this trades
open-ended conversation for something that actually answers correctly every time
using real store data and the same policy text as the info pages.

Every match in this file goes through `normalize()` (lowercase + strip Vietnamese
diacritics + strip punctuation) and, for bounded vocabularies (FAQ keywords,
attribute names, category names), `fuzzy_phrase_in()` which also tolerates minor
typos. This means a customer can type "BẢO HÀNH", "bao hanh", or "bao hnah" and
get the same answer. Product name/brand matching is done in Python against the
whole (small) catalog rather than via SQL LIKE, so the same normalization applies
there too without fighting MySQL's collation behavior.
"""

import difflib
import json
import re
import unicodedata

import jwt
from fastapi import APIRouter, Header
from pydantic import BaseModel
from sqlalchemy import text

from ..config import JWT_SECRET
from ..db import SessionLocal

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    # ids of the products shown in the bot's last reply, sent back by the client
    # so a context-dependent follow-up ("Có hàng sẵn không?" with no product
    # named in the message itself) resolves against what was just discussed
    # instead of falling through to an unrelated catalog-wide search.
    context_product_ids: list[int] = []


class ChatResponse(BaseModel):
    reply: str
    products: list[dict] = []


# Templates, not final strings - {hotline}/{company_name}/etc. get filled in
# per-request from the SiteSettings table (see load_settings()) so admin
# changes to the hotline/company info show up immediately, no ai-service
# restart needed.
DONT_UNDERSTAND_REPLY_TEMPLATE = (
    "Xin lỗi, mình không hiểu câu hỏi của bạn. Bạn có thể hỏi về sản phẩm cụ thể, "
    "bảo hành, đổi trả, vận chuyển, thanh toán, hoặc gọi hotline {hotline} để được hỗ trợ trực tiếp."
)

CLARIFY_PRODUCT_REPLY = "Bạn có thể cho mình biết cụ thể mã sản phẩm hoặc hãng sản xuất được không?"

# Public business registration info only - name, MSDN, address. Member/shareholder
# details, capital, legal representative etc. from the giấy phép kinh doanh are
# intentionally excluded per owner's instruction. Sourced from SiteSettings, not
# hardcoded (admin edits at /admin/settings).
COMPANY_REPLY_TEMPLATE = (
    "Website Điện Máy NK được vận hành bởi {company_name}. "
    "Mã số doanh nghiệp: {company_tax_code}. Địa chỉ trụ sở: {address}."
)

DEFAULT_SETTINGS = {
    "hotline": "0971 370 152",
    "email": "hoanhtaipro@gmail.com",
    "address": "860/16 An Dương Vương, Phường Phú Lâm, Thành phố Hồ Chí Minh",
    "company_name": "Công ty TNHH Thương Mại và Dịch Vụ Kone",
    "company_tax_code": "0318653314",
    "working_hours": "8:00 - 21:00, tất cả các ngày trong tuần",
}

# Canonical Vietnamese phrase per rule is enough - normalize() + fuzzy_phrase_in()
# below handle case, missing diacritics, and small typos, so we no longer need to
# spell out "bảo hành" AND "bao hanh" AND "bao hnah" by hand for every entry.
FAQ_RULES = [
    (
        ["công ty", "cty", "doanh nghiệp", "mã số doanh nghiệp", "trụ sở",
         "địa chỉ công ty", "cửa hàng ở đâu", "shop ở đâu"],
        COMPANY_REPLY_TEMPLATE,
    ),
    (
        ["vợ"],
        "Cô ấy là Phương Dung, một người vợ, người mẹ tuyệt vời, tuy có hơi hung dữ, "
        "hơi lùn, đùi hơi bự nhưng yêu thương chồng con vô bờ bến.",
    ),
    (["bảo hành", "bh"], "Sản phẩm tại Điện Máy NK được bảo hành chính hãng 12-24 tháng tùy loại. Xem chi tiết tại trang Chính sách bảo hành."),
    (["đổi trả", "trả hàng"], "Điện Máy NK áp dụng đổi mới trong 35 ngày đầu nếu sản phẩm lỗi do nhà sản xuất. Xem chi tiết tại trang Chính sách đổi trả."),
    (["giao hàng", "vận chuyển", "ship"], "Nội thành TP.HCM giao trong 2 giờ, các tỉnh khác từ 1-3 ngày làm việc. Xem chi tiết tại trang Chính sách vận chuyển."),
    (["thanh toán", "trả góp"], "Điện Máy NK hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, và trả góp 0% qua thẻ tín dụng cho một số sản phẩm."),
    (["hotline", "liên hệ", "số điện thoại"], "Bạn có thể gọi hotline {hotline} ({working_hours}) hoặc gửi yêu cầu qua trang Liên hệ."),
    (["bạn tên", "tên bạn", "bạn là ai"], "Mình là trợ lý ảo của Điện Máy NK, được lập trình để hỗ trợ tra cứu sản phẩm và trả lời câu hỏi về đơn hàng, bảo hành, đổi trả, vận chuyển. Bạn cần mình giúp gì không?"),
    (["xin chào", "hello", "chào", "chào bạn"], "Xin chào! Mình là trợ lý ảo của Điện Máy NK. Bạn cần tìm sản phẩm gì hay có thắc mắc về đơn hàng, bảo hành, vận chuyển không?"),
    (
        ["hướng dẫn mua hàng", "cách mua hàng", "làm sao mua hàng", "làm sao đặt hàng",
         "cách đặt hàng", "mua hàng như thế nào", "đặt hàng như thế nào", "đặt hàng thế nào"],
        "Bạn chỉ cần chọn sản phẩm ưng ý, nhấn \"Thêm vào giỏ hàng\", sau đó vào trang Giỏ hàng điền "
        "thông tin giao hàng (họ tên, số điện thoại, địa chỉ) và xác nhận đặt hàng. Nhân viên Điện Máy NK "
        "sẽ liên hệ xác nhận đơn hàng và giao đến bạn. Xem chi tiết tại trang Hướng dẫn mua hàng.",
    ),
    (
        ["chính hãng", "hàng thật", "hàng giả", "nguồn gốc xuất xứ"],
        "Tất cả sản phẩm tại Điện Máy NK đều là hàng chính hãng 100%, có đầy đủ tem bảo hành, phiếu bảo "
        "hành điện tử và nguồn gốc xuất xứ rõ ràng từ nhà phân phối ủy quyền.",
    ),
]

# Each entry: canonical phrases a customer might mean, and the substrings to look
# for inside a product's `specs` JSON keys (specs are freeform per product - not
# every product has every attribute, e.g. an AC unit typically has no "kích
# thước" entry). Substrings are matched after the same normalize() as everything
# else, so they must already be diacritic-stripped, lowercase.
ATTRIBUTE_CATEGORIES = [
    {"label": "bảo hành", "query_kws": ["bảo hành", "bh"], "spec_substrings": ["bao hanh"]},
    {"label": "khối lượng/cân nặng", "query_kws": ["nặng", "cân nặng", "trọng lượng", "khối lượng"], "spec_substrings": ["khoi luong", "trong luong"]},
    {"label": "kích thước", "query_kws": ["kích thước", "kích cỡ", "chiều dài", "chiều rộng", "chiều cao", "dài rộng"], "spec_substrings": ["kich thuoc"]},
    {"label": "công suất", "query_kws": ["công suất"], "spec_substrings": ["cong suat"]},
    {"label": "dung tích", "query_kws": ["dung tích"], "spec_substrings": ["dung tich"]},
    {"label": "chất liệu", "query_kws": ["chất liệu"], "spec_substrings": ["chat lieu"]},
    {"label": "màu sắc", "query_kws": ["màu sắc"], "spec_substrings": ["mau"]},
    {"label": "công nghệ", "query_kws": ["công nghệ"], "spec_substrings": ["cong nghe"]},
    {"label": "bộ nhớ", "query_kws": ["bộ nhớ"], "spec_substrings": ["bo nho"]},
    {"label": "dung lượng pin", "query_kws": ["dung lượng pin"], "spec_substrings": ["pin"]},
    {"label": "độ phân giải", "query_kws": ["độ phân giải"], "spec_substrings": ["do phan giai"]},
    {"label": "thương hiệu", "query_kws": ["hãng sản xuất", "thương hiệu"], "spec_substrings": ["thuong hieu"]},
]

# Availability/stock questions ("Có hàng sẵn không?", "Còn hàng không?"). Listed
# longest-first so extract_keyword_words strips the whole "... không/chưa"
# question tag as one unit - stripping just "còn hàng" and leaving a bare
# "không" behind would wrongly survive into keyword_words (it's deliberately
# NOT a filler word, see FILLER_WORDS note) and misfire a catalog-wide search.
STOCK_PHRASES = [
    "còn hàng không", "có hàng không", "hàng sẵn không", "có sẵn không", "còn sẵn không",
    "hết hàng chưa", "còn hàng chưa",
    "còn hàng", "có hàng", "hàng sẵn", "có sẵn", "hết hàng",
]


def drop_bare_negation(keyword_words: list[str]) -> list[str]:
    """A leftover bare "không" after stripping a yes/no-style intent phrase
    (stock/promotion questions) is just the question tag, not a real product
    keyword - drop it when it's the only word left. A filler word like "gì"
    inserted between the phrase and "không" ("khuyến mãi GÌ không") already
    gets filtered by SEARCH_STOPWORDS regardless of position, so this only
    ever fires on a truly empty-of-content leftover. Never touches "không" as
    part of a real product name - that always keeps a second word alongside
    it (e.g. "không dầu"/"không dây"), so keyword_words there has length > 1."""
    if keyword_words == ["khong"]:
        return []
    return keyword_words


def find_stock_intent(message_words: list[str]) -> bool:
    return any(fuzzy_phrase_in(message_words, phrase) for phrase in STOCK_PHRASES)


def build_stock_reply(product: dict, hotline: str) -> str:
    name = product["name"]
    stock = product.get("stock") or 0
    if stock > 0:
        return f"{name} hiện còn hàng (còn {stock} sản phẩm), bạn có thể đặt hàng ngay."
    return (
        f"{name} hiện đang tạm hết hàng. Bạn để lại thông tin liên hệ để được báo khi có hàng lại, "
        f"hoặc gọi hotline {hotline} để được tư vấn sản phẩm thay thế."
    )


# "Có khuyến mãi không?"/"có giảm giá không?" - a customer asking about a
# promotion means asking whether there's a discount, so this is answered by
# comparing a product's real price against its oldPrice, not a canned reply.
PROMOTION_PHRASES = ["khuyến mãi", "giảm giá", "ưu đãi", "có sale", "sale không", "giá sốc"]


def find_promotion_intent(message_words: list[str]) -> bool:
    return any(fuzzy_phrase_in(message_words, phrase) for phrase in PROMOTION_PHRASES)


def format_vnd(amount: int) -> str:
    return f"{amount:,}".replace(",", ".") + "đ"


def discount_percent(product: dict) -> int:
    old_price = product.get("oldPrice") or product["price"]
    if old_price <= product["price"]:
        return 0
    return round((old_price - product["price"]) / old_price * 100)


def build_promotion_reply(product: dict) -> str:
    name = product["name"]
    percent = discount_percent(product)
    if percent > 0:
        old_price = product.get("oldPrice") or product["price"]
        return (
            f"{name} hiện đang được giảm giá {percent}%, còn {format_vnd(product['price'])} "
            f"(giá gốc {format_vnd(old_price)})."
        )
    return f"{name} hiện chưa có chương trình giảm giá, giá bán là {format_vnd(product['price'])}."


# Common Vietnamese function/filler words - never meaningful as a product search
# term on their own (prevents e.g. a bare "gì" from misfiring a DB search).
FILLER_WORDS = {
    "ten", "gi", "la", "ai", "sao", "vay", "a", "nhe", "nha", "oi", "nao", "dau",
    "khi", "nay", "do", "kia", "va", "hay", "hoac", "nhi", "the", "hom", "bao",
    "nhieu", "cua", "lau", "roi", "chua", "duoc",
    # NOTE: deliberately NOT filtering "khong" - it's negation ("bao hanh khong?")
    # in chit-chat but also a real, load-bearing word in product names like "noi
    # chien khong dau" (air fryer). Filtering it broke that product search entirely.
    # NOTE: also deliberately NOT filtering "may" - it's the filler word "mấy"
    # (how many) in chit-chat, but diacritic-stripping makes it identical to
    # "máy" (machine), which is load-bearing in nearly every category name
    # ("Máy Lạnh", "Máy Giặt", ...). Filtering it broke product search broadly.
}

SEARCH_STOPWORDS = FILLER_WORDS | {
    "toi", "muon", "tim", "can", "mua", "san", "pham", "gia", "hoi", "ban",
    "shop", "cua", "hang", "co",
}


def strip_diacritics(s: str) -> str:
    s = s.replace("đ", "d").replace("Đ", "D")
    nfd = unicodedata.normalize("NFD", s)
    return "".join(ch for ch in nfd if unicodedata.category(ch) != "Mn")


# Spelling variants too different (or too short) for fuzzy/condensed matching
# to bridge on their own - "tivi" is only 4 chars (below the 5-char fuzzy
# floor), and "cafe" uses an "f" where the real word has "ph", which no
# amount of whitespace-collapsing fixes. (word, canonical) pairs, applied as
# whole-word substitutions inside normalize() so every consumer benefits.
WORD_VARIANTS = [
    ("ti vi", "tivi"),
    ("caphe", "ca phe"),
    ("cafe", "ca phe"),
]


def normalize(s: str) -> str:
    """lowercase + strip accents + collapse punctuation to spaces - the one
    normalization used everywhere so matching ignores case, diacritics, and
    (combined with fuzzy_phrase_in) minor typos."""
    s = strip_diacritics(s).lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    # "5l"/"5 l" -> "5 lit": customers commonly abbreviate lít (liters) as a
    # bare "l" right after the number, but product specs are stored spelled
    # out ("... 6 Lít" -> "6 lit"); without this the capacity word never
    # lines up with the product text and the number gets silently ignored.
    s = re.sub(r"\b(\d+) ?l\b", r"\1 lit", s)
    # "55in"/"55 in" -> "55 inch": same idea for TV/monitor screen sizes.
    s = re.sub(r"\b(\d+) ?in\b", r"\1 inch", s)
    for variant, canonical in WORD_VARIANTS:
        s = re.sub(rf"\b{re.escape(variant)}\b", canonical, s)
    return s


def _word_matches(word: str, target: str, threshold: float) -> bool:
    if word == target:
        return True
    # Only fuzzy-match words specific enough (>=5 chars after normalizing) -
    # short words have too many accidental near-matches: "hi" once
    # false-positived inside "chien", "tiet" inside "Tiet Kiem Dien", and
    # (at a 4-char minimum) "ngang" (lồng ngang) matched "nang" (nặng) at a
    # 0.89 ratio despite being unrelated words.
    if len(target) < 5:
        return False
    return difflib.SequenceMatcher(None, word, target).ratio() >= threshold


def fuzzy_phrase_in(message_words: list[str], phrase: str, threshold: float = 0.75) -> bool:
    phrase_words = normalize(phrase).split()
    n = len(phrase_words)
    if n == 0:
        return False
    if n <= len(message_words):
        for i in range(len(message_words) - n + 1):
            window = message_words[i:i + n]
            if all(_word_matches(w, p, threshold) for w, p in zip(window, phrase_words)):
                return True
    # Customers don't always split words where the catalog does - "ti vi" for
    # "tivi", "chaoban" for "chào bạn". Collapsing whitespace on both sides
    # and checking substring containment catches this regardless of which
    # side has the extra/missing space, without needing a hand-written rule
    # per case. Length-gated so it can't fire on short phrases like "bh",
    # which would otherwise match almost any long merged message by chance.
    condensed_phrase = "".join(phrase_words)
    if len(condensed_phrase) >= 5 and condensed_phrase in "".join(message_words):
        return True
    return False


def find_faq_reply(message_words: list[str], settings: dict) -> str | None:
    for keywords, reply in FAQ_RULES:
        if any(fuzzy_phrase_in(message_words, kw) for kw in keywords):
            return reply.format(**settings)
    return None


def find_attribute_intent(message_words: list[str]):
    """Returns (matched_categories, matched_query_phrases) for attribute-style
    questions like "...bảo hành bao lâu?" / "...nặng bao nhiêu?". Collects
    EVERY matching query phrase per category (not just the first) - e.g.
    "chiều dài rộng" contains both "chiều dài" and "chiều rộng", and both
    need to be stripped later or "rộng" leaks through as a bogus product
    keyword and breaks the product match."""
    matched_categories = []
    matched_phrases = []
    for category in ATTRIBUTE_CATEGORIES:
        category_matched = False
        for kw in category["query_kws"]:
            if fuzzy_phrase_in(message_words, kw):
                matched_phrases.append(kw)
                category_matched = True
        if category_matched:
            matched_categories.append(category)
    return matched_categories, matched_phrases


def load_products(session):
    rows = session.execute(
        text(
            """
            SELECT p.id, p.slug, p.name, p.brand, p.price, p.oldPrice, p.specs, p.subCategoryId, p.sold, p.stock,
                   (SELECT pi.url FROM `ProductImage` pi WHERE pi.productId = p.id ORDER BY pi.position ASC LIMIT 1) AS image
            FROM `Product` p
            """
        )
    ).mappings().all()

    products = []
    for row in rows:
        product = dict(row)
        specs = product["specs"]
        product["specs"] = json.loads(specs) if isinstance(specs, str) else (specs or {})
        product["_name_norm"] = normalize(product["name"])
        product["_brand_norm"] = normalize(product["brand"])
        products.append(product)
    return products


def load_settings(session) -> dict:
    """Fresh per-request read of the SiteSettings singleton row (same pattern as
    load_products above) so admin edits at /admin/settings - hotline included -
    show up immediately, without an ai-service restart.

    `hotline` here resolves to `chatbotPhone` when the admin has set one (a
    number specific to the chatbot, separate from the header/footer hotline),
    falling back to the regular `hotline` otherwise - the rest of this file
    just reads settings["hotline"] and doesn't need to know which source it
    came from."""
    row = session.execute(
        text(
            """
            SELECT COALESCE(NULLIF(chatbotPhone, ''), hotline) AS hotline,
                   email, address, companyName AS company_name,
                   companyTaxCode AS company_tax_code, workingHours AS working_hours
            FROM `SiteSettings` WHERE id = 1
            """
        )
    ).mappings().first()
    return dict(row) if row else DEFAULT_SETTINGS


def load_subcategories(session):
    """(normalized phrase, subCategoryId) pairs. A SubCategory display name like
    "Tủ Lạnh, Tủ Đông, Tủ Mát" becomes 3 separately-matchable phrases - customers
    say "tủ lạnh", not the full compound name."""
    rows = session.execute(text("SELECT id, name FROM `SubCategory`")).mappings().all()
    lookup = []
    for row in rows:
        for phrase in row["name"].split(","):
            phrase = phrase.strip()
            if phrase:
                lookup.append((normalize(phrase), row["id"]))
    return lookup


def load_brands(session):
    rows = session.execute(text("SELECT DISTINCT brand FROM `Product`")).mappings().all()
    return [(normalize(row["brand"]), row["brand"]) for row in rows]


def find_brand(words: list[str], brands: list[tuple[str, str]]) -> str | None:
    matched = None
    matched_len = 0
    for norm_brand, orig_brand in brands:
        if len(norm_brand) > matched_len and fuzzy_phrase_in(words, norm_brand):
            matched = orig_brand
            matched_len = len(norm_brand)
    return matched


# "tr"/"trieu"/"t" for triệu (million), "k"/"nghin" for nghìn (thousand) -
# customers commonly abbreviate ("2 tr", "4t", "500k") rather than spelling
# the unit out fully.
PRICE_UNIT_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*(trieu|tr|t|nghin|k)\b")
MILLION_UNITS = {"trieu", "tr", "t"}
UNDER_RE = re.compile(r"\b(duoi|nho hon|khong qua|toi da)\b")
OVER_RE = re.compile(r"\b(tren|lon hon)\b")
# NOTE: deliberately not matching "tu" ("từ" = from/starting-at) as an "over"
# qualifier - it normalizes identically to "tủ" (cabinet), which shows up
# constantly in category words like "tủ lạnh". Too ambiguous to use safely.


def parse_price_constraint(message_norm: str):
    """"dưới 6 triệu"/"dưới 6tr"/"dưới 6t" -> ("lte", 6_000_000); "trên 6
    triệu" -> ("gte", ...); a bare "6 triệu" with no qualifier -> ("approx",
    ...), matched within ±20%. Returns None if no price+unit pattern is
    present at all."""
    match = PRICE_UNIT_RE.search(message_norm)
    if not match:
        return None
    value = float(match.group(1).replace(",", "."))
    unit = match.group(2)
    if unit in MILLION_UNITS:
        # A number already >= 1000 right before "triệu"/"tr"/"t" is
        # realistically already a full VND amount typed out in full (e.g.
        # "4500000tr" meaning "4.500.000đ", i.e. 4,5 triệu) - nobody means
        # "4,500,000 triệu". Only genuinely small counts get multiplied out.
        amount = value if value >= 1000 else value * 1_000_000
    else:
        amount = value * 1_000
    prefix = message_norm[:match.start()]
    if UNDER_RE.search(prefix):
        return ("lte", amount)
    if OVER_RE.search(prefix):
        return ("gte", amount)
    return ("approx", amount)


def to_card(product: dict) -> dict:
    return {
        "id": product["id"],
        "slug": product.get("slug"),
        "name": product["name"],
        "brand": product["brand"],
        "price": product["price"],
        "image": product["image"],
    }


def extract_keyword_words(message_words: list[str], extra_strip_phrases: list[str] = ()) -> list[str]:
    words = list(message_words)
    for phrase in extra_strip_phrases:
        phrase_words = normalize(phrase).split()
        n = len(phrase_words)
        i = 0
        while i <= len(words) - n:
            if all(_word_matches(words[i + j], phrase_words[j], 0.75) for j in range(n)):
                del words[i:i + n]
            else:
                i += 1

    # Keep bare digit tokens even though they're 1 char (e.g. "5" from "5
    # lít") - a requested capacity/size number is a real, load-bearing search
    # constraint, not noise; dropping it let a 6L product silently match a
    # request for 5L.
    content_words = [w for w in words if w not in SEARCH_STOPWORDS and (len(w) > 1 or w.isdigit())]
    return content_words[:6]


def find_full_matches(products: list[dict], keyword_words: list[str]) -> list[dict]:
    """Products whose name+brand contains every word in keyword_words (each word
    matched fuzzily, order-independent). Requiring ALL words - not just one - to
    be present is what keeps this safe from short-word false positives like
    "tiết" (from "thời tiết") matching "... Tiết Kiệm Điện": a real product would
    also need to contain "thời" somewhere, which none do."""
    if not keyword_words:
        return []

    matches = []
    for product in products:
        haystack = (product["_name_norm"] + " " + product["_brand_norm"]).split()
        if all(any(_word_matches(h, kw, 0.84) for h in haystack) for kw in keyword_words):
            matches.append(product)

    matches.sort(key=lambda p: -p.get("sold", 0))
    return matches


NUMBER_RE = re.compile(r"\d+")
PRICE_TOKEN_RE = re.compile(r"^\d+(?:[.,]\d+)?(?:trieu|tr|t|nghin|k)?$")
PRICE_QUALIFIER_WORDS = {"duoi", "tren", "nho", "hon", "khong", "qua", "da", "lon"}
CAPACITY_UNIT_RE = re.compile(r"(\d+)\s*lit\b")


def parse_capacity_constraint(message_norm: str):
    """"trên 260 lít" -> ("gt", 260); "dưới 260 lít" -> ("lt", 260). A bare
    "260 lít" with no dưới/trên qualifier returns None - that case is left to
    the exact-token spec match below (don't show a 322L fridge for a plain
    "tủ lạnh 260 lít" search just because it's "close")."""
    match = CAPACITY_UNIT_RE.search(message_norm)
    if not match:
        return None
    amount = int(match.group(1))
    prefix = message_norm[:match.start()]
    if UNDER_RE.search(prefix):
        return ("lt", amount)
    if OVER_RE.search(prefix):
        return ("gt", amount)
    return None


def extract_capacity(name_norm: str):
    match = CAPACITY_UNIT_RE.search(name_norm)
    return int(match.group(1)) if match else None


def search_catalog(session, products: list[dict], message_norm: str, words: list[str], limit: int = 8):
    """Browse-style search combining whichever of these the message names:
    category ("tủ lạnh"), brand ("Casper"), a price constraint ("dưới 6
    triệu"), or a capacity constraint ("trên 260 lít"). Returns None when
    NONE of these are detected at all (caller should fall back to the
    narrower phrase search); otherwise returns (cards, note) - note is set
    only when the results are a fallback tier (e.g. no fridge over the
    requested capacity, so the closest one under it is shown instead) and
    should replace the generic "found N products" reply.

    Brand and price are matched as real, separate filters (not "does the
    number 6 appear anywhere in the name", which used to also match things
    like "... Mới 2026") - a customer asking for one brand should never see
    other brands in the results. Price is filtered exactly first too, but
    falls back to the closest priced item(s) with an explicit "not an exact
    match" note when nothing in stock actually fits the budget, rather than
    a flat "not found".
    """
    sub_id = None
    matched_len = 0
    for phrase, s_id in load_subcategories(session):
        if len(phrase) > matched_len and fuzzy_phrase_in(words, phrase):
            sub_id = s_id
            matched_len = len(phrase)

    brand = find_brand(words, load_brands(session))
    price_constraint = parse_price_constraint(message_norm)

    if sub_id is None and brand is None and price_constraint is None:
        return None

    candidates = products
    if sub_id is not None:
        candidates = [p for p in candidates if p["subCategoryId"] == sub_id]
    if brand is not None:
        candidates = [p for p in candidates if p["_brand_norm"] == normalize(brand)]

    if sub_id is None and brand is None:
        # Neither a recognized category nor a recognized brand was found, so
        # this only got here on a price/capacity match (e.g. "nồi chiên dưới
        # 2 triệu" - "nồi chiên" isn't itself a subcategory name, it's a
        # product type). Narrow to that product type FIRST, before applying
        # any price cascade below - otherwise the cascade runs over every
        # product in the whole catalog, finds plenty of unrelated items
        # under/over the price, and never falls through to the "closest
        # match" case for the actual product asked about.
        leftover_words = [
            w for w in extract_keyword_words(words)
            if w not in PRICE_QUALIFIER_WORDS and not PRICE_TOKEN_RE.match(w)
        ]
        if leftover_words:
            candidates = find_full_matches(candidates, leftover_words)

    note = None
    if price_constraint is not None:
        # Same cascade as the capacity constraint below: prefer an exact
        # match, but a customer asking for "dưới 2tr" would rather see the
        # closest priced option than a flat "not found" when nothing in
        # stock actually fits - as long as it's clearly labeled as not an
        # exact match, never silently passed off as one.
        op, amount = price_constraint
        if op == "lte":
            better = [p for p in candidates if p["price"] <= amount]
            worse = sorted((p for p in candidates if p["price"] > amount), key=lambda p: p["price"])
            if better:
                candidates = better
            elif worse:
                candidates = worse[:3]
                note = "Hiện tại Điện Máy NK chưa có sản phẩm đúng mức giá bạn cần, mình gợi ý sản phẩm gần nhất (nhỉnh hơn một chút):"
            else:
                candidates = []
        elif op == "gte":
            better = [p for p in candidates if p["price"] >= amount]
            worse = sorted((p for p in candidates if p["price"] < amount), key=lambda p: -p["price"])
            if better:
                candidates = better
            elif worse:
                candidates = worse[:3]
                note = "Hiện tại Điện Máy NK chưa có sản phẩm đúng mức giá bạn cần, mình gợi ý sản phẩm gần nhất (thấp hơn một chút):"
            else:
                candidates = []
        else:  # "approx" - bare "6 triệu" with no dưới/trên qualifier
            band = [p for p in candidates if amount * 0.8 <= p["price"] <= amount * 1.2]
            if band:
                candidates = band
            else:
                nearest = sorted(candidates, key=lambda p: abs(p["price"] - amount))[:3]
                candidates = nearest
                if candidates:
                    note = "Hiện tại Điện Máy NK chưa có sản phẩm đúng khoảng giá đó, mình gợi ý sản phẩm gần mức giá bạn cần nhất:"
    elif sub_id is not None:
        capacity_constraint = parse_capacity_constraint(message_norm)
        if capacity_constraint is not None:
            # "trên X lít"/"dưới X lít": prefer a strictly-better match, but
            # a customer asking for "over 260 lít" would rather see the 260L
            # unit (or, failing that, the closest smaller one) than nothing -
            # so cascade instead of just returning empty.
            op, amount = capacity_constraint
            with_cap = [(p, extract_capacity(p["_name_norm"])) for p in candidates]
            with_cap = [(p, cap) for p, cap in with_cap if cap is not None]
            if op == "gt":
                better = [p for p, cap in with_cap if cap > amount]
                same = [p for p, cap in with_cap if cap == amount]
                worse = [p for p, _ in sorted(
                    (item for item in with_cap if item[1] < amount), key=lambda item: -item[1]
                )]
            else:  # "lt"
                better = [p for p, cap in with_cap if cap < amount]
                same = [p for p, cap in with_cap if cap == amount]
                worse = [p for p, _ in sorted(
                    (item for item in with_cap if item[1] > amount), key=lambda item: item[1]
                )]
            if better:
                candidates = better
            elif same:
                candidates = same
                note = "Hiện tại chưa có sản phẩm cao hơn yêu cầu, mình gợi ý sản phẩm có thông số bằng đúng yêu cầu của bạn, bạn xem thử nhé:" if op == "gt" else "Hiện tại chưa có sản phẩm thấp hơn yêu cầu, mình gợi ý sản phẩm có thông số bằng đúng yêu cầu của bạn, bạn xem thử nhé:"
            elif worse:
                candidates = worse[:3]
                note = "Hiện tại chưa có sản phẩm bằng hoặc cao hơn yêu cầu, mình gợi ý sản phẩm gần nhất (thấp hơn yêu cầu một chút):" if op == "gt" else "Hiện tại chưa có sản phẩm bằng hoặc thấp hơn yêu cầu, mình gợi ý sản phẩm gần nhất (cao hơn yêu cầu một chút):"
            else:
                candidates = []
        else:
            # No dưới/trên qualifier - fall back to the "spec value embedded
            # in the name" heuristic (capacity/size like "400 lít"), using
            # numbers that aren't already consumed by a price pattern.
            # Matched as a whole NAME TOKEN, not a substring - "in
            # p['_name_norm']" once matched "55" inside the model number
            # "43P755" and wrongly returned a 43-inch TV for a "55 inch"
            # search.
            numbers = NUMBER_RE.findall(message_norm)
            if numbers:
                candidates = [
                    p for p in candidates
                    if any(num in p["_name_norm"].split() for num in numbers[:2])
                ]

    candidates.sort(key=lambda p: -p.get("sold", 0))
    return [to_card(p) for p in candidates[:limit]], note


def build_attribute_reply(product: dict, categories: list[dict], hotline: str) -> str:
    specs = product["specs"]
    normalized_specs = {normalize(k): (k, v) for k, v in specs.items()}
    found_lines = []
    missing_labels = []

    for category in categories:
        match = None
        for target in category["spec_substrings"]:
            for norm_key, (orig_key, value) in normalized_specs.items():
                if target in norm_key:
                    match = (orig_key, value)
                    break
            if match:
                break
        if match:
            found_lines.append(f"{match[0]}: {match[1]}")
        else:
            missing_labels.append(category["label"])

    name = product["name"]
    if found_lines:
        reply = f"Theo thông số của {name}: " + "; ".join(found_lines) + "."
    else:
        reply = f"Xin lỗi, {name} hiện chưa có thông tin bạn hỏi trong hệ thống."

    if missing_labels:
        reply += (
            f" Riêng thông tin về {', '.join(missing_labels)} sản phẩm này chưa được cập nhật, "
            f"bạn có thể gọi hotline {hotline} để được tư vấn thêm."
        )

    return reply


def decode_customer_id(authorization: str | None) -> int | None:
    """Best-effort: returns the customer id from a `Bearer <token>` header if
    it's a valid, non-expired customer token, else None (treated as an
    anonymous chat - never rejects the request over this)."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(authorization[7:], JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    return payload.get("id") if payload.get("role") == "customer" else None


def log_chat_message(customer_id: int | None, message: str, reply: str) -> None:
    # A reply that points the customer to the hotline means the bot couldn't
    # fully resolve the question itself - a reasonable proxy for "this
    # conversation needs human follow-up" without hand-listing every fallback
    # branch that can produce that outcome.
    needs_help = "hotline" in reply.lower()
    session = SessionLocal()
    try:
        session.execute(
            text(
                """
                INSERT INTO `ChatMessage` (customerId, message, reply, needsHelp, createdAt)
                VALUES (:customer_id, :message, :reply, :needs_help, NOW())
                """
            ),
            {"customer_id": customer_id, "message": message, "reply": reply, "needs_help": needs_help},
        )
        session.commit()
    finally:
        session.close()


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, authorization: str | None = Header(default=None)):
    response = _chat_logic(payload)
    customer_id = decode_customer_id(authorization)
    log_chat_message(customer_id, payload.message.strip(), response.reply)
    return response


def _chat_logic(payload: ChatRequest) -> ChatResponse:
    message = payload.message.strip()
    if not message:
        return ChatResponse(reply="Bạn cần hỗ trợ gì ạ?")

    message_norm = normalize(message)
    words = message_norm.split()

    session = SessionLocal()
    try:
        products = load_products(session)
        settings = load_settings(session)

        # Product-specific attribute question (e.g. "Daikin Inverter 1 HP bảo
        # hành bao lâu?") takes priority over the generic FAQ policy reply for
        # the same keyword, but only when a specific product is also named - a
        # bare "bảo hành bao lâu?" falls through to the general FAQ answer.
        attribute_categories, attribute_phrases = find_attribute_intent(words)
        if attribute_categories:
            keyword_words = extract_keyword_words(words, extra_strip_phrases=attribute_phrases)
            if keyword_words:
                matches_full = find_full_matches(products, keyword_words)
                if len(matches_full) == 1:
                    product = matches_full[0]
                    reply = build_attribute_reply(product, attribute_categories, settings["hotline"])
                    return ChatResponse(reply=reply, products=[to_card(product)])
                # 0 or 2+ matches from the narrow phrase search - try a broader
                # category+brand+price browse (handles e.g. "tủ lạnh 400 lít
                # bảo hành bao lâu?") before giving up and asking to clarify.
                search_result = search_catalog(session, products, message_norm, words)
                category_matches = search_result[0] if search_result is not None else None
                if category_matches:
                    if len(category_matches) == 1:
                        product = next(p for p in products if p["id"] == category_matches[0]["id"])
                        reply = build_attribute_reply(product, attribute_categories, settings["hotline"])
                        return ChatResponse(reply=reply, products=[to_card(product)])
                    return ChatResponse(
                        reply=(
                            f"Mình tìm thấy {len(category_matches)} sản phẩm phù hợp, bạn xem thử và cho mình "
                            "biết bạn quan tâm sản phẩm nào để mình tư vấn thêm nhé:"
                        ),
                        products=category_matches,
                    )
                return ChatResponse(reply=CLARIFY_PRODUCT_REPLY)
            # No product reference at all (e.g. plain "bảo hành bao lâu?") - treat
            # as a general policy question and fall through to FAQ rules below.

        # Availability question ("Có hàng sẵn không?", "Còn hàng không?"). Try to
        # resolve the target product from THIS message's own words first; if none
        # remain after stripping the stock phrase (a bare follow-up with nothing
        # else in it, e.g. right after the bot showed one product), fall back to
        # context_product_ids - the product(s) shown in the bot's previous reply -
        # instead of letting a leftover filler word misfire a catalog-wide search.
        if find_stock_intent(words):
            stock_keyword_words = drop_bare_negation(extract_keyword_words(words, extra_strip_phrases=STOCK_PHRASES))
            target_products = find_full_matches(products, stock_keyword_words) if stock_keyword_words else []

            if not target_products and payload.context_product_ids:
                products_by_id = {p["id"]: p for p in products}
                target_products = [
                    products_by_id[pid] for pid in payload.context_product_ids if pid in products_by_id
                ]

            if len(target_products) == 1:
                product = target_products[0]
                return ChatResponse(reply=build_stock_reply(product, settings["hotline"]), products=[to_card(product)])
            if len(target_products) > 1:
                target_products = target_products[:8]
                lines = [
                    f"- {p['name']}: "
                    + (f"còn hàng ({p['stock']} sản phẩm)" if (p.get('stock') or 0) > 0 else "hết hàng")
                    for p in target_products
                ]
                reply = "Tình trạng hàng của các sản phẩm bạn hỏi:\n" + "\n".join(lines)
                return ChatResponse(reply=reply, products=[to_card(p) for p in target_products])
            return ChatResponse(reply=CLARIFY_PRODUCT_REPLY)

        # Promotion/discount question ("Có khuyến mãi không?", "Sản phẩm này có
        # giảm giá không?") - answered by comparing real price vs oldPrice, same
        # message-then-context resolution as the stock question above. Unlike a
        # stock question, asking with no product named/in context at all is a
        # general "what's on sale" browse, not something to ask to clarify.
        if find_promotion_intent(words):
            promo_keyword_words = drop_bare_negation(extract_keyword_words(words, extra_strip_phrases=PROMOTION_PHRASES))
            target_products = find_full_matches(products, promo_keyword_words) if promo_keyword_words else []

            if not target_products and payload.context_product_ids:
                products_by_id = {p["id"]: p for p in products}
                target_products = [
                    products_by_id[pid] for pid in payload.context_product_ids if pid in products_by_id
                ]

            if len(target_products) == 1:
                product = target_products[0]
                return ChatResponse(reply=build_promotion_reply(product), products=[to_card(product)])
            if len(target_products) > 1:
                target_products = target_products[:8]
                lines = [
                    f"- {p['name']}: "
                    + (
                        f"giảm {discount_percent(p)}%, còn {format_vnd(p['price'])}"
                        if discount_percent(p) > 0
                        else "chưa có khuyến mãi"
                    )
                    for p in target_products
                ]
                reply = "Thông tin khuyến mãi của các sản phẩm bạn hỏi:\n" + "\n".join(lines)
                return ChatResponse(reply=reply, products=[to_card(p) for p in target_products])

            discounted = sorted(
                (p for p in products if discount_percent(p) > 0),
                key=lambda p: -discount_percent(p),
            )[:8]
            if discounted:
                return ChatResponse(
                    reply="Hiện Điện Máy NK đang có khuyến mãi giảm giá cho các sản phẩm sau, bạn xem thử nhé:",
                    products=[to_card(p) for p in discounted],
                )
            return ChatResponse(
                reply=(
                    "Hiện tại chưa có chương trình giảm giá đặc biệt, nhưng giá tại Điện Máy NK luôn là giá tốt. "
                    "Bạn có thể theo dõi mục \"Giá Sốc Giờ Vàng\" trên trang chủ để cập nhật ưu đãi mới nhất."
                )
            )

        faq_reply = find_faq_reply(words, settings)
        if faq_reply:
            return ChatResponse(reply=faq_reply)

        # Specific phrase match first (e.g. "nồi chiên không dầu Panasonic" should
        # only return the Panasonic air fryer, not every Panasonic product) - a
        # brand/category/price browse is much broader and only makes sense once
        # nothing specific enough was found.
        keyword_words = extract_keyword_words(words)
        matched = find_full_matches(products, keyword_words)[:8]
        if matched:
            return ChatResponse(
                reply=f"Mình tìm thấy {len(matched)} sản phẩm phù hợp, bạn xem thử nhé:",
                products=[to_card(p) for p in matched],
            )

        # No exact match. If the customer named a specific number (capacity,
        # size, ...) that isn't in stock, don't just say "not found" - offer
        # the closest product on the remaining words, but say plainly it's a
        # similar alternative, not an exact match (never silently pass off a
        # different-spec product as if it were the one asked for).
        numeric_words = [w for w in keyword_words if w.isdigit()]
        if numeric_words:
            similar = find_full_matches(products, [w for w in keyword_words if not w.isdigit()])[:8]
            if similar:
                return ChatResponse(
                    reply=(
                        f"Hiện tại Điện Máy NK chưa có đúng loại {' '.join(numeric_words)} bạn cần, "
                        "nhưng có sản phẩm tương tự sau, bạn tham khảo nhé:"
                    ),
                    products=[to_card(p) for p in similar],
                )

        # Browse-style: category and/or brand and/or a price constraint ("tủ
        # lạnh 400 lít", "máy lạnh Casper dưới 6 triệu") - list every matching
        # product for the customer to pick from, rather than requiring one
        # exact phrase match.
        search_result = search_catalog(session, products, message_norm, words)
        if search_result is not None:
            category_matches, note = search_result
            if category_matches:
                return ChatResponse(
                    reply=note or f"Mình tìm thấy {len(category_matches)} sản phẩm phù hợp, bạn xem thử nhé:",
                    products=category_matches,
                )
            return ChatResponse(
                reply=(
                    "Hiện tại Điện Máy NK chưa có sản phẩm đúng như bạn mô tả trong danh mục này. "
                    f"Bạn có thể gọi hotline {settings['hotline']} để được tư vấn thêm."
                )
            )

        return ChatResponse(reply=DONT_UNDERSTAND_REPLY_TEMPLATE.format(hotline=settings["hotline"]))
    finally:
        session.close()
