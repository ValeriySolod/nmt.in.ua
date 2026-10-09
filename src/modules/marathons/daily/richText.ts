function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inline(value: string): string {
  return value
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" rel="noopener noreferrer">$1</a>',
    );
}

/** Markdown subset. Input is escaped first, so raw HTML cannot survive. */
export function renderSafeMarkdown(source: string): string {
  const escaped = escapeHtml(source.replaceAll("\r\n", "\n"));
  const lines = escaped.split("\n");
  const blocks: string[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(`<ul>${list.join("")}</ul>`);
    list = [];
  };
  for (const line of lines) {
    const item = /^-\s+(.+)$/.exec(line);
    if (item) {
      list.push(`<li>${inline(item[1] ?? "")}</li>`);
      continue;
    }
    flushList();
    if (!line.trim()) continue;
    blocks.push(`<p>${inline(line)}</p>`);
  }
  flushList();
  return blocks.join("");
}

export function youtubeEmbedSrc(raw: string): string | null {
  const value = raw.trim();
  let id = "";
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v") ?? "";
      else {
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "embed" || parts[0] === "shorts") id = parts[1] ?? "";
      }
    }
  } catch {
    return null;
  }
  if (!/^[\w-]{6,16}$/.test(id)) return null;
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

export function loomEmbedSrc(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "loom.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== "share" && parts[0] !== "embed") return null;
    const id = parts[1] ?? "";
    if (!/^[a-zA-Z0-9]{8,40}$/.test(id)) return null;
    return `https://www.loom.com/embed/${id}`;
  } catch {
    return null;
  }
}
