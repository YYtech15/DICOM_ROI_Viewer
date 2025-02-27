import React from 'react';
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ShortcutInfo {
  shortcut: string;
  description: string;
}

interface ShortcutsHelpProps {
  shortcuts: ShortcutInfo[];
  title?: string;
}

export default function ShortcutsHelp({ shortcuts, title = 'Keyboard Shortcuts' }: ShortcutsHelpProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={toggleOpen}
        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        aria-label="Show keyboard shortcuts"
        title="Keyboard Shortcuts"
      >
        <QuestionMarkCircleIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="shortcuts-modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={toggleOpen}></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="shortcuts-modal-title">
                  {title}
                </h3>
                <button
                  onClick={toggleOpen}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 font-mono text-sm px-2 py-1 bg-gray-100 rounded">
                        {shortcut.shortcut}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-700">{shortcut.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-5 text-sm text-gray-500 text-center">
                Press <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">?</kbd> at any time to show this help
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}