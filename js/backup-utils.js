// File: js/backup-utils.js - Utilities for backup and import

/**
 * Converts notes to plain text format for backup
 * 
 * @param {Array} notes Array of note objects
 * @param {Map} categoriesMap Map of categories for lookup
 * @returns {string} Formatted plain text
 */
export function convertNotesToPlainText(notes, categoriesMap) {
    let textContent = `FLASH NOTEPAD BACKUP - ${new Date().toISOString()}\n\n`;

    notes.forEach(note => {
        textContent += '--- NOTE START ---\n';
        textContent += `ID: ${note.id}\n`;
        textContent += `TITLE: ${note.title}\n`;
        textContent += `CREATED: ${note.createdAt}\n`;

        if (note.categories && note.categories.length > 0) {
            const categoryNames = note.categories.map(catId => {
                const category = categoriesMap.get(catId);
                return category ? `${category.name}:${category.color}` : catId;
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

/**
 * Parse plain text notes back into note objects
 * 
 * @param {string} content Plain text content
 * @param {Array} existingCategories Array of category objects for resolving by name
 * @returns {Array} Array of parsed note objects
 */
export function parseTextNotes(content, existingCategories) {
    const notes = [];
    const noteBlocks = content.split('--- NOTE START ---');

    for (let i = 1; i < noteBlocks.length; i++) { // Start from 1 to skip header
        const block = noteBlocks[i].split('--- NOTE END ---')[0];

        // Parse note properties
        const idMatch = block.match(/ID: (.+)/);
        const titleMatch = block.match(/TITLE: (.+)/);
        const createdMatch = block.match(/CREATED: (.+)/);
        const categoriesMatch = block.match(/CATEGORIES: (.+)/);
        const contentMatch = block.match(/CONTENT:\s([\s\S]*?)(?=--- NOTE END|$)/);

        if (titleMatch && contentMatch) {
            const parsedCategories = [];

            // Parse categories if they exist
            if (categoriesMatch && categoriesMatch[1].trim()) {
                const categoryStrings = categoriesMatch[1].split(',').map(c => c.trim());

                categoryStrings.forEach(catStr => {
                    // Check if category has color information
                    if (catStr.includes(':')) {
                        const [name, color] = catStr.split(':');
                        // Look for existing category with this name
                        const existingCat = existingCategories.find(c => c.name === name);
                        if (existingCat) {
                            parsedCategories.push(existingCat.id);
                        } else {
                            // Category doesn't exist yet - it would be created later
                            // This requires category creation logic in the import process
                        }
                    } else {
                        // Simple category name - try to find by name
                        const existingCat = existingCategories.find(c => c.name === catStr);
                        if (existingCat) {
                            parsedCategories.push(existingCat.id);
                        }
                    }
                });
            }

            notes.push({
                id: idMatch ? idMatch[1].trim() : Date.now().toString(),
                title: titleMatch[1].trim(),
                content: contentMatch[1].trim(),
                createdAt: createdMatch ? createdMatch[1].trim() : new Date().toISOString(),
                categories: parsedCategories
            });
        }
    }

    return notes;
}

/**
 * Check if a JSON file has the expected notes format
 * 
 * @param {Array} data JSON data to validate
 * @returns {boolean} True if valid format
 */
export function validateNotesFormat(data) {
    if (!Array.isArray(data)) return false;

    // Check at least one note has expected properties
    if (data.length === 0) return true;

    const requiredProps = ['title', 'content'];

    // Check if at least first note has the required properties
    const firstNote = data[0];
    return requiredProps.every(prop => firstNote.hasOwnProperty(prop));
}