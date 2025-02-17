import React, { useRef, useEffect, useState } from '../../lib/teact/teact';
import { TWallpaper } from 'twallpaper'
import 'twallpaper/css'
import styles from './AnimatedBackground.module.scss';

declare const ANIMATED_BACKGROUNDS: any[];

export const animatedBackgrounds: Parameters<typeof AnimatedBackground>[0][] = (
	typeof ANIMATED_BACKGROUNDS !== 'undefined' &&
	ANIMATED_BACKGROUNDS instanceof Array ?
	ANIMATED_BACKGROUNDS : []
);

const AnimatedBackground = (props: {
	slug: string
	pattern: string
	colors: string[],
	thumbnail?: boolean,
	doBlur?: boolean
}) => {

	const { pattern, doBlur, colors, thumbnail } = props;
	let [ wallpaper, setWallpaper ] = useState<TWallpaper>();
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {

		const wrapper = wrapperRef.current;
		if (!(wrapper instanceof HTMLElement)) return;

		setWallpaper(wallpaper = new TWallpaper(wrapper, {
			animate: false,
			scrollAnimate: false,
			colors
		}));

		wallpaper.init()

	}, [ JSON.stringify(props) ]);

	useEffect(() => {

		if (!thumbnail) {
			document.addEventListener('sendMessageAction', doAnimate);
		}

		return () => {
			document.removeEventListener('sendMessageAction', doAnimate);
		}

	}, [ thumbnail ]);

	const doAnimate = () => {
		if (!wallpaper) return;
		wallpaper.toNextPosition();
	}


	return <div className={styles.wrapper}>
          

		  <div ref={wrapperRef} />

		  <div style={`
			background-image: url('${pattern}');
			background-size: ${thumbnail ? '100%' : 'auto'};
			opacity: ${thumbnail ? 0.8 : 0.5};
			filter: ${doBlur ? 'blur(2px)' : 'unset'};
          `} />
		  
	</div>;
}

export default AnimatedBackground;