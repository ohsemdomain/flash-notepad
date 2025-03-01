// File: js/controller.js - Connects Model and View, handles events

import CategoriesManager from './categories.js';

class NotesController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.categoriesManager = new CategoriesManager();
        this.categoriesMap = new Map(); // For quick lookup

        // Initialize
        this.init();
    }

    async init() {
        await this.model.init();
        await this.loadCategories();
        this.refreshView();
        this.setupEventListeners();
    }

    async loadCategories() {
        const categories = await this.categoriesManager.getAllCategories();
        // Create a map for quick lookups
        this.categoriesMap.clear();
        categories.forEach(category => {
            this.categoriesMap.set(category.id, category);
        });
        return categories;
    }

    refreshView() {
        this.view.renderNotesList(this.model.getAllNotes(), this.model.activeNoteId, this.categoriesMap);
        this.view.renderActiveNote(this.model.getActiveNote());

        const activeNote = this.model.getActiveNote();
        if (activeNote && this.view.categoriesContainer) {
            this.view.renderNoteCategories(
                activeNote.categories || [],
                Array.from(this.categoriesMap.values())
            );
        }
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
                this.view.renderNotesList(this.model.getAllNotes(), this.model.activeNoteId, this.categoriesMap);
            }
        });

        // Update note content
        this.view.noteContent.addEventListener('input', (e) => {
            const activeNote = this.model.getActiveNote();
            if (activeNote) {
                this.model.updateNote(activeNote.id, { content: e.target.value });
            }
        });

        // Add category button
        if (this.view.addCategoryBtn) {
            this.view.addCategoryBtn.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevent default behavior
                e.stopPropagation(); // Stop event propagation

                const rect = e.target.closest('.icon-button').getBoundingClientRect();
                const categories = await this.categoriesManager.getAllCategories();

                const dropdown = this.view.showCategorySelector(
                    categories,
                    window.innerWidth - rect.right,
                    rect.bottom
                );

                // Handle category selection - Fix for first click not working
                const handleCategoryClick = async (e) => {
                    e.preventDefault(); // Prevent default
                    e.stopPropagation(); // Stop propagation

                    const categoryOption = e.target.closest('.category-option');
                    const createOption = e.target.closest('.create-category-option');

                    if (categoryOption) {
                        const categoryId = categoryOption.dataset.id;
                        const activeNote = this.model.getActiveNote();
                        if (activeNote) {
                            await this.model.addCategoryToNote(activeNote.id, categoryId);
                            dropdown.remove();
                            this.refreshView();
                            document.removeEventListener('click', handleCategoryClick); // Clean up
                        }
                    } else if (createOption) {
                        dropdown.remove();
                        this.showCreateCategoryForm(
                            window.innerWidth - rect.right,
                            rect.bottom
                        );
                        document.removeEventListener('click', handleCategoryClick); // Clean up
                    }
                };

                // Use direct click handlers instead of event delegation
                const categoryOptions = dropdown.querySelectorAll('.category-option');
                categoryOptions.forEach(option => {
                    option.addEventListener('click', handleCategoryClick);
                });

                const createOption = dropdown.querySelector('.create-category-option');
                if (createOption) {
                    createOption.addEventListener('click', handleCategoryClick);
                }
            });
        }

        // Remove category - Fix for remove (x) not working on first click
        if (this.view.categoriesContainer) {
            this.view.categoriesContainer.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevent default

                if (e.target.classList.contains('remove-category')) {
                    const badge = e.target.closest('.category-badge');
                    if (badge) {
                        const categoryId = badge.dataset.id;
                        const activeNote = this.model.getActiveNote();
                        if (activeNote) {
                            await this.model.removeCategoryFromNote(activeNote.id, categoryId);
                            this.refreshView();
                        }
                    }
                }
            });
        }

        // Open settings - Replace download notes button with settings button
        this.view.settingsBtn.addEventListener('click', () => {
            this.openSettings();
        });

        // Open in new tab
        this.view.openTabBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
        });

        // Note options dropdown
        this.view.noteOptionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = e.target.closest('.icon-button').getBoundingClientRect();
            const dropdown = this.view.showNoteOptions(window.innerWidth - rect.right, rect.bottom);

            // Manage categories action
            dropdown.querySelector('#manage-categories').addEventListener('click', async () => {
                dropdown.remove();
                await this.showCategoriesManager();
            });

            // Delete note action
            dropdown.querySelector('#delete-note').addEventListener('click', () => {
                const activeNote = this.model.getActiveNote();
                if (activeNote) {
                    this.view.showModal(
                        'Delete Note',
                        `Are you sure you want to delete "${activeNote.title}"?`,
                        async () => {
                            await this.model.deleteNote(activeNote.id);
                            this.refreshView();
                        }
                    );
                }
                dropdown.remove();
            });
        });

        // Settings modal event listeners
        document.getElementById('close-settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.add('hidden');
        });

        // Settings tabs
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Deactivate all tabs
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

                // Activate clicked tab
                tab.classList.add('active');
                const tabId = `${tab.dataset.tab}-tab`;
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Export notes (JSON)
        document.getElementById('export-notes-btn').addEventListener('click', () => {
            this.exportNotes('json');
        });

        // Export notes (Plain Text)
        document.getElementById('export-text-btn').addEventListener('click', () => {
            this.exportNotes('text');
        });

        // Import notes
        document.getElementById('import-notes-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        // Handle file import
        document.getElementById('import-file-input').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = async (event) => {
                    const content = event.target.result;
                    try {
                        await this.importNotes(file, content);
                        // Reset the file input
                        e.target.value = '';
                    } catch (error) {
                        alert(`Error importing notes: ${error.message}`);
                    }
                };

                if (file.name.endsWith('.json')) {
                    reader.readAsText(file);
                } else if (file.name.endsWith('.txt')) {
                    reader.readAsText(file);
                } else {
                    alert('Please select a .json or .txt file');
                }
            }
        });

        // Category management in settings
        document.getElementById('add-category-settings-btn').addEventListener('click', () => {
            // Show create category form in settings
            this.showCreateCategoryInSettings();
        });
    }

    // Open settings modal
    openSettings() {
        // Populate categories list
        this.renderCategoriesInSettings();

        // Show settings modal
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    // Show form to create a new category
    showCreateCategoryForm(x, y) {
        const form = this.view.showCreateCategoryForm(x, y);

        form.querySelector('#save-category').addEventListener('click', async () => {
            const nameInput = form.querySelector('#category-name');
            const colorInput = form.querySelector('#category-color');

            const name = nameInput.value.trim();
            const color = colorInput.value;

            if (name) {
                const newCategory = await this.categoriesManager.createCategory(name, color);
                await this.loadCategories();

                // Add to current note
                const activeNote = this.model.getActiveNote();
                if (activeNote) {
                    this.model.addCategoryToNote(activeNote.id, newCategory.id);
                }

                form.remove();
                this.refreshView();
            } else {
                nameInput.focus();
            }
        });
    }

    // Show create category in settings panel
    showCreateCategoryInSettings() {
        // This would be implemented to show a form within the settings panel
        alert('Add category functionality will be implemented here');
    }

    // Render categories in the settings panel
    async renderCategoriesInSettings() {
        const categoriesList = document.getElementById('categories-list');
        categoriesList.innerHTML = '';

        const categories = await this.categoriesManager.getAllCategories();

        if (categories.length === 0) {
            categoriesList.innerHTML = '<div class="empty-state">No categories created yet</div>';
            return;
        }

        categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <div class="category-color" style="background-color: ${category.color}"></div>
                <div class="category-name">${category.name}</div>
                <div class="category-actions">
                    <button class="icon-button edit-category" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-button delete-category" data-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            categoriesList.appendChild(categoryItem);
        });

        // Add event listeners for edit and delete actions
        categoriesList.querySelectorAll('.edit-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.id;
                // Edit category functionality would go here
                alert(`Edit category ${categoryId}`);
            });
        });

        categoriesList.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.id;
                // Delete category functionality would go here
                alert(`Delete category ${categoryId}`);
            });
        });
    }

    // Export notes as JSON or text
    exportNotes(format = 'json') {
        const notes = this.model.getAllNotes();
        let fileContent;
        let fileName;
        let mimeType;

        if (format === 'json') {
            // Export as JSON (current format)
            fileContent = JSON.stringify(notes, null, 2);
            fileName = `flash-notepad-${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
        } else {
            // Export as plain text
            fileContent = this.convertNotesToPlainText(notes);
            fileName = `flash-notepad-${new Date().toISOString().split('T')[0]}.txt`;
            mimeType = 'text/plain';
        }

        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        // Clean up
        URL.revokeObjectURL(url);
    }

    // Convert notes to plain text format
    convertNotesToPlainText(notes) {
        let textContent = `FLASH NOTEPAD BACKUP - ${new Date().toISOString()}\n\n`;

        notes.forEach(note => {
            textContent += '--- NOTE START ---\n';
            textContent += `ID: ${note.id}\n`;
            textContent += `TITLE: ${note.title}\n`;
            textContent += `CREATED: ${note.createdAt}\n`;

            if (note.categories && note.categories.length > 0) {
                const categoryNames = note.categories.map(catId => {
                    const category = this.categoriesMap.get(catId);
                    return category ? category.name : catId;
                });
                textContent += `CATEGORIES: ${categoryNames.join(', ')}\n`;
            } else {
                textContent += 'CATEGORIES: \n';
            }

            textContent += 'CONTENT:\n';
            textContent += `${note.content}\n`;
            textContent += '--- NOTE END ---\n\n';
        });

        return textContent;
    }

    // Import notes from file
    async importNotes(file, content) {
        const mergeNotes = document.getElementById('merge-notes-option').checked;

        if (file.name.endsWith('.json')) {
            try {
                const notes = JSON.parse(content);

                if (!Array.isArray(notes)) {
                    throw new Error('Invalid notes format');
                }

                if (!mergeNotes) {
                    // Delete all existing notes
                    const existingNotes = this.model.getAllNotes();
                    for (const note of existingNotes) {
                        await this.model.deleteNote(note.id);
                    }
                }

                // Import each note
                for (const note of notes) {
                    // Check if the note has required fields
                    if (!note.title || !note.content) continue;

                    if (mergeNotes) {
                        // Check if a note with the same ID exists
                        const existingNote = this.model.getAllNotes().find(n => n.id === note.id);
                        if (existingNote) {
                            await this.model.updateNote(note.id, note);
                        } else {
                            // Create a new note with the imported data
                            const newNote = await this.model.createNote();
                            await this.model.updateNote(newNote.id, {
                                title: note.title,
                                content: note.content,
                                categories: note.categories || []
                            });
                        }
                    } else {
                        // Create a new note with the imported data
                        const newNote = await this.model.createNote();
                        await this.model.updateNote(newNote.id, {
                            title: note.title,
                            content: note.content,
                            categories: note.categories || []
                        });
                    }
                }

                this.refreshView();
                alert(`Successfully imported ${notes.length} notes.`);

            } catch (error) {
                throw new Error(`Failed to parse JSON: ${error.message}`);
            }
        } else if (file.name.endsWith('.txt')) {
            try {
                const notes = this.parseTextNotes(content);

                if (!mergeNotes) {
                    // Delete all existing notes
                    const existingNotes = this.model.getAllNotes();
                    for (const note of existingNotes) {
                        await this.model.deleteNote(note.id);
                    }
                }

                // Import each note
                for (const note of notes) {
                    // Check if the note has required fields
                    if (!note.title || !note.content) continue;

                    // Create a new note with the imported data
                    const newNote = await this.model.createNote();
                    await this.model.updateNote(newNote.id, {
                        title: note.title,
                        content: note.content,
                        // Categories would need to be resolved by name
                        categories: []
                    });
                }

                this.refreshView();
                alert(`Successfully imported ${notes.length} notes.`);

            } catch (error) {
                throw new Error(`Failed to parse text file: ${error.message}`);
            }
        } else {
            throw new Error('Unsupported file format');
        }
    }

    // Parse plain text notes
    parseTextNotes(content) {
        const notes = [];
        const noteBlocks = content.split('--- NOTE START ---');

        for (let i = 1; i < noteBlocks.length; i++) { // Start from 1 to skip header
            const block = noteBlocks[i].split('--- NOTE END ---')[0];

            // Parse note properties
            const idMatch = block.match(/ID: (.+)/);
            const titleMatch = block.match(/TITLE: (.+)/);
            const contentMatch = block.match(/CONTENT:\s([\s\S]*?)(?=--- NOTE END|$)/);

            if (titleMatch && contentMatch) {
                notes.push({
                    id: idMatch ? idMatch[1].trim() : Date.now().toString(),
                    title: titleMatch[1].trim(),
                    content: contentMatch[1].trim(),
                    // We'll handle categories separately
                    categories: []
                });
            }
        }

        return notes;
    }

    // Show the categories manager modal
    async showCategoriesManager() {
        // This would be a more complex UI for managing all categories
        // Now we can just open the settings panel to the categories tab
        this.openSettings();

        // Activate the categories tab
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        document.querySelector('.settings-tab[data-tab="categories"]').classList.add('active');
        document.getElementById('categories-tab').classList.add('active');
    }
}

export default NotesController;