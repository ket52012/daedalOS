import { basename, dirname, extname, join } from "path";
import useTransferDialog, {
  type ObjectReader,
} from "components/system/Dialogs/Transfer/useTransferDialog";
import { EXTRACTABLE_EXTENSIONS } from "components/system/Files/FileEntry/constants";
import extensions from "components/system/Files/FileEntry/extensions";
import {
  getProcessByFileExtension,
  isExistingFile,
} from "components/system/Files/FileEntry/functions";
import useFile from "components/system/Files/FileEntry/useFile";
import { type FileStat } from "components/system/Files/FileManager/functions";
import { type FocusEntryFunctions } from "components/system/Files/FileManager/useFocusableEntries";
import { type FileActions } from "components/system/Files/FileManager/useFolder";
import { Share } from "components/system/Menu/MenuIcons";
import { useFileSystemActions, useRootFs } from "contexts/fileSystem";
import { isMountedFolder } from "contexts/fileSystem/core";
import { useMenuActions } from "contexts/menu";
import {
  type ContextMenuCapture,
  type MenuItem,
} from "contexts/menu/useMenuContextState";
import { getProcess, useProcessesActions } from "contexts/process";
import processDirectory from "contexts/process/directory";
import { useSessionActions } from "contexts/session";
import { getNavButtonByTitle } from "hooks/useGlobalKeyboardShortcuts";
import { useShowAI } from "hooks/useWindowAI";
import {
  AI_PROMPT_EVENT,
  AI_TITLE,
  AI_WINDOW_ID,
  AUDIO_PLAYLIST_EXTENSIONS,
  CURSOR_FILE_EXTENSIONS,
  DESKTOP_PATH,
  EDITABLE_IMAGE_FILE_EXTENSIONS,
  IMAGE_FILE_EXTENSIONS,
  MENU_SEPERATOR,
  MOUNTABLE_EXTENSIONS,
  PACKAGE_DATA,
  PROCESS_DELIMITER,
  ROOT_SHORTCUT,
  SHORTCUT_EXTENSION,
  SPREADSHEET_FORMATS,
  SUMMARIZABLE_FILE_EXTENSIONS,
  TEXT_EDITORS,
  VIDEO_FILE_EXTENSIONS,
} from "utils/constants";
import { type transcode } from "utils/ffmpeg";
import {
  AUDIO_DECODE_FORMATS,
  AUDIO_ENCODE_FORMATS,
  VIDEO_DECODE_FORMATS,
  VIDEO_ENCODE_FORMATS,
} from "utils/ffmpeg/formats";
import {
  getExtension,
  isYouTubeUrl,
  saveUnpositionedDesktopIcons,
} from "utils/functions";
import { type convert } from "utils/imagemagick";
import {
  IMAGE_DECODE_FORMATS,
  IMAGE_ENCODE_FORMATS,
} from "utils/imagemagick/formats";
import type * as SheetJs from "utils/sheetjs";

const { alias } = PACKAGE_DATA;

const loadTranscodeFunction = async (
  isAudioVideo: boolean
): Promise<typeof convert | typeof transcode> =>
  isAudioVideo
    ? (await import("utils/ffmpeg")).transcode
    : (await import("utils/imagemagick")).convert;

const loadSheetJs = (): Promise<typeof SheetJs> => import("utils/sheetjs");

const canShareFile = (
  mountList: string[] | undefined,
  path: string,
  stats: FileStat,
  shareData: ShareData
): boolean => {
  try {
    const isFileMounted = mountList?.some(
      (mountPath) => mountPath !== "/" && path.startsWith(`${mountPath}/`)
    );

    return (
      !isFileMounted && isExistingFile(stats) && navigator.canShare?.(shareData)
    );
  } catch {
    // Ignore failure to use Share API
  }

  return false;
};

const useFileContextMenu = (
  url: string,
  pid: string,
  path: string,
  setRenaming: React.Dispatch<React.SetStateAction<string>>,
  {
    archiveFiles,
    deleteLocalPath,
    downloadFiles,
    extractFiles,
    newShortcut,
  }: FileActions,
  { blurEntry, focusEntry }: FocusEntryFunctions,
  focusedEntries: string[],
  stats: FileStat,
  fileManagerId?: string,
  readOnly?: boolean
): ContextMenuCapture => {
  const { close, minimize, open, url: changeUrl } = useProcessesActions();
  const {
    setCursor,
    setForegroundId,
    setIconPositions,
    setWallpaper,
    updateRecentFiles,
  } = useSessionActions();
  const openFile = useFile(url, path);
  const {
    copyEntries,
    createPath,
    lstat,
    mapFs,
    moveEntries,
    readFile,
    unMapFs,
    updateFolder,
  } = useFileSystemActions();
  const rootFs = useRootFs();
  const { contextMenu } = useMenuActions();
  const showAI = useShowAI();
  const { openTransferDialog } = useTransferDialog();
  const baseName = basename(path);
  const isFocusedEntry = focusedEntries.includes(baseName);
  const { onContextMenuCapture, ...contextMenuHandlers } = contextMenu(() => {
    const urlExtension = getExtension(url);
    const { process: extensionProcesses = [] } =
      urlExtension in extensions ? extensions[urlExtension] : {};
    const openWith = extensionProcesses.filter((process) => process !== pid);
    const openWithFiltered = openWith.filter((id) => id !== pid);
    const isSingleSelection = focusedEntries.length === 1 || !isFocusedEntry;
    const absoluteEntries = (): string[] =>
      isSingleSelection
        ? [path]
        : [
            ...new Set([
              path,
              ...focusedEntries.map((entry) => join(dirname(path), entry)),
            ]),
          ];
    const menuItems: MenuItem[] = [];
    const pathExtension = getExtension(path);
    const isShortcut = pathExtension === SHORTCUT_EXTENSION;
    const remoteMount = rootFs?.mountList.some(
      (mountPath) =>
        mountPath === path && isMountedFolder(rootFs?.mntMap[mountPath])
    );

    if (!readOnly && !remoteMount) {
      const defaultProcess = getProcessByFileExtension(urlExtension);

      menuItems.push(
        { action: () => moveEntries(absoluteEntries()), label: "剪切" },
        { action: () => copyEntries(absoluteEntries()), label: "复制" },
        MENU_SEPERATOR
      );

      if (defaultProcess || isShortcut || (!pathExtension && !urlExtension)) {
        menuItems.push({
          action: () =>
            absoluteEntries().forEach(async (entry) => {
              const shortcutProcess =
                defaultProcess && !(await lstat(entry)).isDirectory()
                  ? defaultProcess
                  : "FileExplorer";

              newShortcut(entry, shortcutProcess);
            }),
          label: "创建快捷方式",
        });
      }

      menuItems.push(
        {
          action: () => {
            if (dirname(path) === DESKTOP_PATH) {
              saveUnpositionedDesktopIcons(setIconPositions);
            }

            absoluteEntries().forEach((entry) => deleteLocalPath(entry));
          },
          label: "删除",
        },
        { action: () => setRenaming(baseName), label: "重命名" },
        MENU_SEPERATOR,
        {
          action: () => {
            const activePid = `Properties${PROCESS_DELIMITER}${url}`;
            const activeProcess = getProcess(activePid);

            if (activeProcess) {
              if (activeProcess.minimized) minimize(activePid);

              setForegroundId(activePid);
            } else {
              open("Properties", {
                shortcutPath: isShortcut ? path : undefined,
                url: isShortcut ? path : url,
              });
            }
          },
          label: "属性",
        }
      );

      if (path) {
        if (path === join(DESKTOP_PATH, ROOT_SHORTCUT)) {
          if (typeof FileSystemHandle === "function") {
            const mapFileSystemDirectory = (directory: string): void => {
              mapFs(directory)
                .then((mappedFolder) => {
                  updateFolder("/", mappedFolder);
                  open("FileExplorer", {
                    url: join("/", mappedFolder),
                  });
                })
                .catch(() => {
                  // Ignore failure to map
                });
            };
            const showMapDirectory = "showDirectoryPicker" in window;
            const showMapOpfs =
              typeof navigator.storage?.getDirectory === "function" &&
              "createWritable" in FileSystemFileHandle.prototype;

            menuItems.unshift(
              ...(showMapDirectory
                ? [
                    {
                      action: () => mapFileSystemDirectory("/"),
                      label: "映射目录",
                    },
                  ]
                : []),
              ...(showMapOpfs
                ? [
                    {
                      action: () => mapFileSystemDirectory("/OPFS"),
                      label: "映射 OPFS",
                    },
                  ]
                : []),
              ...(showMapDirectory || showMapOpfs ? [MENU_SEPERATOR] : [])
            );
          }
        } else {
          menuItems.unshift(MENU_SEPERATOR);

          const canDecodeAudio = AUDIO_DECODE_FORMATS.has(pathExtension);
          const canDecodeImage = IMAGE_DECODE_FORMATS.has(pathExtension);
          const canDecodeVideo = VIDEO_DECODE_FORMATS.has(pathExtension);

          if (canDecodeAudio || canDecodeImage || canDecodeVideo) {
            const isAudioVideo = canDecodeAudio || canDecodeVideo;
            const ENCODE_FORMATS = isAudioVideo
              ? canDecodeAudio
                ? AUDIO_ENCODE_FORMATS
                : VIDEO_ENCODE_FORMATS
              : IMAGE_ENCODE_FORMATS;

            menuItems.unshift(MENU_SEPERATOR, {
              label: "转换为",
              menu: ENCODE_FORMATS.filter(
                (format) => format !== pathExtension
              ).map((format) => {
                const extension = format.replace(".", "");

                return {
                  action: async () => {
                    openTransferDialog(undefined, path, "Converting");

                    const directory = dirname(path);
                    const closeDialog = (): void =>
                      close(`Transfer${PROCESS_DELIMITER}${path}`);

                    try {
                      const transcodeFunction =
                        await loadTranscodeFunction(isAudioVideo);
                      const objectReaders = absoluteEntries().map<ObjectReader>(
                        (absoluteEntry) => {
                          let aborted = false;

                          return {
                            abort: () => {
                              aborted = true;
                            },
                            directory,
                            name: basename(absoluteEntry),
                            operation: "Converting",
                            read: async () => {
                              if (aborted) return;

                              try {
                                const [
                                  [transcodedFileName, transcodedFileData],
                                ] = await transcodeFunction(
                                  [
                                    [
                                      absoluteEntry,
                                      await readFile(absoluteEntry),
                                    ],
                                  ],
                                  extension
                                );

                                updateFolder(
                                  directory,
                                  await createPath(
                                    basename(transcodedFileName),
                                    directory,
                                    transcodedFileData
                                  )
                                );
                              } catch {
                                // Ignore failure to transcode
                              }
                            },
                          };
                        }
                      );

                      openTransferDialog(objectReaders, path);
                    } catch (error) {
                      closeDialog();

                      if ("message" in (error as Error)) {
                        console.error((error as Error).message);
                      }
                    }
                  },
                  label: extension.toUpperCase(),
                };
              }),
            });
          }

          const canDecodeSpreadsheet =
            SPREADSHEET_FORMATS.includes(pathExtension);

          if (canDecodeSpreadsheet) {
            menuItems.unshift(MENU_SEPERATOR, {
              label: "转换为",
              menu: SPREADSHEET_FORMATS.filter(
                (format) => format !== pathExtension
              ).map((format) => {
                const extension = format.replace(".", "");

                return {
                  action: () => {
                    absoluteEntries().forEach(async (absoluteEntry) => {
                      const newFilePath = `${dirname(absoluteEntry)}/${basename(
                        absoluteEntry,
                        extname(absoluteEntry)
                      )}.${extension}`;
                      const [{ convertSheet }, sheetBuffer] = await Promise.all(
                        [loadSheetJs(), readFile(absoluteEntry)]
                      );
                      const workBook = await convertSheet(
                        sheetBuffer,
                        extension
                      );
                      const workBookDirName = dirname(path);

                      updateFolder(
                        workBookDirName,
                        await createPath(
                          basename(newFilePath),
                          workBookDirName,
                          Buffer.from(workBook)
                        )
                      );
                    });
                  },
                  label: extension.toUpperCase(),
                };
              }),
            });
          }

          const opensInFileExplorer = pid === "FileExplorer";

          if (isSingleSelection && !opensInFileExplorer && !isYouTubeUrl(url)) {
            const baseFileName = basename(url);
            const shareData: ShareData = {
              text: `${baseFileName} - ${alias}`,
              title: baseFileName,
              url: `${window.location.origin}?url=${url}`,
            };

            if (canShareFile(rootFs?.mountList, path, stats, shareData)) {
              menuItems.unshift({
                action: () => navigator.share(shareData),
                label: "分享",
                SvgIcon: Share,
              });
            }
          }

          menuItems.unshift(
            {
              action: () => archiveFiles(absoluteEntries()),
              label: "添加到压缩包...",
            },
            ...(EXTRACTABLE_EXTENSIONS.has(urlExtension) ||
            MOUNTABLE_EXTENSIONS.has(urlExtension)
              ? [
                  {
                    action: () => extractFiles(url),
                    label: "解压到这里",
                  },
                  MENU_SEPERATOR,
                ]
              : []),
            {
              action: () => downloadFiles(absoluteEntries()),
              label: "下载",
            }
          );

          if (!isShortcut && !opensInFileExplorer) {
            TEXT_EDITORS.forEach((textEditor) => {
              if (
                textEditor !== defaultProcess &&
                !openWithFiltered.includes(textEditor)
              ) {
                openWithFiltered.push(textEditor);
              }
            });
          }
        }
      }

      menuItems.unshift(MENU_SEPERATOR);
    }

    if (remoteMount) {
      menuItems.push(MENU_SEPERATOR, {
        action: () =>
          unMapFs(path, rootFs?.mntMap[path].getName() !== "FileSystemAccess"),
        label: "断开连接",
      });
    }

    if (EDITABLE_IMAGE_FILE_EXTENSIONS.has(urlExtension)) {
      menuItems.unshift({
        action: () => {
          open("Paint", { url });
          if (url) updateRecentFiles(url, "Paint");
        },
        label: "编辑",
      });
    }

    if (CURSOR_FILE_EXTENSIONS.has(urlExtension)) {
      menuItems.unshift({
        action: () => setCursor(url),
        label: "设为鼠标指针",
      });
    }

    if (showAI && SUMMARIZABLE_FILE_EXTENSIONS.has(urlExtension)) {
      const aiCommand = (command: string): void => {
        window.initialAiPrompt = `${command}: ${url}`;

        if (document.querySelector(`#${AI_WINDOW_ID}`)) {
          window.dispatchEvent(new Event(AI_PROMPT_EVENT));
        } else {
          getNavButtonByTitle(AI_TITLE)?.click();
        }
      };

      menuItems.unshift(MENU_SEPERATOR, {
        action: () => aiCommand("Summarize"),
        label: "AI 总结文本",
      });
    }

    const hasBackgroundVideoExtension = VIDEO_FILE_EXTENSIONS.has(urlExtension);

    if (
      hasBackgroundVideoExtension ||
      (IMAGE_FILE_EXTENSIONS.has(urlExtension) &&
        !CURSOR_FILE_EXTENSIONS.has(urlExtension) &&
        urlExtension !== ".svg")
    ) {
      menuItems.unshift({
        label: "设为壁纸",
        ...(hasBackgroundVideoExtension
          ? {
              action: () => setWallpaper(url),
            }
          : {
              menu: [
                {
                  action: () => setWallpaper(url, "fill"),
                  label: "填充",
                },
                {
                  action: () => setWallpaper(url, "fit"),
                  label: "适应",
                },
                {
                  action: () => setWallpaper(url, "stretch"),
                  label: "拉伸",
                },
                {
                  action: () => setWallpaper(url, "tile"),
                  label: "平铺",
                },
                {
                  action: () => setWallpaper(url, "center"),
                  label: "居中",
                },
              ],
            }),
      });
    }

    if (openWithFiltered.length > 0) {
      menuItems.unshift({
        label: "打开方式",
        menu: [
          ...openWithFiltered.map((id): MenuItem => {
            const { icon, title: label } = processDirectory[id] || {};
            const action = (): void => {
              openFile(id, icon);
            };

            return { action, icon, label };
          }),
          MENU_SEPERATOR,
          {
            action: () => open("OpenWith", { url }),
            label: "选择其他应用",
          },
        ],
        primary: !pid,
      });
    }

    if (pid) {
      const { icon: pidIcon } = processDirectory[pid] || {};

      if (
        isShortcut &&
        url &&
        url !== "/" &&
        !url.startsWith("http:") &&
        !url.startsWith("https:") &&
        !url.startsWith("nostr:")
      ) {
        const isFolder = urlExtension === "" || urlExtension === ".zip";

        menuItems.unshift({
          action: () => open("FileExplorer", { url: dirname(url) }, ""),
          label: `Open ${isFolder ? "folder" : "file"} location`,
        });
      }

      if (
        fileManagerId &&
        pid === "FileExplorer" &&
        !MOUNTABLE_EXTENSIONS.has(urlExtension)
      ) {
        menuItems.unshift({
          action: () => {
            openFile(pid, pidIcon);
          },
          label: "在新窗口中打开",
        });
      }

      menuItems.unshift({
        action: () => {
          if (
            pid === "FileExplorer" &&
            fileManagerId &&
            !MOUNTABLE_EXTENSIONS.has(urlExtension)
          ) {
            changeUrl(fileManagerId, url);
          } else {
            openFile(pid, pidIcon);
          }
        },
        icon: pidIcon,
        label: VIDEO_FILE_EXTENSIONS.has(urlExtension) ? "Play" : "Open",
        primary: true,
      });
    }

    return menuItems[0] === MENU_SEPERATOR ? menuItems.slice(1) : menuItems;
  });

  return {
    onContextMenuCapture: (event?: React.MouseEvent | React.TouchEvent) => {
      if (!isFocusedEntry) {
        blurEntry();
        focusEntry(baseName);
      }
      onContextMenuCapture(event);
    },
    ...contextMenuHandlers,
  };
};

export default useFileContextMenu;
