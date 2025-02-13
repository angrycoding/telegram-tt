import Path from 'path';
import FS from 'fs-extra';
// @ts-ignore
import replaceColor from 'replace-color';

let index = 0;
const regexp = /([a-z]+)\s*\:\s*icon\s*\{\s*\{\s*\"(.+)\"/gi;
const targetDir = Path.resolve(__dirname, `../public/folder-icons/`);

const loadUrl = async(url: string): Promise<string> => {
	try {
		const response = await fetch(url);
		const text = await response.text();
		return text || '';
	} catch (e) {}
	return '';
}

(async() => {


	await FS.ensureDir(targetDir);
	await FS.emptyDir(targetDir);

	const filterIconsStyle = await loadUrl('https://raw.githubusercontent.com/telegramdesktop/tdesktop/refs/heads/dev/Telegram/SourceFiles/ui/filter_icons.style');
	const filterIcons = await loadUrl('https://raw.githubusercontent.com/telegramdesktop/tdesktop/refs/heads/dev/Telegram/SourceFiles/ui/filter_icons.cpp');


	for (;;) {
		const match = regexp.exec(filterIconsStyle);
		if (!match) break;
		const id = match[1];
		const path = match[2];
		if (id.toLowerCase().endsWith('active')) continue;
		const m =  filterIcons.match(new RegExp(`${id},[^"]+"(.+)"`));
		if (m?.[0]?.includes?.('//')) continue;
		const emoticon = m?.[1];
		if (!emoticon) continue;

		const emoticonch = Buffer.from(
			emoticon.split(/[x\\]/g)
			.filter(Boolean)
			.map(ch => parseInt(ch, 16))
		).toString('utf-8');
		  

		try {

			const img = await replaceColor({
				image: `https://raw.githubusercontent.com/telegramdesktop/tdesktop/refs/heads/dev/Telegram/Resources/icons/${path}@3x.png`,
				colors: {
					type: 'hex',
					targetColor: '#000000',
					replaceColor: '#00000000'
				}
			})

			await img.write(
				Path.resolve(targetDir, `${index++}_${emoticonch}.png`)
			)

			console.info({
				id,
				emoticon,
				emoticonch
			})
	

		} catch (e) {}
		

	}


})();

