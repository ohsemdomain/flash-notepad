// js/model/model.js
/**
 * @file js/model/model.js
 * @description Data model for the notepad extension
 * @requires db.js
 * 
 * Core data model that handles loading, creating, updating, and deleting notes.
 * Maintains the active note state and provides methods for filtering and searching notes.
 */

import db from '../db.js';

class NotesModel {
    constructor() {
        this.notes = [];
        this.activeNoteId = null;
    }

    async init() {
        await this.loadNotes();

        if (this.notes.length === 0) {
            // Create a default note if none exist
            await this.createNote();
        } else {
            // Set the first note as active
            this.activeNoteId = this.notes[0].id;
        }
    }

    async loadNotes() {
        try {
            // Get all notes from the database, sorted by creation date (newest first)
            this.notes = await db.notes.orderBy('createdAt').reverse().toArray();

            // Ensure all notes have a categories array
            this.notes.forEach(note => {
                if (!note.categories) {
                    note.categories = [];
                }
            });
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
        }
    }

    async createNote() {
        const newNote = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            categories: [],
            createdAt: new Date().toISOString()
        };

        try {
            // Add to database
            await db.notes.add(newNote);

            // Add to local array
            this.notes.unshift(newNote);
            this.activeNoteId = newNote.id;
            return newNote;
        } catch (error) {
            console.error('Error creating note:', error);
            return null;
        }
    }

    getActiveNote() {
        return this.notes.find(note => note.id === this.activeNoteId) || null;
    }

    async updateNote(id, updates) {
        try {
            // Update in database
            await db.notes.update(id, updates);

            // Update in local array
            const noteIndex = this.notes.findIndex(note => note.id === id);
            if (noteIndex !== -1) {
                this.notes[noteIndex] = { ...this.notes[noteIndex], ...updates };
            }
        } catch (error) {
            console.error('Error updating note:', error);
        }
    }

    async deleteNote(id) {
        try {
            // Delete from database
            await db.notes.delete(id);

            // Delete from local array
            const noteIndex = this.notes.findIndex(note => note.id === id);
            if (noteIndex !== -1) {
                this.notes.splice(noteIndex, 1);

                // Update active note if the deleted note was active
                if (this.activeNoteId === id) {
                    this.activeNoteId = this.notes.length > 0 ? this.notes[0].id : null;
                }
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    }

    // Add a category to a note
    async addCategoryToNote(noteId, categoryId) {
        try {
            const note = await db.notes.get(noteId);
            if (note) {
                // Only add if it doesn't already exist
                if (!note.categories.includes(categoryId)) {
                    note.categories.push(categoryId);
                    await db.notes.update(noteId, { categories: note.categories });

                    // Update in local array
                    const noteIndex = this.notes.findIndex(n => n.id === noteId);
                    if (noteIndex !== -1) {
                        this.notes[noteIndex].categories = note.categories;
                    }
                }
            }
        } catch (error) {
            console.error('Error adding category to note:', error);
        }
    }

    // Remove a category from a note
    async removeCategoryFromNote(noteId, categoryId) {
        try {
            const note = await db.notes.get(noteId);
            if (note) {
                note.categories = note.categories.filter(cat => cat !== categoryId);
                await db.notes.update(noteId, { categories: note.categories });

                // Update in local array
                const noteIndex = this.notes.findIndex(n => n.id === noteId);
                if (noteIndex !== -1) {
                    this.notes[noteIndex].categories = note.categories;
                }
            }
        } catch (error) {
            console.error('Error removing category from note:', error);
        }
    }

    getAllNotes() {
        return this.notes;
    }

    // New method: Filter notes by category
    async getNotesByCategory(categoryId) {
        try {
            return await db.notes
                .where('categories')
                .equals(categoryId)
                .toArray();
        } catch (error) {
            console.error('Error getting notes by category:', error);
            return [];
        }
    }

    // New method: Search notes by content
    async searchNotes(query) {
        if (!query) return this.notes;

        try {
            // This is a simple search that loads all notes and filters in memory
            // For a larger database, you might want to use a full-text search plugin for Dexie
            const allNotes = await db.notes.toArray();
            const lowerQuery = query.toLowerCase();

            return allNotes.filter(note =>
                note.title.toLowerCase().includes(lowerQuery) ||
                note.content.toLowerCase().includes(lowerQuery)
            );
        } catch (error) {
            console.error('Error searching notes:', error);
            return [];
        }
    }
}

export default NotesModel;