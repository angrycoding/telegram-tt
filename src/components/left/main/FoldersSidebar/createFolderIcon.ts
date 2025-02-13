import folderIcons from "./folderIcons";

const createFolderIcon = (emoticon: any, maskOnly?: boolean) => {
  
	let result: string | undefined = undefined;
	let svgEl: SVGElement | null = null;
  
	do {
	  if (typeof emoticon !== 'string' || !emoticon) break;
  
	  const standardEmoticonPath = folderIcons.find(folderIcon => folderIcon.includes(emoticon));
	  if (standardEmoticonPath) {
		result = `--maskicon: url("${standardEmoticonPath}");`;
		break;
	  }

	  if (maskOnly) break;
  
	  svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	  svgEl.setAttribute('width', '100');
	  svgEl.setAttribute('height', '100');
	  svgEl.innerHTML = `<text font-size="50" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">${emoticon}</text>`;
	  document.body.appendChild(svgEl);
	  const rect = svgEl.firstElementChild?.getBoundingClientRect();
	  if (!(rect instanceof DOMRect)) break;
	  svgEl.setAttribute('width', String(rect.width));
	  svgEl.setAttribute('height', String(rect.height));
	  result = encodeURIComponent(new XMLSerializer().serializeToString(svgEl));
	  result = `--bgicon: url("data:image/svg+xml;utf8,${result}")`;
  
	} while (0);
  
	if (svgEl) svgEl.remove();
  
	return result;
	
}

export default createFolderIcon;