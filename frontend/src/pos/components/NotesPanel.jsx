import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { createPortal } from 'react-dom';

const NotesQuillEditor = lazy(() => import('./NotesQuillEditor'));
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Pin,
  Search,
  History,
  X,
  User,
  Tag
} from 'lucide-react';
import {
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useGetNoteHistoryQuery,
  useSearchUsersQuery,
} from '../store/services/notesApi';
import { handleApiError, showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { toast } from 'sonner';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from '@/components/ui/button';

/**
 * Notes Panel Component
 * Supports rich text editing, @mentions, history, privacy, and search
 */
const NotesPanel = ({
  entityType,
  entityId,
  entityName,
  onClose
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 350);
  const [filterPrivate, setFilterPrivate] = useState(null);
  const [filterTags, setFilterTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  const [noteContent, setNoteContent] = useState('');
  const [noteHtmlContent, setNoteHtmlContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(null);
  const [mentionUsers, setMentionUsers] = useState([]);

  const quillRef = useRef(null);

  // Fetch notes
  const { data: notesData, isLoading: notesLoading, refetch } = useGetNotesQuery(
    {
      entityType,
      entityId,
      search: searchTerm || undefined,
      isPrivate: filterPrivate !== null ? filterPrivate : undefined
    },
    {
      skip: !entityType || !entityId,
    }
  );

  const notes = notesData?.notes || notesData?.data?.notes || [];

  // Fetch users for mentions
  const { data: usersData } = useSearchUsersQuery(
    mentionQuery,
    {
      skip: mentionQuery.length < 2,
    }
  );

  useEffect(() => {
    if (usersData) {
      setMentionUsers(usersData?.data || usersData || []);
      setShowMentions(mentionQuery.length >= 2);
    }
  }, [usersData, mentionQuery]);

  // Extract unique tags from notes
  useEffect(() => {
    const allTags = new Set();
    notes.forEach(note => {
      note.tags?.forEach(tag => allTags.add(tag));
    });
    setAvailableTags(Array.from(allTags));
  }, [notes]);

  // Create note mutation
  const [createNote, { isLoading: isCreatingNote }] = useCreateNoteMutation();

  // Update note mutation
  const [updateNote, { isLoading: isUpdatingNote }] = useUpdateNoteMutation();

  // Delete note mutation
  const [deleteNote, { isLoading: isDeletingNote }] = useDeleteNoteMutation();

  // Fetch note history
  const { data: historyData, isLoading: historyLoading } = useGetNoteHistoryQuery(
    selectedNoteId,
    {
      skip: !selectedNoteId || !showHistory
    }
  );

  const resetForm = () => {
    setNoteContent('');
    setNoteHtmlContent('');
    setIsPrivate(false);
    setIsPinned(false);
    setTags([]);
    setTagInput('');
    setIsCreating(false);
    setEditingNoteId(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleEdit = (note) => {
    setNoteContent(note.content);
    setNoteHtmlContent(note.htmlContent || note.content);
    setIsPrivate(note.isPrivate);
    setIsPinned(note.isPinned);
    setTags(note.tags || []);
    setEditingNoteId(note._id);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!noteContent.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    const noteData = {
      entityType,
      entityId,
      content: noteContent,
      htmlContent: noteHtmlContent,
      isPrivate,
      isPinned,
      tags
    };

    try {
      if (editingNoteId) {
        await updateNote({ id: editingNoteId, ...noteData }).unwrap();
        showSuccessToast('Note updated successfully');
      } else {
        await createNote(noteData).unwrap();
        showSuccessToast('Note created successfully');
      }
      resetForm();
      refetch();
    } catch (error) {
      handleApiError(error, editingNoteId ? 'Update Note' : 'Create Note');
    }
  };

  const handleDelete = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(noteId).unwrap();
        showSuccessToast('Note deleted successfully');
        refetch();
      } catch (error) {
        handleApiError(error, 'Delete Note');
      }
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle @mentions in editor
  const handleEditorChange = (content, delta, source, editor) => {
    setNoteHtmlContent(content);
    const text = editor.getText();
    setNoteContent(text);

    // Check for @mention on text change
    if (source === 'user' || source === 'api') {
      setTimeout(() => {
        try {
          const selection = editor.getSelection();
          if (selection) {
            const cursorPosition = selection.index;
            const textBeforeCursor = text.substring(0, cursorPosition);
            const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

            if (mentionMatch) {
              setMentionQuery(mentionMatch[1]);
              setMentionPosition(cursorPosition);
              setShowMentions(true);
            } else {
              setShowMentions(false);
              setMentionQuery('');
            }
          }
        } catch (error) {
          // Ignore selection errors
          setShowMentions(false);
        }
      }, 0);
    }
  };

  const handleInsertMention = (user) => {
    if (!quillRef.current) return;

    const editor = quillRef.current.getEditor();
    const selection = editor.getSelection();

    if (selection) {
      const text = editor.getText();
      const beforeCursor = text.substring(0, selection.index);
      const mentionMatch = beforeCursor.match(/@(\w*)$/);

      if (mentionMatch) {
        const startIndex = selection.index - mentionMatch[0].length;
        const mentionText = `@${user.username || user.name} `;
        editor.deleteText(startIndex, mentionMatch[0].length);
        editor.insertText(startIndex, mentionText);
        editor.setSelection(startIndex + mentionText.length);
      }
    }

    setShowMentions(false);
    setMentionQuery('');
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  };

  const filteredNotes = notes.filter(note => {
    if (filterTags.length > 0) {
      const noteTags = note.tags || [];
      if (!filterTags.some(tag => noteTags.includes(tag))) {
        return false;
      }
    }
    return true;
  });

  const panelContent = (
    <div className="pos-app">
      <div 
        className="fixed inset-0 z-[1100] bg-gray-900/60 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Notes
                </h2>
                <p className="text-sm text-gray-500">
                  {entityName || `${entityType} #${entityId}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all flex items-center space-x-2"
              >
                <History className="h-4 w-4" />
                <span>{showHistory ? 'Hide History' : 'History'}</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Notes List */}
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col bg-gray-50/30">
              {/* Search and Filters */}
              <div className="p-4 border-b border-gray-100 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white shadow-sm"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilterPrivate(filterPrivate === false ? null : false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterPrivate === false
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <Unlock className="h-3 w-3 inline mr-1" />
                    Public
                  </button>
                  <button
                    onClick={() => setFilterPrivate(filterPrivate === true ? null : true)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterPrivate === true
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <Lock className="h-3 w-3 inline mr-1" />
                    Private
                  </button>
                </div>

                {availableTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {availableTags.slice(0, 8).map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (filterTags.includes(tag)) {
                            setFilterTags(filterTags.filter(t => t !== tag));
                          } else {
                            setFilterTags([...filterTags, tag]);
                          }
                        }}
                        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filterTags.includes(tag)
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes List Scroll Area */}
              <div className="flex-1 overflow-y-auto">
                {notesLoading ? (
                  <div className="p-8 text-center">
                    <LoadingSpinner />
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No notes found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredNotes.map(note => (
                      <div
                        key={note._id}
                        onClick={() => {
                          setSelectedNoteId(note._id);
                          setShowHistory(false);
                          setIsCreating(false);
                        }}
                        className={`p-4 cursor-pointer transition-all ${selectedNoteId === note._id 
                          ? 'bg-white shadow-md z-10 relative border-l-4 border-primary-600' 
                          : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex items-center space-x-2">
                            {note.isPinned && <Pin className="h-3 w-3 text-amber-500 fill-current" />}
                            {note.isPrivate && <Lock className="h-3 w-3 text-gray-400" />}
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                              {note.createdBy?.name || 'Unknown'}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                          {note.content}
                        </p>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {note.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create Button */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <Button
                  onClick={handleStartCreate}
                  variant="default"
                  className="w-full flex items-center justify-center py-6 shadow-lg shadow-primary-500/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Note
                </Button>
              </div>
            </div>

            {/* Note Detail / Editor */}
            <div className="flex-1 flex flex-col bg-white overflow-y-auto">
              {isCreating ? (
                <div className="flex-1 flex flex-col p-6">
                  <div className="space-y-6 flex-1">
                    {/* Editor */}
                    <div className="flex flex-col flex-1 min-h-[300px]">
                      <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                        Note Content
                      </label>
                      <div className="relative flex-1 flex flex-col">
                        <Suspense
                          fallback={(
                            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 animate-pulse flex items-center justify-center">
                              <LoadingSpinner />
                            </div>
                          )}
                        >
                          <NotesQuillEditor
                            ref={quillRef}
                            theme="snow"
                            value={noteHtmlContent}
                            onChange={handleEditorChange}
                            modules={quillModules}
                            placeholder="Type something amazing... Use @ to mention team members"
                            className="bg-white flex-1 flex flex-col"
                          />
                        </Suspense>
                        {showMentions && mentionUsers.length > 0 && (
                          <div className="absolute z-50 bottom-full left-0 bg-white border border-gray-200 rounded-xl shadow-2xl mb-2 max-h-48 overflow-y-auto w-64 p-1">
                            <p className="text-[10px] font-bold text-gray-400 px-3 py-2 uppercase tracking-widest border-b border-gray-50">Mention User</p>
                            {mentionUsers.map(user => (
                              <button
                                key={user._id}
                                onClick={() => handleInsertMention(user)}
                                className="w-full px-3 py-2.5 text-left hover:bg-primary-50 hover:text-primary-700 rounded-lg flex items-center space-x-3 transition-colors"
                              >
                                <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">
                                  {user.name?.[0] || user.username?.[0] || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold leading-tight">{user.name || user.username}</p>
                                  <p className="text-[10px] text-gray-400">@{user.username}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                        Tags & Organization
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-3 py-1 rounded-full bg-primary-600 text-white text-xs font-bold shadow-sm shadow-primary-500/30"
                          >
                            #{tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-2 text-white/70 hover:text-white transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Add tag and press Enter..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleAddTag}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                        />
                      </div>
                    </div>

                    {/* Options */}
                    <div className="flex items-center space-x-6 px-1">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors flex items-center">
                          <Lock className="h-4 w-4 mr-2" />
                          Mark as Private
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-amber-600 transition-colors flex items-center">
                          <Pin className="h-4 w-4 mr-2" />
                          Pin to Top
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
                    <button
                      onClick={resetForm}
                      className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Discard
                    </button>
                    <Button
                      onClick={handleSave}
                      disabled={isCreatingNote || isUpdatingNote}
                      className="px-8 py-2.5 rounded-full shadow-lg shadow-primary-500/20"
                    >
                      {editingNoteId ? 'Update Changes' : 'Publish Note'}
                    </Button>
                  </div>
                </div>
              ) : selectedNoteId ? (
                <div className="flex-1 flex flex-col p-6 sm:p-8">
                  {(() => {
                    const note = notes.find(n => n._id === selectedNoteId);
                    if (!note) return null;

                    return (
                      <div className="max-w-3xl mx-auto w-full">
                        {/* Note Header */}
                        <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-50">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500">
                              {note.createdBy?.name?.[0] || '?'}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-bold text-gray-900 leading-none">
                                  {note.createdBy?.name || 'Unknown User'}
                                </h4>
                                {note.isPinned && <Pin className="h-3.5 w-3.5 text-amber-500 fill-current" title="Pinned" />}
                                {note.isPrivate && <Lock className="h-3.5 w-3.5 text-gray-400" title="Private Note" />}
                              </div>
                              <p className="text-xs text-gray-400 font-medium">
                                Created {new Date(note.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEdit(note)}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(note._id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Note Content */}
                        <div
                          className="prose prose-slate max-w-none mb-10 text-gray-800 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: note.htmlContent || note.content }}
                        />

                        {/* Organization */}
                        {(note.tags?.length > 0 || note.mentions?.length > 0) && (
                          <div className="space-y-6 pt-8 border-t border-gray-50">
                            {note.tags?.length > 0 && (
                              <div>
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tags</h5>
                                <div className="flex flex-wrap gap-2">
                                  {note.tags.map(tag => (
                                    <span key={tag} className="text-xs font-bold bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {note.mentions?.length > 0 && (
                              <div>
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Mentioned Team</h5>
                                <div className="flex flex-wrap gap-2">
                                  {note.mentions.map((mention, idx) => (
                                    <span key={idx} className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                      <div className="h-4 w-4 rounded-full bg-gray-200" />
                                      <span>@{mention.username}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* History Section */}
                        {showHistory && (
                          <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-100">
                            <div className="flex items-center space-x-2 mb-6">
                              <History className="h-5 w-5 text-gray-400" />
                              <h4 className="font-bold text-gray-900">Revision History</h4>
                            </div>
                            {historyLoading ? (
                              <div className="flex justify-center p-8">
                                <LoadingSpinner />
                              </div>
                            ) : historyData && historyData.length > 0 ? (
                              <div className="space-y-6">
                                {historyData.map((entry, idx) => (
                                  <div key={idx} className="relative pl-6 border-l-2 border-gray-100 py-1">
                                    <div className="absolute left-[-9px] top-3 h-4 w-4 rounded-full bg-white border-2 border-gray-200" />
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-bold text-gray-700">
                                        {entry.editedBy?.name || 'System User'}
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                                        {new Date(entry.editedAt).toLocaleString()}
                                      </span>
                                    </div>
                                    {entry.changeReason && (
                                      <p className="text-xs italic text-gray-500 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">" {entry.changeReason} "</p>
                                    )}
                                    <div
                                      className="text-sm text-gray-600 prose prose-sm max-w-none line-clamp-3 opacity-70"
                                      dangerouslySetInnerHTML={{ __html: entry.htmlContent || entry.content }}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-10 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                                <History className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm text-gray-500 font-medium">No previous versions found</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50/20">
                  <div className="text-center max-w-xs animate-fade-in">
                    <div className="h-20 w-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                      <MessageSquare className="h-10 w-10 text-primary-200" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Workspace Notes</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Capture thoughts, @mention teammates, and track version history in one beautiful place.
                    </p>
                    <Button
                      onClick={handleStartCreate}
                      variant="outline"
                      className="mt-8 rounded-full px-8"
                    >
                      Start Writing
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(panelContent, document.body) : null;
};

export default NotesPanel;
export { NotesPanel };
