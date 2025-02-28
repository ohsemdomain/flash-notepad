// File: js/model.js - Handles data management for the notepad extension

class NotesModel {
    constructor() {
        this.notes = [];
        this.activeNoteId = null;
    }

    async init() {
        await this.loadNotes();

        if (this.notes.length === 0) {
            // Create a default note if none exist
            this.createNote();
        } else {
            // Set the first note as active
            this.activeNoteId = this.notes[0].id;
        }
    }

    async loadNotes() {
        return new Promise((resolve) => {
            chrome.storage.local.get('notes', (result) => {
                this.notes = result.notes || [];

                // Ensure all notes have a categories array
                this.notes.forEach(note => {
                    if (!note.categories) {
                        note.categories = [];
                    }
                });

                resolve();
            });
        });
    }

    async saveNotes() {
        return new Promise((resolve) => {
            chrome.storage.local.set({ notes: this.notes }, resolve);
        });
    }

    createNote() {
        const newNote = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            categories: [],
            createdAt: new Date().toISOString()
        };

        this.notes.unshift(newNote);
        this.activeNoteId = newNote.id;
        this.saveNotes();
        return newNote;
    }

    getActiveNote() {
        return this.notes.find(note => note.id === this.activeNoteId) || null;
    }

    updateNote(id, updates) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            this.notes[noteIndex] = { ...this.notes[noteIndex], ...updates };
            this.saveNotes();
        }
    }

    deleteNote(id) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            this.notes.splice(noteIndex, 1);

            // Update active note if the deleted note was active
            if (this.activeNoteId === id) {
                this.activeNoteId = this.notes.length > 0 ? this.notes[0].id : null;
            }

            this.saveNotes();
        }
    }

    // Add a category to a note
    addCategoryToNote(noteId, categoryId) {
        const noteIndex = this.notes.findIndex(note => note.id === noteId);
        if (noteIndex !== -1) {
            // Only add if it doesn't already exist
            if (!this.notes[noteIndex].categories.includes(categoryId)) {
                this.notes[noteIndex].categories.push(categoryId);
                this.saveNotes();
            }
        }
    }

    // Remove a category from a note
    removeCategoryFromNote(noteId, categoryId) {
        const noteIndex = this.notes.findIndex(note => note.id === noteId);
        if (noteIndex !== -1) {
            this.notes[noteIndex].categories = this.notes[noteIndex].categories.filter(
                cat => cat !== categoryId
            );
            this.saveNotes();
        }
    }

    getAllNotes() {
        return this.notes;
    }
}

export default NotesModel;