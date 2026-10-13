/**
 * daedalOS 静态文件服务器 Worker
 * 从 R2 存储桶 daedalos-assets 提供静态资源
 * 
 * 部署步骤见 docs/SETUP.md
 */

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
  ".wasm": "application/wasm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".map": "application/json",
  ".webmanifest": "application/manifest+json",
};

function getContentType(path) {
  const ext = "." + path.split(".").pop().toLowerCase();
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let key = decodeURIComponent(url.pathname);

    // 去掉开头的 /
    if (key.startsWith("/")) key = key.slice(1);
    // 空路径 -> index.html
    if (key === "" || key.endsWith("/")) key += "index.html";

    // 尝试直接获取
    let object = await env.ASSETS.get(key);

    // SPA 回退: 不存在的文件返回 index.html (daedalOS 是单页应用)
    // 但带扩展名的静态资源 404 就直接 404
    if (object === null) {
      const hasExt = /\.[a-z0-9]+$/i.test(key);
      if (!hasExt) {
        object = await env.ASSETS.get("index.html");
        key = "index.html";
      }
    }

    if (object === null) {
      // 尝试 404.html
      const notFound = await env.ASSETS.get("404.html");
      if (notFound !== null) {
        return new Response(notFound.body, {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", getContentType(key));
    headers.set("Cache-Control", "public, max-age=86400");
    // index.html 不缓存, 保证更新即时生效
    if (key === "index.html" || key === "404.html") {
      headers.set("Cache-Control", "no-cache");
    }

    return new Response(object.body, { headers });
  },
};
