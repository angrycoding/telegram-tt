declare const FOLDER_ICONS: string[];

const folderIcons: string[] = (
	typeof FOLDER_ICONS !== 'undefined' &&
	FOLDER_ICONS instanceof Array ?
	FOLDER_ICONS : []
).filter(i => i?.trim?.());

export default folderIcons;