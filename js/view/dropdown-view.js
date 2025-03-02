// js/view/dropdown-view.js
/**
 * @file js/view/dropdown-view.js
 * @description Dropdown menu components
 * 
 * Creates and manages dropdown menus for various purposes including
 * note options and category selection. Provides general-purpose dropdown
 * creation functionality.
 */

class DropdownView {
    constructor() {
        // No initialization needed for now
    }

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
        <div id="manage-categories" class="dropdown-item">
          <i class="fas fa-tags"></i> Manage categories
        </div>
        <div id="delete-note" class="dropdown-item text-danger">
          <i class="fas fa-trash"></i> Delete note
        </div>
      `;

        document.body.appendChild(dropdown);

        // Close dropdown when clicking outside
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== document.getElementById('note-options-btn')) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });

        return dropdown;
    }

    // Helper method to create any dropdown menu
    createDropdown(id, items, x, y, maxHeight = null) {
        // Remove any existing dropdown with the same ID
        const existingDropdown = document.getElementById(id);
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Create dropdown element
        const dropdown = document.createElement('div');
        dropdown.id = id;
        dropdown.className = 'dropdown-menu';
        dropdown.style.top = `${y}px`;
        dropdown.style.right = `${x}px`;

        if (maxHeight) {
            dropdown.style.maxHeight = maxHeight;
            dropdown.style.overflowY = 'auto';
        }

        // Add items to dropdown
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = `dropdown-item ${item.className || ''}`;
            if (item.id) itemEl.id = item.id;
            if (item.dataId) itemEl.dataset.id = item.dataId;

            itemEl.innerHTML = item.html || item.text;
            dropdown.appendChild(itemEl);

            // Add separator after item if needed
            if (item.addSeparator) {
                const separator = document.createElement('div');
                separator.className = 'dropdown-separator';
                dropdown.appendChild(separator);
            }
        });

        document.body.appendChild(dropdown);

        // Return the created dropdown for further customization
        return dropdown;
    }
}

export default DropdownView;