import os, time, re, queue, requests, tldextract
from typing import Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urldefrag
from dotenv import load_dotenv
import trafilatura

load_dotenv()
BASE_URL = os.getenv("BASE_URL", "https://www.ats.sch.ae")
DATA_DIR = os.getenv("DATA_DIR", "./kb_data")
os.makedirs(DATA_DIR, exist_ok=True)

HEADERS = {"User-Agent": "ATS-KB-Bot/1.0 (+research; respectful crawler)"}
VISITED = set()
ALLOWED_NETLOC = tldextract.extract(BASE_URL).registered_domain  # e.g. ats.sch.ae
RATE_SECONDS = 1.0  # be nice

def is_same_site(url: str) -> bool:
    netloc = urlparse(url).netloc
    return ALLOWED_NETLOC in netloc

def normalize(u: str) -> str:
    u, _ = urldefrag(u)  # remove #anchors
    if u.endswith("/"): u = u[:-1]
    return u

def should_skip_path(path: str) -> bool:
    # skip common binary or dynamic stuff
    return any(path.lower().endswith(ext) for ext in [
        ".jpg",".jpeg",".png",".gif",".webp",".svg",".ico",
        ".css",".js",".zip",".rar",".7z",".mp4",".mp3",".avi",".mov",".wmv",
        ".doc",".docx",".xls",".xlsx",".ppt",".pptx",".xml"
    ])

def fetch(url: str) -> Optional[requests.Response]:
    try:
        time.sleep(RATE_SECONDS)
        r = requests.get(url, headers=HEADERS, timeout=20)
        if r.status_code == 200:
            return r
    except Exception:
        pass
    return None

def extract_links(base_url: str, html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    links = []
    for a in soup.find_all("a", href=True):
        href = urljoin(base_url, a["href"])
        links.append(href)
    return links

def save_clean_text(url: str, html: str):
    # Trafilatura does robust boilerplate removal
    text = trafilatura.extract(html, url=url, include_tables=True, favor_recall=True) or ""
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        return
    # Make a filename from URL
    safe = re.sub(r"[^a-zA-Z0-9]+", "_", urlparse(url).path.strip("/")) or "index"
    out_path = os.path.join(DATA_DIR, f"{safe}.txt")
    meta_path = os.path.join(DATA_DIR, f"{safe}.source")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    with open(meta_path, "w", encoding="utf-8") as f:
        f.write(url)
    print(f"✓ Saved {url} → {out_path}")

def main():
    q = queue.Queue()
    start = normalize(BASE_URL)
    q.put(start)
    VISITED.add(start)
    print(f"Starting crawl at {start}")

    while not q.empty():
        url = q.get()
        if should_skip_path(urlparse(url).path):
            continue
        resp = fetch(url)
        if not resp: 
            continue
        ctype = resp.headers.get("Content-Type","").lower()
        if "text/html" not in ctype:
            continue

        html = resp.text
        save_clean_text(url, html)

        for link in extract_links(url, html):
            link = normalize(link)
            if not is_same_site(link): 
                continue
            if should_skip_path(urlparse(link).path):
                continue
            if link not in VISITED:
                VISITED.add(link)
                q.put(link)

    print("Done.")

if __name__ == "__main__":
    main()
