import type { ChangeEvent } from 'react';
import type { FC } from '../../../lib/teact/teact';
import React, { memo, useCallback, useEffect } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import {
  checkIfNotificationsSupported,
  checkIfOfflinePushFailed,
  playNotifySound,
} from '../../../util/notifications';

import useHistoryBack from '../../../hooks/useHistoryBack';
import useLang from '../../../hooks/useLang';
import useRunDebounced from '../../../hooks/useRunDebounced';

import Checkbox from '../../ui/Checkbox';
import RangeSlider from '../../ui/RangeSlider';

type OwnProps = {
  isActive?: boolean;
  onReset: () => void;
};

type StateProps = {
  hasPrivateChatsNotifications: boolean;
  hasPrivateChatsMessagePreview: boolean;
  hasGroupNotifications: boolean;
  hasGroupMessagePreview: boolean;
  hasBroadcastNotifications: boolean;
  hasBroadcastMessagePreview: boolean;
  hasContactJoinedNotifications: boolean;
  hasWebNotifications: boolean;
  hasPushNotifications: boolean;
  notificationSoundVolume: number;
};

const SettingsNotifications: FC<OwnProps & StateProps> = ({
  isActive,
  onReset,
  hasPrivateChatsNotifications,
  hasPrivateChatsMessagePreview,
  hasGroupNotifications,
  hasGroupMessagePreview,
  hasBroadcastNotifications,
  hasBroadcastMessagePreview,
  hasContactJoinedNotifications,
  hasPushNotifications,
  hasWebNotifications,
  notificationSoundVolume,
}) => {
  const {
    loadNotificationSettings,
    updateContactSignUpNotification,
    updateNotificationSettings,
    updateWebNotificationSettings,
  } = getActions();

  useEffect(() => {
    loadNotificationSettings();
  }, [loadNotificationSettings]);

  const runDebounced = useRunDebounced(500, true);

  const areNotificationsSupported = checkIfNotificationsSupported();
  const areOfflineNotificationsSupported = areNotificationsSupported && !checkIfOfflinePushFailed();

  const handleSettingsChange = useCallback((
    e: ChangeEvent<HTMLInputElement>,
    peerType: 'contact' | 'group' | 'broadcast',
    setting: 'silent' | 'showPreviews',
  ) => {
    const currentIsSilent = peerType === 'contact'
      ? !hasPrivateChatsNotifications
      : !(peerType === 'group' ? hasGroupNotifications : hasBroadcastNotifications);
    const currentShouldShowPreviews = peerType === 'contact'
      ? hasPrivateChatsMessagePreview
      : (peerType === 'group' ? hasGroupMessagePreview : hasBroadcastMessagePreview);

    updateNotificationSettings({
      peerType,
      ...(setting === 'silent' && { isSilent: !e.target.checked, shouldShowPreviews: currentShouldShowPreviews }),
      ...(setting === 'showPreviews' && { shouldShowPreviews: e.target.checked, isSilent: currentIsSilent }),
    });
  }, [
    hasBroadcastMessagePreview, hasBroadcastNotifications,
    hasGroupMessagePreview, hasGroupNotifications,
    hasPrivateChatsMessagePreview, hasPrivateChatsNotifications,
    updateNotificationSettings,
  ]);

  const handleWebNotificationsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    updateWebNotificationSettings({
      hasWebNotifications: isEnabled,
      ...(!isEnabled && { hasPushNotifications: false }),
    });
  }, [updateWebNotificationSettings]);

  const handlePushNotificationsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    updateWebNotificationSettings({
      hasPushNotifications: e.target.checked,
    });
  }, [updateWebNotificationSettings]);

  const handlePrivateChatsNotificationsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleSettingsChange(e, 'contact', 'silent');
  }, [handleSettingsChange]);

  const handlePrivateChatsPreviewChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleSettingsChange(e, 'contact', 'showPreviews');
  }, [handleSettingsChange]);

  const handleGroupsNotificationsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleSettingsChange(e, 'group', 'silent');
  }, [handleSettingsChange]);

  const handleGroupsPreviewChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleSettingsChange(e, 'group', 'showPreviews');
  }, [handleSettingsChange]);

  const handleChannelsNotificationsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleSettingsChange(e, 'broadcast', 'silent');
  }, [handleSettingsChange]);

  const handleChannelsPreviewChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleSettingsChange(e, 'broadcast', 'showPreviews');
  }, [handleSettingsChange]);

  const handleContactNotificationChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    updateContactSignUpNotification({
      isSilent: !e.target.checked,
    });
  }, [updateContactSignUpNotification]);

  const handleVolumeChange = useCallback((volume: number) => {
    updateWebNotificationSettings({
      notificationSoundVolume: volume,
    });
    runDebounced(() => playNotifySound(undefined, volume));
  }, [runDebounced, updateWebNotificationSettings]);

  const lang = useLang();

  useHistoryBack({
    isActive,
    onBack: onReset,
  });

  return (
    <div className="settings-content custom-scroll">
      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>
          {lang('NotificationsWeb')}
        </h4>
        <Checkbox
          label={lang('NotificationsWeb')}
          subLabel={lang(hasWebNotifications ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')}
          checked={hasWebNotifications}
          disabled={!areNotificationsSupported}
          onChange={handleWebNotificationsChange}
        />
        <Checkbox
          label={lang('NotificationsOffline')}
          disabled={!hasWebNotifications || !areOfflineNotificationsSupported}
          subLabel={areOfflineNotificationsSupported
            ? lang(hasPushNotifications ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')
            : lang('SettingsOfflineNotificationUnsupported')}
          checked={hasPushNotifications}
          onChange={handlePushNotificationsChange}
        />
        <div className="settings-item-slider">
          <RangeSlider
            label={lang('NotificationsSound')}
            min={0}
            max={10}
            disabled={!areNotificationsSupported}
            value={notificationSoundVolume}
            onChange={handleVolumeChange}
          />
        </div>
      </div>
      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>
          {lang('AutodownloadPrivateChats')}
        </h4>

        <Checkbox
          label={lang('NotificationsForPrivateChats')}
          subLabel={lang(hasPrivateChatsNotifications
            ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')}
          checked={hasPrivateChatsNotifications}
          onChange={handlePrivateChatsNotificationsChange}
        />
        <Checkbox
          label={lang('MessagePreview')}
          disabled={!hasPrivateChatsNotifications}
          subLabel={lang(hasPrivateChatsMessagePreview
            ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')}
          checked={hasPrivateChatsMessagePreview}
          onChange={handlePrivateChatsPreviewChange}
        />
      </div>

      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>{lang('FilterGroups')}</h4>

        <Checkbox
          label={lang('NotificationsForGroups')}
          subLabel={lang(hasGroupNotifications ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')}
          checked={hasGroupNotifications}
          onChange={handleGroupsNotificationsChange}
        />
        <Checkbox
          label={lang('MessagePreview')}
          disabled={!hasGroupNotifications}
          subLabel={lang(hasGroupMessagePreview ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')}
          checked={hasGroupMessagePreview}
          onChange={handleGroupsPreviewChange}
        />
      </div>

      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>{lang('FilterChannels')}</h4>

        <Checkbox
          label={lang('NotificationsForChannels')}
          subLabel={lang(hasBroadcastNotifications ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')}
          checked={hasBroadcastNotifications}
          onChange={handleChannelsNotificationsChange}
        />
        <Checkbox
          label={lang('MessagePreview')}
          disabled={!hasBroadcastNotifications}
          subLabel={lang(hasBroadcastMessagePreview ? 'UserInfoNotificationsEnabled' : 'UserInfoNotificationsDisabled')}
          checked={hasBroadcastMessagePreview}
          onChange={handleChannelsPreviewChange}
        />
      </div>

      <div className="settings-item">
        <h4 className="settings-item-header" dir={lang.isRtl ? 'rtl' : undefined}>{lang('PhoneOther')}</h4>

        <Checkbox
          label={lang('ContactJoined')}
          checked={hasContactJoinedNotifications}
          onChange={handleContactNotificationChange}
        />
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    return {
      hasPrivateChatsNotifications: Boolean(global.settings.byKey.hasPrivateChatsNotifications),
      hasPrivateChatsMessagePreview: Boolean(global.settings.byKey.hasPrivateChatsMessagePreview),
      hasGroupNotifications: Boolean(global.settings.byKey.hasGroupNotifications),
      hasGroupMessagePreview: Boolean(global.settings.byKey.hasGroupMessagePreview),
      hasBroadcastNotifications: Boolean(global.settings.byKey.hasBroadcastNotifications),
      hasBroadcastMessagePreview: Boolean(global.settings.byKey.hasBroadcastMessagePreview),
      hasContactJoinedNotifications: Boolean(global.settings.byKey.hasContactJoinedNotifications),
      hasWebNotifications: global.settings.byKey.hasWebNotifications,
      hasPushNotifications: global.settings.byKey.hasPushNotifications,
      notificationSoundVolume: global.settings.byKey.notificationSoundVolume,
    };
  },
)(SettingsNotifications));
