import useAppLayout from '../../../../hooks/useAppLayout';
import useOldLang from '../../../../hooks/useOldLang';
import type { FC } from '../../../../lib/teact/teact';
import React, { memo, useRef, useState } from '../../../../lib/teact/teact';
import Icon from '../../../common/icons/Icon';
import EmojiPicker from '../../../middle/composer/EmojiPicker';
import Button from '../../../ui/Button';
import DropdownMenu from '../../../ui/DropdownMenu';
import InputText from '../../../ui/InputText';
import Menu from '../../../ui/Menu';
import Portal from '../../../ui/Portal';
import createFolderIcon from '../../main/FoldersSidebar/createFolderIcon';
import folderIcons from '../../main/FoldersSidebar/folderIcons';
import styles from './FolderNameInput.module.scss';


type OwnProps = {
	title: string,
	onSetTitle: (title: string) => void,
	icon?: string,
	onSetIcon: (icon?: string) => void,
	label: string
	maxLength: number
};

const FolderIconButton: FC<{
	icon?: string,
	onTrigger: () => void;
	isOpen?: boolean,
}> = ({ icon, onTrigger, isOpen }) => {
  const lang = useOldLang();
  return (
	<Button
	  round
	  tabIndex={-1}
	  // ripple={!isMobile}
	  size="smaller"
	  color="translucent"
	  className={`${styles.button} ${isOpen ? 'active' : ''}`}
	  onClick={onTrigger}
	  ariaLabel={lang('Choose an icon')}
	>
		<div className={styles.buttonIcon} style={createFolderIcon(icon)} />
	</Button>
  );
};


const FolderNameInput: FC<OwnProps> = ({
	title,
	onSetTitle,
	label,
	icon,
	maxLength,
	onSetIcon
}) => {

	const lang = useOldLang();
	const { isMobile } = useAppLayout();
	const [ menuShown, setMenuShown ] = useState(false);
	const [ focused, setFocused ] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const realLength = [...title].length;
	const exceedLength = realLength >= maxLength;

	const updateFocus = () => {
		setFocused(document.activeElement === inputRef.current);
	}

	const setFocus = () => {
		inputRef.current?.focus()
	}

	return <div className={styles.outerWrapper} onMouseDown={setFocus}>

		<InputText tabIndex={-1} label={label} value=" " focused={focused} />
		
		<div className={styles.innerWrapper}>

			<div>
				<Button
					tabIndex={-1}
					round
					color="translucent"
					onClick={() => {
						if (isMobile && menuShown) {
							setMenuShown(false);
						} else {
							setMenuShown(true)
						}
					}}
					ariaLabel="Choose emoji"
					className={styles.button}
					disabled={exceedLength}
				>
					<Icon name={(isMobile && menuShown) ? 'keyboard' : 'smile'} />
				</Button>
			</div>
		  
			<input
				type='text'
				ref={inputRef}
				onFocus={updateFocus}
				onBlur={updateFocus}
				value={title}
				maxLength={exceedLength ? maxLength : undefined}
				onChange={e => onSetTitle(e.target.value)}
			/>

			<DropdownMenu trigger={props => <FolderIconButton {...props} icon={icon} />} positionX="right">
				<div className={styles.emojiGridOuter}>
					<div>{lang('Choose an icon')}</div>
					<div className={styles.emojiGridInner} onClick={e => {
						// @ts-ignore
						const innerText = e.target.innerText || '';
						if (innerText !== icon) {
							onSetIcon(innerText);
						}
					}}>

						{folderIcons.map(folderIcon => (
							<div style={`--icon: url('${folderIcon}');`}>
								{folderIcon.split(/[_.]/g).slice(-2).shift()}
							</div>
						))}
						
					</div>
				</div>
			</DropdownMenu>

			{(isMobile && menuShown) ? (
				<Portal>
					<div className={'SymbolMenu mobile-menu left-column-open open shown'}>
						<div className="SymbolMenu-main" onClick={e => e.stopPropagation()}>
							<EmojiPicker onEmojiSelect={emoji => {
								document.execCommand('insertText', false, emoji);
								setMenuShown(false);
							}} />
						</div>
					</div>
				</Portal>
			) : (
				<Menu isOpen={menuShown} className={styles.emojiPickerMenu} onClose={() => setMenuShown(false)}>
					<div className="SymbolMenu-main" onClick={e => e.stopPropagation()}>
						<EmojiPicker onEmojiSelect={emoji => document.execCommand('insertText', false, emoji)} />
					</div>
				</Menu>
			)}



		</div>

	</div>
  };
  
export default memo(FolderNameInput);
  