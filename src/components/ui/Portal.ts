import type { FC, VirtualElement } from '../../lib/teact/teact';
import { useLayoutEffect, useRef } from '../../lib/teact/teact';
import TeactDOM from '../../lib/teact/teact-dom';

type OwnProps = {
  containerSelector?: string;
  className?: string;
  children: VirtualElement;
  prepend?: boolean,
  renderChildrenOnly?: boolean
};

const Portal: FC<OwnProps> = ({ containerSelector, className, children, prepend, renderChildrenOnly }) => {
  const elementRef = useRef<HTMLDivElement>();
  if (!elementRef.current) {
    elementRef.current = document.createElement('div');
  }

  useLayoutEffect(() => {
    const container = document.querySelector<HTMLDivElement>(containerSelector || '#portals');
    if (!container) {
      return undefined;
    }

    const element = elementRef.current!;
    if (className) {
      element.classList.add(className);
    }

    if (prepend) {
      container.prepend(element)
    } else {
      container.appendChild(element);
    }

    return () => {
      TeactDOM.render(undefined, element);
      container.removeChild(element);
    };
  }, [className, containerSelector, prepend, renderChildrenOnly]);

  return renderChildrenOnly ? children : TeactDOM.render(children, elementRef.current);
};

export default Portal;
