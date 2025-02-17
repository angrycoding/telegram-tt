import type { FC } from '../../../../lib/teact/teact';
import React, { memo, useEffect } from '../../../../lib/teact/teact';
import styles from './FoldersSidebar.module.scss';
import { getActions, withGlobal } from "../../../../global";
import { useFolderManagerForUnreadCounters } from "../../../../hooks/useFolderManager";
import useOldLang from '../../../../hooks/useOldLang';
import useForceUpdate from '../../../../hooks/useForceUpdate';
import { ApiChatFolder } from '../../../../api/types';
import { selectTabState } from '../../../../global/selectors';
import { SettingsScreens } from '../../../../types';
import FolderIcon from './FolderIcon';

type StateProps = {
  chatFoldersById: Record<number, ApiChatFolder>;
  orderedFolderIds?: number[];
  activeChatFolder: number;
};

const ChatFolders: FC<StateProps> = ({
  chatFoldersById,
  orderedFolderIds,
  activeChatFolder
}) => {

  const lang = useOldLang();
  const folderCountersById = useFolderManagerForUnreadCounters();

  const setActiveFolder = (index: number) => {
    getActions().setActiveChatFolder({ activeChatFolder: index });
  }

  const folders = [{
    id: 0,
    icon: '💬',
    title: lang('FilterAllChats')
  }, ...(orderedFolderIds || []).map(id => {
    
    const folder = chatFoldersById?.[id];
    if (!folder) return;

    return {
      id,
      title: folder.title.text,
      icon: (
        folder.emoticon ||
        folder.excludeRead && '✅' ||
        folder.contacts && '👤' || 
        '📁'
      )
    }


  }) ].filter(Boolean). map(x => ({
    ...x,
    counter: folderCountersById[x.id]?.chatsCount
  }));


  return (
    <div className={styles.wrapper}>

      <div className={styles.menuButton}>
        <div className="icon icon-sort" />
        <div className="icon icon-arrow-left" />
        <div id="folders-sidebar" />
      </div>

      {folders.map((folder, index) => (
        <div className={styles.button} onClick={() => setActiveFolder(index)} data-active={activeChatFolder === index} title={folder.title}>
          
          <FolderIcon
            icon={folder.icon}
            className={styles.icon}>

            {Boolean(folder.counter) && (
              <div className={styles.badge} data-value={folder.counter} />
            )}
            
          </FolderIcon>

          <div className={styles.label}>{folder.title}</div>

        </div>
      ))}

      <div className={styles.spacer} />

      <div className={styles.button} title={lang('Filters')} onClick={() => getActions().requestNextSettingsScreen({ screen: SettingsScreens.Folders })}>
        <FolderIcon className={styles.icon} icon="⚙️" />
        <div className={styles.label}>{lang('Edit')}</div>
      </div>
      
    </div>
  )
}

export const useFoldersSidebar = (): [ boolean, (value: boolean) => void] => {

  const forceUpdate = useForceUpdate();

  const toggleAndTrigger = (newValue: boolean) => {
    if (newValue) {
      localStorage.removeItem('foldersOnTop');
    } else {
      localStorage.setItem('foldersOnTop', '1');
    }
    document.dispatchEvent(new Event('useFoldersSidebar'));
  }

  useEffect(() => {
    document.addEventListener('useFoldersSidebar', forceUpdate);
    return () => {
      document.removeEventListener('useFoldersSidebar', forceUpdate);
    }
  }, []);


  return [
    Boolean(!localStorage.getItem('foldersOnTop')),
    toggleAndTrigger
  ];
}

export const useFolderMonochromeIcons = (): [ boolean, (value: boolean) => void] => {

  const forceUpdate = useForceUpdate();
  
  const toggleAndTrigger = (newValue: boolean) => {
    if (newValue) {
      localStorage.removeItem('folderColorIcons');
    } else {
      localStorage.setItem('folderColorIcons', '1');
    }
    document.dispatchEvent(new Event('useFolderMonochromeIcons'));
  }

  useEffect(() => {
    document.addEventListener('useFolderMonochromeIcons', forceUpdate);
    return () => {
      document.removeEventListener('useFolderMonochromeIcons', forceUpdate);
    }
  }, []);

  return [
    Boolean(!localStorage.getItem('folderColorIcons')),
    toggleAndTrigger
  ];
}

export default memo(withGlobal<{}>(
  (global): StateProps => {
    const {
      chatFolders: {
        byId: chatFoldersById,
        orderedIds: orderedFolderIds,
      },
    } = global;

    const { activeChatFolder } = selectTabState(global);

    return {
      chatFoldersById,
      orderedFolderIds,
      activeChatFolder,
    };
  },
)(ChatFolders));