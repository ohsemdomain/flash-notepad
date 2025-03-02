// js/model/backup-utils.js
/**
 * @file js/backup-utils.js
 * @description Utilities for export and import of notes
 * 
 * Provides functions to convert notes to and from plain text format for backup
 * and restoration purposes. Handles formatting with metadata and content sections
 * for each note, including categories references.
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
    const categoryCache = {}; // For tracking created categories during import

    // Helper function to find or create a category
    const findOrCreateCategory = (name, color = '#4285F4') => {
        // First check cache
        if (categoryCache[name]) return categoryCache[name];

        // Then check existing categories
        const existingCat = existingCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (existingCat) {
            categoryCache[name] = existingCat.id;
            return existingCat.id;
        }

        // Not found - this would require creating a new category
        // This would be handled separately during the import process
        return null;
    };

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
                        const categoryId = findOrCreateCategory(name, color);
                        if (categoryId) {
                            parsedCategories.push(categoryId);
                        }
                    } else {
                        // Simple category name - try to find by name
                        const categoryId = findOrCreateCategory(catStr);
                        if (categoryId) {
                            parsedCategories.push(categoryId);
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