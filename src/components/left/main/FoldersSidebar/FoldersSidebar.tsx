import type { FC } from '../../../../lib/teact/teact';
import React, { memo, } from '../../../../lib/teact/teact';
import styles from './FoldersSidebar.module.scss';
import { getActions, withGlobal } from "../../../../global";
import { useFolderManagerForUnreadCounters } from "../../../../hooks/useFolderManager";
import useOldLang from '../../../../hooks/useOldLang';
import useForceUpdate from '../../../../hooks/useForceUpdate';
import { ApiChatFolder } from '../../../../api/types';
import { selectTabState } from '../../../../global/selectors';
import { SettingsScreens } from '../../../../types';
import createFolderIcon from './createFolderIcon';
import folderIcons from './folderIcons';

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

  const allFoldersIcon = createFolderIcon('💬', true);
    
  const folders = [{
    id: 0,
    imageIcon: allFoldersIcon,
    classIcon: !allFoldersIcon && 'icon-chats-badge',
    title: lang('FilterAllChats')
  }, ...(orderedFolderIds || []).map(id => {
    
    const folder = chatFoldersById?.[id];
    if (!folder) return;

    const classIcon = (!folder.emoticon && (
      folder.excludeRead && 'icon-comments-sticker' ||
      folder.contacts && 'icon-user-filled'
    ));

    return {
      id,
      title: folder.title.text,
      classIcon,
      imageIcon: !classIcon && createFolderIcon(folder.emoticon || '📁') || undefined,
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
          
          <div
            style={folder.imageIcon}
            className={[
              styles.icon,
              folder.classIcon && `icon ${folder.classIcon}`
            ].filter(Boolean).join(' ')}>


            {Boolean(folder.counter) && (
              <div className={styles.badge} data-value={folder.counter} />
            )}
            
          </div>

          <div className={styles.label}>{folder.title}</div>

        </div>
      ))}

      <div className={styles.spacer} />

      <div className={styles.button} title={lang('Filters')} onClick={() => getActions().requestNextSettingsScreen({ screen: SettingsScreens.Folders })}>
        <div className={`${styles.icon} icon icon-settings`} />
        <div className={styles.label}>{lang('Edit')}</div>
      </div>
      
    </div>
  )
}

export const useFoldersSidebar = (): [ boolean, (value: boolean) => void] => {

  const forceUpdate = useForceUpdate();

  const update = (use: boolean) => {
    if (use) {
      localStorage.removeItem('foldersOnTop');
    } else {
      localStorage.setItem('foldersOnTop', '1');
    }
    forceUpdate();
  }

  return [
    Boolean(!localStorage.getItem('foldersOnTop')),
    update
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