import { emulatorCores } from "components/apps/Emulator/config";
import { EDITABLE_IMAGE_FILE_EXTENSIONS, TEXT_EDITORS } from "utils/constants";

type Extension = {
  command?: string;
  icon?: string;
  process: string[];
  type?: string;
};

const types = {
  Application: {
    icon: "executable",
    process: ["JSDOS"],
    type: "Application",
  },
  AudioPlaylist: {
    icon: "audio",
    process: ["VideoPlayer"],
    type: "Audio Playlist File",
  },

  DiscImage: {
    icon: "image",
    process: ["Emulator"],
    type: "Disc Image File",
  },
  Emulator: {
    icon: "emulator",
    process: ["Emulator"],
    type: "Game ROM File",
  },


  GraphicsEditor: {
    process: ["Photos", "Paint"],
    type: "Picture File",
  },
  HtmlDocument: {
    process: ["Browser", ...TEXT_EDITORS],
    type: "HTML Document",
  },
  JsdosBundle: {
    icon: "jsdos",
    process: ["JSDOS", "FileExplorer"],
    type: "JSDOS Bundle",
  },
  Markdown: {
    icon: "marked",
    process: [...TEXT_EDITORS],
    type: "Markdown File",
  },
  MediaPlaylist: {
    process: ["VideoPlayer"],
    type: "Media Playlist File",
  },
  MountableDiscImage: {
    icon: "image",
    process: ["FileExplorer"],
    type: "Disc Image File",
  },
  Music: {
    icon: "audio",
    process: ["VideoPlayer"],
  },
  PdfDocument: {
    icon: "pdf",
    process: ["PDF"],
    type: "PDF Document",
  },
  PythonFile: {
    command: "py",
    icon: "python",
    process: ["Terminal", ...TEXT_EDITORS],
    type: "Python File",
  },
  ScreenSaver: {
    process: ["ScreenSaver"],
    type: "Screen Saver",
  },

  SvgFile: {
    process: ["Photos", ...TEXT_EDITORS],
    type: "Scalable Vector Graphics File",
  },

  WasmFile: {
    command: "wapm",
    icon: "wapm",
    process: ["Terminal"],
    type: "WebAssembly Module File",
  },
  WinampSkin: {
    icon: "audio",
    process: ["FileExplorer"],
    type: "Winamp Skin File",
  },
  WysiwygHtmlDocument: {
    icon: "tinymce",
    process: [...TEXT_EDITORS],
    type: "WYSIWYG HTML File",
  },
  ZipFile: {
    icon: "compressed",
    process: ["FileExplorer", "JSDOS"],
    type: "Compressed (zipped) Folder",
  },
};

const extensions: Record<string, Extension> = {
  ".asx": types.AudioPlaylist,
  ".bin": types.DiscImage,
  ".dsk": types.DiscImage,
  ".exe": types.Application,
  ".htm": types.HtmlDocument,
  ".html": types.HtmlDocument,
  ".img": types.DiscImage,
  ".iso": types.MountableDiscImage,
  ".jsdos": types.JsdosBundle,
  ".m3u": types.AudioPlaylist,
  ".m3u8": types.MediaPlaylist,
  ".md": types.Markdown,
  ".mp3": types.Music,
  ".pdf": types.PdfDocument,
  ".pls": types.AudioPlaylist,
  ".py": types.PythonFile,
  ".rtf": types.WysiwygHtmlDocument,
  ".svg": types.SvgFile,
  ".wasm": types.WasmFile,
  ".whtml": types.WysiwygHtmlDocument,
  ".wsz": types.WinampSkin,
  ".xscr": types.ScreenSaver,
  ".zip": types.ZipFile,
};

const addType =
  (type: Extension) =>
  (extension: string): void => {
    if (type.process) {
      if (extensions[extension]) {
        extensions[extension].process.push(...type.process);
      } else {
        extensions[extension] = type;
      }
    }
  };

EDITABLE_IMAGE_FILE_EXTENSIONS.forEach(addType(types.GraphicsEditor));

Object.values(emulatorCores).forEach(({ ext }) =>
  ext.forEach(addType(types.Emulator))
);

export default extensions;
