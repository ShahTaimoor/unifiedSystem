/**
 * Keyboard Shortcuts Hints Component
 * Displays available keyboard shortcuts
 */

import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useKeyboardShortcutsContext } from '../contexts/KeyboardShortcutsContext';
import { Button } from '@/components/ui/button';

import BaseModal from './BaseModal';

export const KeyboardShortcutsHints = () => {
  const { shortcuts, showHints, setShowHints, formatKeyDisplay } = useKeyboardShortcutsContext();

  // Group shortcuts by category
  const groupedShortcuts = Object.entries(shortcuts).reduce((acc, [id, shortcut]) => {
    const category = shortcut.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ id, ...shortcut });
    return acc;
  }, {});

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Actions',
    other: 'Other'
  };

  return (
    <BaseModal
      isOpen={showHints}
      onClose={() => setShowHints(false)}
      title="Keyboard Shortcuts"
      maxWidth="2xl"
      variant="centered"
    >
      <div className="p-6">
        <div className="space-y-8">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                <span className="w-8 h-px bg-gray-100 mr-3"></span>
                {categoryLabels[category] || category}
                <span className="ml-3 flex-1 h-px bg-gray-100"></span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                {categoryShortcuts.map((shortcut) => (
                  <div key={shortcut.id} className="flex items-center justify-between group">
                    <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                      {shortcut.label}
                    </span>
                    <div className="flex space-x-1.5">
                      {shortcut.keys.map((key, idx) => (
                        <kbd 
                          key={idx} 
                          className="px-2.5 py-1.5 min-w-[2.5rem] text-center bg-gray-50 border border-gray-200 border-b-4 rounded-lg text-xs font-bold text-gray-700 shadow-sm"
                        >
                          {formatKeyDisplay(key)}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
          <Button
            onClick={() => setShowHints(false)}
            variant="default"
            className="px-8 rounded-xl font-bold shadow-lg shadow-primary-500/10 transition-all active:scale-95"
          >
            Got it
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default KeyboardShortcutsHints;
