"""Plain-text extraction from PDF with the standard library only (zlib), good enough for papers.

Covers what academic PDFs (LaTeX, Word, publisher pipelines) use: indirect objects and object streams,
FlateDecode streams, per-page font resources, ToUnicode CMaps (bfchar/bfrange, 1- and 2-byte codes),
WinAnsi/Standard fallback, and the text operators Tj, TJ, ', " with Td/TD/Tm/T*/TL to place spaces and
line breaks. Not covered: encrypted PDFs, scanned images (no OCR), Type3 glyph programs.
"""

import re
import zlib

_OBJ = re.compile(rb"(\d+)\s+(\d+)\s+obj\b(.*?)\bendobj", re.S)
_STREAM = re.compile(rb"stream\r?\n(.*?)\r?\n?endstream", re.S)
_REF = re.compile(rb"(\d+)\s+0\s+R")


def _inflate(dic, raw):
    if b"/FlateDecode" in dic or b"/Fl " in dic or b"/Fl]" in dic:
        for wbits in (zlib.MAX_WBITS, -zlib.MAX_WBITS):
            try:
                return zlib.decompressobj(wbits).decompress(raw)
            except zlib.error:
                continue
        return b""
    if b"/Filter" in dic:  # other filters (DCT images, LZW...) carry no text we can read
        return b""
    return raw


class PDF:
    def __init__(self, data):
        self.objs = {}
        for m in _OBJ.finditer(data):
            self.objs[int(m.group(1))] = m.group(3)
        # objects packed in object streams (PDF 1.5+)
        for body in list(self.objs.values()):
            if b"/ObjStm" not in body[:300]:
                continue
            dic, raw = self.split(body)
            n = int((re.search(rb"/N\s+(\d+)", dic) or [0, b"0"])[1])
            first = int((re.search(rb"/First\s+(\d+)", dic) or [0, b"0"])[1])
            content = _inflate(dic, raw)
            head = content[:first].split()
            offs = [(int(head[i]), int(head[i + 1])) for i in range(0, min(len(head), 2 * n) - 1, 2)]
            for k, (num, off) in enumerate(offs):
                end = offs[k + 1][1] if k + 1 < len(offs) else len(content) - first
                self.objs.setdefault(num, content[first + off:first + end])

    @staticmethod
    def split(body):
        m = _STREAM.search(body)
        return (body[:m.start()], m.group(1)) if m else (body, b"")

    def stream(self, num):
        body = self.objs.get(num)
        if body is None:
            return b""
        dic, raw = self.split(body)
        return _inflate(dic, raw)

    def resolve(self, value):
        m = re.fullmatch(rb"\s*(\d+)\s+0\s+R\s*", value or b"")
        return self.objs.get(int(m.group(1)), b"") if m else value

    def pages(self):
        """Page objects in document order (via /Kids from the root /Pages), falling back to scan order."""
        root = next((b for b in self.objs.values() if re.search(rb"/Type\s*/Pages\b", b) and b"/Parent" not in b), None)
        out, seen = [], set()

        def walk(num):
            if num in seen or num not in self.objs:
                return
            seen.add(num)
            body = self.objs[num]
            if re.search(rb"/Type\s*/Page\b", body):
                out.append(body)
            kids = re.search(rb"/Kids\s*\[(.*?)\]", body, re.S)
            for r in _REF.finditer(kids.group(1) if kids else b""):
                walk(int(r.group(1)))
        if root is not None:
            kids = re.search(rb"/Kids\s*\[(.*?)\]", root, re.S)
            for r in _REF.finditer(kids.group(1) if kids else b""):
                walk(int(r.group(1)))
        return out or [b for b in self.objs.values() if re.search(rb"/Type\s*/Page\b", b)]

    def fonts(self, page):
        """{resource name: code->unicode map} for the fonts of a page."""
        res = self.resolve((re.search(rb"/Resources\s*(\d+\s+0\s+R|<<.*)", page, re.S) or [None, b""])[1])
        fd = re.search(rb"/Font\s*(\d+\s+0\s+R|<<(.*?)>>)", res, re.S)
        if not fd:
            return {}
        block = self.resolve(fd.group(1)) if fd.group(1).endswith(b"R") else fd.group(2)
        out = {}
        for name, ref in re.findall(rb"/([A-Za-z0-9_.+-]+)\s+(\d+)\s+0\s+R", block):
            try:
                out[name] = self.cmap(int(ref))
            except Exception:  # one odd font must not cost the page
                out[name] = {}
        return out

    def cmap(self, font_num):
        font = self.objs.get(font_num, b"")
        tu = re.search(rb"/ToUnicode\s+(\d+)\s+0\s+R", font)
        if not tu:
            two = b"/Type0" in font or b"Identity-H" in font
            return {"_two": two}
        return parse_cmap(self.stream(int(tu.group(1))))

    def contents(self, page):
        c = re.search(rb"/Contents\s*(\[(.*?)\]|(\d+)\s+0\s+R)", page, re.S)
        if not c:
            return b""
        refs = [int(x) for x in _REF.findall(c.group(2) or b"")] if c.group(2) is not None else [int(c.group(3))]
        if len(refs) == 1 and b"[" in self.objs.get(refs[0], b"")[:20] and b"stream" not in self.objs.get(refs[0], b""):
            refs = [int(x) for x in _REF.findall(self.objs[refs[0]])]  # /Contents points to an array object
        return b"\n".join(self.stream(r) for r in refs)


def _hex_to_str(h):
    h = h.decode("latin-1") if isinstance(h, bytes) else h
    try:
        return bytes.fromhex(h).decode("utf-16-be")
    except (ValueError, UnicodeDecodeError):
        return ""


def parse_cmap(data):
    m = {"_two": False}
    for block in re.findall(rb"beginbfchar(.*?)endbfchar", data, re.S):
        for src, dst in re.findall(rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>", block):
            m[int(src, 16)] = _hex_to_str(dst)
            m["_two"] = m["_two"] or len(src) > 2
    for block in re.findall(rb"beginbfrange(.*?)endbfrange", data, re.S):
        for lo, hi, rest in re.findall(rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(\[.*?\]|<[0-9A-Fa-f]+>)", block, re.S):
            a, b = int(lo, 16), int(hi, 16)
            m["_two"] = m["_two"] or len(lo) > 2
            if b - a > 5000:
                continue
            if rest.startswith(b"["):
                for i, d in enumerate(re.findall(rb"<([0-9A-Fa-f]*)>", rest)):
                    m[a + i] = _hex_to_str(d)
            else:
                base = rest.strip(b"<>")
                start = int(base, 16) if base else 0
                width = max(4, len(base))
                for i in range(b - a + 1):
                    m[a + i] = _hex_to_str(format(start + i, f"0{width}X"))
    return m


def _unescape(s):
    out, i = bytearray(), 0
    while i < len(s):
        c = s[i]
        if c == 0x5C and i + 1 < len(s):  # backslash
            n = s[i + 1]
            if n in b"nrtbf":
                out.append({110: 10, 114: 13, 116: 9, 98: 8, 102: 12}[n]); i += 2
            elif 48 <= n <= 55:
                j = i + 1
                while j < len(s) and j < i + 4 and 48 <= s[j] <= 55:
                    j += 1
                out.append(int(s[i + 1:j], 8) & 255); i = j
            elif n in b"\r\n":
                i += 2
            else:
                out.append(n); i += 2
        else:
            out.append(c); i += 1
    return bytes(out)


def _decode(raw, cmap):
    if cmap and len(cmap) > 1:
        if cmap.get("_two"):
            codes = [int.from_bytes(raw[i:i + 2], "big") for i in range(0, len(raw) - 1, 2)]
        else:
            codes = list(raw)
        return "".join(cmap.get(c, "") if c in cmap else (chr(c) if 32 <= c < 127 else "") for c in codes)
    if cmap and cmap.get("_two"):
        return ""  # CID font without ToUnicode: glyph ids, not text
    # TeX OT1/T1 fonts without ToUnicode put ligatures in the control range: ff fi fl ffi ffl
    return raw.decode("cp1252", errors="ignore").translate(_LIGATURES)


_LIGATURES = {0x0B: "ff", 0x0C: "fi", 0x0D: "fl", 0x0E: "ffi", 0x0F: "ffl", 0x1B: "ff", 0x1C: "fi", 0x1D: "fl", 0x1E: "ffi", 0x1F: "ffl"}

_TOKEN = re.compile(rb"\((?:\\.|[^\\()]|\((?:\\.|[^\\()])*\))*\)|<[0-9A-Fa-f\s]*>|\[|\]|/[^\s/\[\]()<>]+|-?\d*\.?\d+|[A-Za-z'\"*]+", re.S)


def page_text(content, fonts):
    out, line, font, stack = [], [], {}, []
    for tok in _TOKEN.findall(content):
        if tok.startswith(b"(") or tok.startswith(b"<") or tok in (b"[", b"]") or tok.startswith(b"/") or re.fullmatch(rb"-?\d*\.?\d+", tok):
            stack.append(tok)
            continue
        op = tok
        if op == b"Tf" and len(stack) >= 2:
            font = fonts.get(stack[-2][1:], {})
        elif op in (b"Tj", b"'", b'"'):
            if op != b"Tj":
                out.append("".join(line)); line = []
            s = stack[-1] if stack else b""
            line.append(_string(s, font))
        elif op == b"TJ":
            arr = stack[stack.index(b"[") + 1:] if b"[" in stack else stack
            for t in arr:
                if t.startswith(b"(") or t.startswith(b"<"):
                    line.append(_string(t, font))
                elif re.fullmatch(rb"-?\d*\.?\d+", t) and float(t) < -180:
                    line.append(" ")  # a big negative kern is a word gap
        elif op in (b"Td", b"TD") and len(stack) >= 2:
            try:
                dx, dy = float(stack[-2]), float(stack[-1])
            except ValueError:
                dx, dy = 0, 0
            if abs(dy) > 0.1:
                out.append("".join(line)); line = []
            elif dx > 0:
                line.append(" ")
        elif op in (b"T*", b"Tm", b"ET"):
            if op == b"Tm" and line:
                line.append(" ")
            if op == b"T*":
                out.append("".join(line)); line = []
        stack = []
    out.append("".join(line))
    return "\n".join(x.rstrip() for x in out)


def _string(tok, font):
    if tok.startswith(b"<"):
        raw = bytes.fromhex(re.sub(rb"\s", b"", tok[1:-1]).decode() + ("0" if len(re.sub(rb"\s", b"", tok[1:-1])) % 2 else ""))
    else:
        raw = _unescape(tok[1:-1])
    return _decode(raw, font)


def extract(data, max_pages=60):
    """Text of a PDF (bytes), pages separated by form feeds. Empty string when nothing is readable."""
    if not data.startswith(b"%PDF") or b"/Encrypt" in data[-4096:]:
        return ""
    pdf = PDF(data)
    texts = []
    for page in pdf.pages()[:max_pages]:
        try:
            texts.append(page_text(pdf.contents(page), pdf.fonts(page)))
        except Exception:  # a broken page must not lose the rest
            continue
    text = "\f".join(texts)
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)          # hyphenation at line ends
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
