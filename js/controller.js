// File: js/controller.js - Connects Model and View, handles events

class NotesController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        // Initialize
        this.init();
    }

    async init() {
        await this.model.init();
        this.refreshView();
        this.setupEventListeners();
    }

    refreshView() {
        this.view.renderNotesList(this.model.getAllNotes(), this.model.activeNoteId);
        this.view.renderActiveNote(this.model.getActiveNote());
    }

    setupEventListeners() {
        // Add new note
        this.view.addNoteBtn.addEventListener('click', () => {
            this.model.createNote();
            this.refreshView();
        });

        // Select note
        this.view.notesList.addEventListener('click', (e) => {
            const noteItem = e.target.closest('.note-item');
            if (noteItem) {
                this.model.activeNoteId = noteItem.dataset.id;
                this.refreshView();
            }
        });

        // Update note title
        this.view.noteTitle.addEventListener('input', (e) => {
            const activeNote = this.model.getActiveNote();
            if (activeNote) {
                this.model.updateNote(activeNote.id, { title: e.target.value });
                this.view.renderNotesList(this.model.getAllNotes(), this.model.activeNoteId);
            }
        });

        // Update note content
        this.view.noteContent.addEventListener('input', (e) => {
            const activeNote = this.model.getActiveNote();
            if (activeNote) {
                this.model.updateNote(activeNote.id, { content: e.target.value });
            }
        });

        // Download all notes
        this.view.downloadNotesBtn.addEventListener('click', () => {
            this.downloadNotes();
        });

        // Open in new tab
        this.view.openTabBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
        });

        // Note options dropdown
        this.view.noteOptionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = e.target.getBoundingClientRect();
            const dropdown = this.view.showNoteOptions(window.innerWidth - rect.right, rect.bottom);

            // Delete note action
            dropdown.querySelector('#delete-note').addEventListener('click', () => {
                const activeNote = this.model.getActiveNote();
                if (activeNote) {
                    if (confirm('Are you sure you want to delete this note?')) {
                        this.model.deleteNote(activeNote.id);
                        this.refreshView();
                    }
                }
                dropdown.remove();
            });
        });
    }

    downloadNotes() {
        const notes = this.model.getAllNotes();

        // Prepare data
        const jsonData = JSON.stringify(notes, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        // Clean up
        URL.revokeObjectURL(url);
    }
}

export default NotesController;