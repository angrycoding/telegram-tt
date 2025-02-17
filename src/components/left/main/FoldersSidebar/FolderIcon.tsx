import React, { useRef, useEffect, useState } from '../../../../lib/teact/teact';
import type { FC } from '../../../../lib/teact/teact';
import folderIcons from "./folderIcons";
import './FolderIcon.module.scss';
import { useFolderMonochromeIcons } from './FoldersSidebar';

const createFolderIcon = (emoticon: any, preferMonochromeIcons: boolean) => {
  
	let result: {[key: string]: string} | undefined = undefined;
	let svgEl: SVGElement | null = null;
  
	do {
		if (typeof emoticon !== 'string' || !emoticon) break;
		
		if (preferMonochromeIcons) {
			const standardEmoticonPath = folderIcons.find(folderIcon => folderIcon.includes(emoticon));
			if (standardEmoticonPath) {
				result = {maskicon: `url("${standardEmoticonPath}");`};
				break;
			}
		}


		svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svgEl.setAttribute('width', '100');
		svgEl.setAttribute('height', '100');
		svgEl.style.position = 'fixed';
		svgEl.style.top = '0px';
		svgEl.style.left = '0px';
		svgEl.innerHTML = `<text font-size="30" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">${emoticon}</text>`;
		document.body.appendChild(svgEl);
		

		const rect = svgEl.firstElementChild?.getBoundingClientRect();
		if (!(rect instanceof DOMRect)) break;

		svgEl.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
		svgEl.firstElementChild?.setAttribute('x', String(100 / 2 - rect.x));
		svgEl.firstElementChild?.setAttribute('y', String(100 / 2 - rect.y));
		const string = new XMLSerializer().serializeToString(svgEl);
		result = {bgicon: `url("data:image/svg+xml;utf8,${encodeURIComponent(string)}")`};

  
	} while (0);
  
	if (svgEl) svgEl.remove();
  
	return result;
	
}





const FolderIcon: FC<React.HTMLProps<HTMLDivElement> & { icon?: string }> = (props) => {

	const htmlDiv = useRef<HTMLDivElement>(null);
	let [ shadowRoot, setShadowRoot ] = useState<ShadowRoot>();
	const preferMonochromeIcons = useFolderMonochromeIcons()[0];
	
	useEffect(() => {

		if (!shadowRoot) setShadowRoot(shadowRoot = htmlDiv.current?.attachShadow({ mode: 'closed' }));
		if (!shadowRoot) return;
		const [ part, icon ] = Object.entries(createFolderIcon(props.icon, preferMonochromeIcons) || {})?.[0] || [];
		shadowRoot.innerHTML = `<div part="${part}" style='--icon:${icon}'></div><slot />`

	}, [props.icon, preferMonochromeIcons]);

	return <div ref={htmlDiv} {...{
		...props,
		children: undefined,
		icon: undefined
	}}>
		{props.children}
	</div>

};



export default FolderIcon;