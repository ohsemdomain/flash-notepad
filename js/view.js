// File: js/view.js - Manages UI updates for the notepad extension

class NotesView {
    constructor() {
        // DOM elements
        this.notesList = document.getElementById('notes-list');
        this.noteTitle = document.getElementById('note-title');
        this.noteContent = document.getElementById('note-content');
        this.addNoteBtn = document.getElementById('add-note-btn');
        this.downloadNotesBtn = document.getElementById('download-notes-btn');
        this.openTabBtn = document.getElementById('open-tab-btn');
        this.noteOptionsBtn = document.getElementById('note-options-btn');
    }

    // Render the list of notes
    renderNotesList(notes, activeNoteId) {
        this.notesList.innerHTML = '';

        notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = `note-item ${note.id === activeNoteId ? 'active' : ''}`;
            noteItem.dataset.id = note.id;
            noteItem.innerHTML = `
          <div class="note-item-title">${note.title}</div>
        `;

            this.notesList.appendChild(noteItem);
        });
    }

    // Render the active note
    renderActiveNote(note) {
        if (note) {
            this.noteTitle.value = note.title;
            this.noteContent.value = note.content;
        } else {
            this.noteTitle.value = '';
            this.noteContent.value = '';
        }
    }

    // Create a dropdown menu for note options
    showNoteOptions(x, y) {
        // Remove any existing dropdown
        const existingDropdown = document.getElementById('note-options-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Create dropdown element
        const dropdown = document.createElement('div');
        dropdown.id = 'note-options-dropdown';
        dropdown.className = 'dropdown-menu';
        dropdown.style.top = `${y}px`;
        dropdown.style.right = `${x}px`;

        // Add dropdown items
        dropdown.innerHTML = `
        <div id="delete-note" class="dropdown-item">
          Delete note
        </div>
      `;

        document.body.appendChild(dropdown);

        // Close dropdown when clicking outside
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== this.noteOptionsBtn) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });

        return dropdown;
    }
}

export default NotesView;