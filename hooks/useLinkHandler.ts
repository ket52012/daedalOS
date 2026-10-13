import { relative } from "path";
const allowedCorsDomains = new Set(["wikipedia.org", "archive.org"]);
const isCorsUrl = (url?: string): boolean => {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    const [, domain, tld] = hostname.split(".");
    return (
      allowedCorsDomains.has(`${domain}.${tld}`) ||
      allowedCorsDomains.has(hostname)
    );
  } catch {
    return false;
  }
};
import { getProcessByFileExtension } from "components/system/Files/FileEntry/functions";
import { useProcessesActions } from "contexts/process";
import { useSessionActions } from "contexts/session";
import { getExtension, haltEvent, isYouTubeUrl } from "utils/functions";

type LinkHandler = (
  event: Event,
  rawUrl: string,
  pathName: string,
  title?: string
) => void;

export const useLinkHandler = (): LinkHandler => {
  const { open } = useProcessesActions();
  const { updateRecentFiles } = useSessionActions();

  return (event, rawUrl, pathName, title) => {
    haltEvent(event);

    const url = rawUrl.replace(/^http:/i, "https:");

    if (isYouTubeUrl(url)) open("VideoPlayer", { url });
    else if (isCorsUrl(url)) open("Browser", { initialTitle: title, url });
    else if (
      !pathName ||
      relative(
        decodeURI(
          (url.startsWith("/") ? url : `/${url}`).replace(
            window.location.origin,
            ""
          )
        ),
        decodeURI(pathName)
      ) === ""
    ) {
      const defaultProcess = getProcessByFileExtension(getExtension(pathName));

      if (defaultProcess) {
        const pathUrl = decodeURI(pathName);

        open(defaultProcess, { url: pathUrl });

        if (pathUrl) updateRecentFiles(pathUrl, defaultProcess);
      }
    } else {
      window.open(rawUrl, "_blank", "noopener, noreferrer");
    }
  };
};
