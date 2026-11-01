const IMAGE_EXTENSIONS = new Set([
  "avif",
  "gif",
  "ico",
  "icns",
  "jpeg",
  "jpg",
  "png",
  "webp",
  "xcf",
]);

const VIDEO_EXTENSIONS = new Set([
  "mov",
  "mp4",
  "mpeg",
  "mpg",
  "rmvb",
  "webm",
]);

const CODE_EXTENSIONS = new Set([
  "c",
  "cc",
  "cfg",
  "class",
  "clj",
  "cljs",
  "cmake",
  "cpp",
  "cs",
  "cshtml",
  "css",
  "cxx",
  "dart",
  "htm",
  "html",
  "java",
  "js",
  "json",
  "jsonc",
  "jsx",
  "lua",
  "py",
  "sh",
  "sql",
  "svelte",
  "swift",
  "ts",
  "tsx",
  "xml",
  "yaml",
  "yml",
  "zsh",
]);

export function getFileType(name) {
  const lowerName = name.toLowerCase();
  const ext = lowerName.includes(".") ? lowerName.split(".").pop() : "";
  if (ext === "blend" || ext === "blend1") return "Blender";
  if (IMAGE_EXTENSIONS.has(ext)) return "Image";
  if (VIDEO_EXTENSIONS.has(ext)) return "Video";
  if (ext === "zip") return "Archive";
  if (ext === "ini") return "System";
  if (CODE_EXTENSIONS.has(ext)) return "Code";
  return "Other";
}
