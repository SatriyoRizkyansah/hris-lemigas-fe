import { signal } from "@Signal/signal";

const clickCount = signal(0);
let clickTimeout: ReturnType<typeof setTimeout> | undefined;

export function doubleClickAction(onSingleClick: () => void, onDoubleClick: () => void, timeOut: number = 200) {
  if (clickCount.value === 0) {
    clickCount.value++;
    clickTimeout = setTimeout(() => {
      onSingleClick();
      clickCount.value = 0;
    }, timeOut);
  } else if (clickCount.value === 1) {
    if (clickTimeout) clearTimeout(clickTimeout);
    onDoubleClick();
    clickCount.value = 0;
  }
}
