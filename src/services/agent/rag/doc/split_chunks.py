import json
import re
from pathlib import Path


ROOT = Path("./ocr")
SOURCE_FILES = [
    "心理学与生活.md",
    "认知行为疗法入门.md",
    "认知行为疗法进阶.md",
]
OUTPUT_FILE = ROOT / "rag_concepts_chunks.json"

HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
CHAPTER_RE = re.compile(r"^第\s*[0-9一二三四五六七八九十百]+\s*章\b")
APPENDIX_STOP_RE = re.compile(r"^(Table of Contents|本书特色|认知行为疗法进阶|认知行为疗法入门|心理学与生活)$")
NOISE_LINE_RE = re.compile(
    r"^\s*(?:<div.*?>|</div>|<img .*?>|!\[.*?\]\(.*?\)|本书由「ePUBw\.COM」整理.*|"
    r"网址\s+https?://\S+|邮编\s+\d+.*|读者服务热线.*|反盗版热线.*|广告经营许可证.*|"
    r"责任编辑.*|责任印制.*|◆.*|ISBN\s+\S+|中国版本图书馆CIP数据.*|"
    r"图书在版编目.*|定价[:：].*|印张[:：].*|开本[:：].*|字数[:：].*|"
    r"第\d+版|人民邮电出版社|北京|中国心理卫生协会.*|中国社会心理学会.*|北师大心理学部.*|"
    r"郭召良◎著|郭召良 著|[美].*著.*译|Psychology and life|教育部高等学校心理学教学指导委员会推荐用书|"
    r"□□+)\s*$"
)
SKIP_SECTION_TITLE_RE = re.compile(r"^(目录|Table of Contents|关键术语)$")


def clean_heading_title(title: str) -> str:
    title = re.sub(r"\s+", " ", title.strip())
    return title


def is_chapter_title(title: str) -> bool:
    return bool(CHAPTER_RE.match(title))


def chapter_in_stack(stack):
    for item in reversed(stack):
        if item["is_chapter"]:
            return item
    return None


def should_stop_after_body(title: str, current_chapter_found: bool) -> bool:
    return current_chapter_found and bool(APPENDIX_STOP_RE.match(title))


def should_drop_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if NOISE_LINE_RE.match(stripped):
        return True
    if re.fullmatch(r"[·•◆■☑△□\-\s]+", stripped):
        return True
    if re.fullmatch(r"\d+", stripped):
        return True
    return False


def split_paragraphs(line_buffer):
    paragraphs = []
    current = []
    start_line = None

    def flush():
        nonlocal current, start_line
        if not current:
            return
        text = "\n".join(text for _, text in current).strip("\n")
        if text.strip():
            paragraphs.append(
                {
                    "start_line": start_line,
                    "end_line": current[-1][0],
                    "text": text,
                }
            )
        current = []
        start_line = None

    for line_no, text in line_buffer:
        if text.strip():
            if start_line is None:
                start_line = line_no
            current.append((line_no, text))
        else:
            flush()
    flush()
    return paragraphs


def split_sentences(text: str):
    parts = re.split(r"(?<=[。！？；])", text)
    return [part.strip() for part in parts if part.strip()]


def looks_like_catalog_paragraph(text: str) -> bool:
    stripped = re.sub(r"\s+", " ", text).strip()
    if not stripped:
        return False
    if len(stripped) > 40:
        return False
    if stripped.startswith(("■", "☑", "△", "·")):
        return True
    if re.search(r"[，。；]", stripped):
        return False
    if not re.search(r"[，。；！？]", stripped):
        return True
    return False


def trim_leading_catalog_paragraphs(paragraphs):
    index = 0
    while index < len(paragraphs) and looks_like_catalog_paragraph(paragraphs[index]["text"]):
        index += 1
    if index >= 3 and index < len(paragraphs):
        return paragraphs[index:]
    return paragraphs


def split_long_paragraph(paragraph, max_chars=1200, target_chars=900):
    text = paragraph["text"]
    if len(text) <= max_chars:
        return [paragraph]

    sentences = split_sentences(text)
    if len(sentences) <= 1:
        return [paragraph]

    chunks = []
    bucket = []
    current_len = 0
    for sentence in sentences:
        sentence_len = len(sentence)
        if bucket and current_len + sentence_len > max_chars:
            chunks.append(
                {
                    "start_line": paragraph["start_line"],
                    "end_line": paragraph["end_line"],
                    "text": "".join(bucket).strip(),
                }
            )
            bucket = [sentence]
            current_len = sentence_len
            continue
        bucket.append(sentence)
        current_len += sentence_len
        if current_len >= target_chars:
            chunks.append(
                {
                    "start_line": paragraph["start_line"],
                    "end_line": paragraph["end_line"],
                    "text": "".join(bucket).strip(),
                }
            )
            bucket = []
            current_len = 0

    if bucket:
        chunks.append(
            {
                "start_line": paragraph["start_line"],
                "end_line": paragraph["end_line"],
                "text": "".join(bucket).strip(),
            }
        )
    return [chunk for chunk in chunks if chunk["text"]]


def merge_paragraphs(paragraphs, max_chars=1600, target_chars=1100):
    expanded = []
    for paragraph in paragraphs:
        expanded.extend(split_long_paragraph(paragraph, max_chars=max_chars))

    chunks = []
    current = []
    current_len = 0

    def flush():
        nonlocal current, current_len
        if not current:
            return
        text = "\n\n".join(item["text"] for item in current).strip()
        if text:
            chunks.append(
                {
                    "start_line": current[0]["start_line"],
                    "end_line": current[-1]["end_line"],
                    "text": text,
                }
            )
        current = []
        current_len = 0

    for paragraph in expanded:
        para_len = len(paragraph["text"])
        if current and current_len + para_len > max_chars:
            flush()
        current.append(paragraph)
        current_len += para_len
        if current_len >= target_chars:
            flush()

    flush()
    return chunks


def infer_concept_type(section_path, text: str) -> str:
    title = section_path[-1]
    if re.search(r"(技术|方法|策略|流程|步骤|会谈|干预|训练|应用)", title):
        return "方法"
    if re.search(r"(机制|形成|维持)", title):
        return "机制"
    if re.search(r"(模型|理论)", title):
        return "模型"
    if re.search(r"(观点|人格观|病因观点)", title):
        return "观点"
    if re.search(r"(含义|定义|内涵|什么是|概念)", title):
        return "概念"
    if re.search(r"(评估|诊断|识别)", title):
        return "方法"
    if re.search(r"(关系|作用|特点|优势|基础|结构)", title):
        return "论述"
    if "是" in text[:80] or "指" in text[:80]:
        return "概念"
    return "论述"


def pick_summary_sentences(text: str):
    sentences = split_sentences(text)
    filtered = []
    for sentence in sentences:
        s = re.sub(r"\s+", " ", sentence).strip()
        if len(s) < 10:
            continue
        if s.startswith(("来访者：", "咨询师：")):
            continue
        filtered.append(s)

    if not filtered:
        cleaned = re.sub(r"\s+", " ", text).strip()
        return cleaned[:180]

    priority = []
    general = []
    for sentence in filtered:
        if re.search(r"(是|指|包括|意味着|分为|决定|形成|导致|影响|作用|目的|用于|用来|步骤|流程|技术|方法|策略|机制|模型)", sentence):
            priority.append(sentence)
        else:
            general.append(sentence)

    chosen = []
    for sentence in priority + general:
        if sentence not in chosen:
            chosen.append(sentence)
        if len(chosen) >= 2:
            break

    summary = " ".join(chosen)
    return summary[:220]


def build_overview(section_path, text: str) -> str:
    concept_type = infer_concept_type(section_path, text)
    title = section_path[-1]
    summary = pick_summary_sentences(text)

    if title and title not in summary:
        return f"{title}：{summary}"
    if concept_type in {"方法", "机制", "模型", "观点", "概念"}:
        return f"{concept_type}概述：{summary}"
    return summary


def parse_markdown_file(path: Path):
    lines = path.read_text(encoding="utf-8").splitlines()
    stack = []
    buffer = []
    blocks = []
    in_body = False
    chapter_found = False
    current_chapter = None

    def flush_buffer(end_line: int):
        nonlocal buffer
        if not in_body or not current_chapter or not buffer:
            buffer = []
            return

        paragraphs = split_paragraphs(buffer)
        paragraphs = trim_leading_catalog_paragraphs(paragraphs)
        if not paragraphs:
            buffer = []
            return

        text = "\n\n".join(p["text"] for p in paragraphs).strip()
        if not text:
            buffer = []
            return

        blocks.append(
            {
                "source_file": path.name,
                "chapter_title": current_chapter["title"],
                "section_path": [current_chapter["title"], *[item["title"] for item in stack]],
                "heading_level_path": [0, *[item["level"] for item in stack]],
                "start_line": paragraphs[0]["start_line"],
                "end_line": paragraphs[-1]["end_line"],
                "paragraphs": paragraphs,
            }
        )
        buffer = []

    for line_no, line in enumerate(lines, start=1):
        heading_match = HEADING_RE.match(line)
        if heading_match:
            title = clean_heading_title(heading_match.group(2))
            if should_stop_after_body(title, chapter_found) and not is_chapter_title(title):
                flush_buffer(line_no - 1)
                break

            if is_chapter_title(title):
                in_body = True
                chapter_found = True
                flush_buffer(line_no - 1)
                current_chapter = {
                    "title": title,
                    "line": line_no,
                }
                stack = []
                continue

            flush_buffer(line_no - 1)

            if current_chapter is not None:
                level = len(heading_match.group(1))
                while stack and stack[-1]["level"] >= level:
                    stack.pop()
                stack.append(
                    {
                        "title": title,
                        "level": level,
                        "line": line_no,
                        "is_chapter": False,
                    }
                )
            continue

        if not in_body:
            continue

        if should_drop_line(line):
            continue

        if current_chapter is None:
            continue

        buffer.append((line_no, line))

    flush_buffer(len(lines))
    return blocks


def block_to_items(block):
    title = block["section_path"][-1]
    if SKIP_SECTION_TITLE_RE.match(title):
        return []

    chunks = merge_paragraphs(block["paragraphs"])
    items = []
    for idx, chunk in enumerate(chunks, start=1):
        text = chunk["text"].strip()
        if not text:
            continue
        if len(re.sub(r"\s+", "", text)) < 20:
            continue
        items.append(
            {
                "source_file": block["source_file"],
                "chapter_title": block["chapter_title"],
                "section_path": block["section_path"],
                "line_range": {
                    "start": chunk["start_line"],
                    "end": chunk["end_line"],
                },
                "chunk_index_in_section": idx,
                "concept_type": infer_concept_type(block["section_path"], text),
                "original_text": text,
                "rag_overview": build_overview(block["section_path"], text),
            }
        )
    return items


def deduplicate(items):
    seen = set()
    unique = []
    for item in items:
        key = (
            item["source_file"],
            tuple(item["section_path"]),
            item["original_text"],
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique


def main():
    all_items = []
    for file_name in SOURCE_FILES:
        path = ROOT / file_name
        blocks = parse_markdown_file(path)
        for block in blocks:
            all_items.extend(block_to_items(block))

    all_items = deduplicate(all_items)
    OUTPUT_FILE.write_text(
        json.dumps(all_items, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    counts = {}
    for item in all_items:
        counts[item["source_file"]] = counts.get(item["source_file"], 0) + 1

    print(f"wrote {len(all_items)} items to {OUTPUT_FILE}")
    for file_name, count in counts.items():
        print(f"{file_name}: {count}")


if __name__ == "__main__":
    main()
