import { useEffect, useRef, useState } from "react";
import { useTheme } from "styled-components";
import SidebarButton, {
  type SidebarButtons,
} from "components/system/StartMenu/Sidebar/SidebarButton";
import {
  AllApps,
  Documents,
  Pictures,
  Power,
  SideMenu,
  Videos,
} from "components/system/StartMenu/Sidebar/SidebarIcons";
import StyledSidebar from "components/system/StartMenu/Sidebar/StyledSidebar";
import { useRootFs } from "contexts/fileSystem";
import { resetStorageAndReload } from "contexts/fileSystem/useAsyncFs";
import { useProcessesActions } from "contexts/process";
import { useSessionActions } from "contexts/session";
import { HOME, TASKBAR_HEIGHT } from "utils/constants";
import { haltEvent, viewHeight } from "utils/functions";
import { isKeyboardNavigating } from "utils/keyboard";

type SidebarGroupProps = {
  sidebarButtons: SidebarButtons;
};

const SidebarGroup: FC<SidebarGroupProps> = ({ sidebarButtons }) => (
  <ol>
    {sidebarButtons.map((button) => (
      <SidebarButton key={button.name} {...button} />
    ))}
  </ol>
);

type SidebarProps = {
  height?: string;
};

const Sidebar: FC<SidebarProps> = ({ height }) => {
  const rootFs = useRootFs();
  const { open } = useProcessesActions();
  const { setHaltSession } = useSessionActions();
  const [collapsed, setCollapsed] = useState(true);
  const expandTimer = useRef(0);
  const sidebarRef = useRef<HTMLElement>(null);
  const clearTimer = (): void => {
    if (expandTimer.current) {
      clearTimeout(expandTimer.current);
      expandTimer.current = 0;
    }
  };
  const topButtons: SidebarButtons = [
    {
      expanded: !collapsed,
      heading: true,
      icon: <SideMenu />,
      name: "START",
      ...(collapsed && { tooltip: "展开" }),
    },
    {
      active: true,
      icon: <AllApps />,
      name: "所有应用",
      ...(collapsed && { tooltip: "所有应用" }),
    },
  ];
  const { sizes } = useTheme();
  const vh = viewHeight();
  const buttonAreaCount = Math.floor(
    (vh - TASKBAR_HEIGHT) / sizes.startMenu.sideBar.width
  );
  const bottomButtons = [
    buttonAreaCount > 3
      ? {
          action: () =>
            open(
              "FileExplorer",
              { url: `${HOME}/Documents` },
              "/System/Icons/documents.webp"
            ),
          icon: <Documents />,
          name: "文档",
          ...(collapsed && { tooltip: "文档" }),
        }
      : undefined,
    buttonAreaCount > 4
      ? {
          action: () =>
            open(
              "FileExplorer",
              { url: `${HOME}/Pictures` },
              "/System/Icons/pictures.webp"
            ),
          icon: <Pictures />,
          name: "图片",
          ...(collapsed && { tooltip: "图片" }),
        }
      : undefined,
    buttonAreaCount > 5
      ? {
          action: () =>
            open(
              "FileExplorer",
              { url: `${HOME}/Videos` },
              "/System/Icons/videos.webp"
            ),
          icon: <Videos />,
          name: "视频",
          ...(collapsed && { tooltip: "视频" }),
        }
      : undefined,
    {
      action: () => {
        setHaltSession(true);

        resetStorageAndReload(rootFs);
      },
      icon: <Power />,
      name: "电源",
      tooltip: "清除会话数据并重新加载页面。",
    },
  ].filter(Boolean) as SidebarButtons;

  useEffect(() => clearTimer, [clearTimer]);

  return (
    <StyledSidebar
      ref={sidebarRef}
      aria-label="开始"
      className={collapsed ? "collapsed" : undefined}
      onBlur={({ relatedTarget }) => {
        // Like moving the pointer away, though clicks in it keep it open
        if (
          isKeyboardNavigating() &&
          !sidebarRef.current?.contains(relatedTarget)
        ) {
          setCollapsed(true);
        }
      }}
      onClick={({ target }) => {
        clearTimer();

        if (
          target instanceof HTMLElement &&
          ((target === sidebarRef.current && collapsed) ||
            (sidebarRef.current?.contains(target) &&
              target.textContent === "START"))
        ) {
          setCollapsed((collapsedState) => !collapsedState);
        }
      }}
      onContextMenu={haltEvent}
      onMouseEnter={() => {
        expandTimer.current = window.setTimeout(() => setCollapsed(false), 700);
      }}
      onMouseLeave={() => {
        clearTimer();
        setCollapsed(true);
      }}
      style={{ height }}
    >
      <SidebarGroup sidebarButtons={topButtons} />
      <SidebarGroup sidebarButtons={bottomButtons} />
    </StyledSidebar>
  );
};

export default Sidebar;
