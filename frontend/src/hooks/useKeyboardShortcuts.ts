import { useEffect, useCallback, RefObject } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export interface KeyboardShortcutsOptions {
  enabled?: boolean;
  targetRef?: RefObject<HTMLElement>;
  preventDefault?: boolean;
}

export default function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: KeyboardShortcutsOptions = {}
) {
  const { 
    enabled = true, 
    targetRef = null,
    preventDefault = true
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // ポップアップ内のテキスト入力時は無効
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      document.activeElement instanceof HTMLSelectElement
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
      const altMatch = !!shortcut.altKey === event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        shortcut.action();
        return;
      }
    }
  }, [enabled, shortcuts, preventDefault]);

  useEffect(() => {
    const target = targetRef?.current || document;
    
    target.addEventListener('keydown', handleKeyDown);
    
    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, targetRef]);

  // ショートカットのヘルプテキストを生成
  const getShortcutHelpText = useCallback(() => {
    return shortcuts.map(shortcut => {
      const modifiers = [
        shortcut.ctrlKey && 'Ctrl',
        shortcut.altKey && 'Alt',
        shortcut.shiftKey && 'Shift'
      ].filter(Boolean).join('+');

      const keyText = shortcut.key.length === 1 
        ? shortcut.key.toUpperCase() 
        : shortcut.key;
      
      const shortcutText = modifiers 
        ? `${modifiers}+${keyText}` 
        : keyText;

      return {
        shortcut: shortcutText,
        description: shortcut.description
      };
    });
  }, [shortcuts]);

  return { getShortcutHelpText };
}