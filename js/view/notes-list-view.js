// File: js/view/notes-list-view.js - Handles rendering the notes list

class NotesListView {
    constructor(notesListElement) {
        this.notesListElement = notesListElement;
    }

    renderNotesList(notes, activeNoteId, categoriesMap) {
        this.notesListElement.innerHTML = '';

        if (notes.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No notes yet. Click + to create one.';
            this.notesListElement.appendChild(emptyState);
            return;
        }

        notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = `note-item ${note.id === activeNoteId ? 'active' : ''}`;
            noteItem.dataset.id = note.id;

            // Create title element
            const titleElement = document.createElement('div');
            titleElement.className = 'note-item-title';
            titleElement.textContent = note.title || 'Untitled Note';

            // Create categories container
            const categoriesElement = document.createElement('div');
            categoriesElement.className = 'note-item-categories';

            // Render each category badge
            if (note.categories && note.categories.length > 0) {
                note.categories.forEach(categoryId => {
                    const category = categoriesMap.get(categoryId);
                    if (category) {
                        const badge = document.createElement('span');
                        badge.className = 'category-badge';
                        badge.style.backgroundColor = category.color;
                        badge.textContent = category.name;
                        categoriesElement.appendChild(badge);
                    }
                });
            }

            // Append elements to note item
            noteItem.appendChild(titleElement);
            noteItem.appendChild(categoriesElement);

            this.notesListElement.appendChild(noteItem);
        });
    }
}

export default NotesListView;