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
 * @returns {Promise<string>} Formatted plain text
 */

export async function convertNotesToPlainText(notes, categoriesMap) {
    const textParts = [
        `FLASH NOTEPAD BACKUP - ${new Date().toISOString()}\n`,
        `VERSION: 1.0\n`,
        `NOTES: ${notes.length}\n\n`
    ];

    // Define batch size for processing notes
    const BATCH_SIZE = 50;

    return new Promise((resolve) => {
        let index = 0;

        function processBatch() {
            const endIndex = Math.min(index + BATCH_SIZE, notes.length);

            for (let i = index; i < endIndex; i++) {
                const note = notes[i];

                textParts.push('--- NOTE START ---\n');
                textParts.push(`ID: ${note.id || 'unknown'}\n`);
                textParts.push(`TITLE: ${(note.title || 'Untitled Note').replace(/\n/g, ' ')}\n`);
                textParts.push(`CREATED: ${note.createdAt || new Date().toISOString()}\n`);

                if (note.categories && note.categories.length > 0) {
                    const categoryNames = note.categories.map(catId => {
                        const category = categoriesMap.get(catId);
                        // Sanitize category names to prevent parsing issues
                        return category
                            ? `${category.name.replace(/[:,]/g, '')}:${category.color}`
                            : catId;
                    });
                    textParts.push(`CATEGORIES: ${categoryNames.join(', ')}\n`);
                } else {
                    textParts.push('CATEGORIES: \n');
                }

                textParts.push('CONTENT:\n');
                textParts.push(`${note.content || ''}\n`);
                textParts.push('--- NOTE END ---\n\n');
            }

            index = endIndex;

            if (index < notes.length) {
                // Schedule next batch with setTimeout to prevent UI freezing
                setTimeout(processBatch, 0);
            } else {
                // All done
                resolve(textParts.join(''));
            }
        }

        processBatch();
    });
}

/**
 * Parse plain text notes back into note objects
 * 
 * @param {string} content Plain text content
 * @param {Array} existingCategories Array of category objects for resolving by name
 * @returns {Object} Object containing parsed notes and new categories to create
 */
export function parseTextNotes(content, existingCategories) {
    const notes = [];
    const categoryCache = {}; // For tracking categories during import
    const newCategories = []; // Track new categories that need to be created

    try {
        // Extract version information if available
        const versionMatch = content.match(/VERSION: ([\d\.]+)/);
        const version = versionMatch ? versionMatch[1] : '1.0';

        // Split into note blocks, handling malformed content gracefully
        const noteBlocks = content.split('--- NOTE START ---');
        if (noteBlocks.length <= 1) {
            throw new Error('No valid notes found in the imported file');
        }

        // Helper function to find or create a category
        const findOrCreateCategory = (name, color = '#4285F4') => {
            if (!name || name.trim() === '') return null;

            const trimmedName = name.trim();

            // First check cache
            if (categoryCache[trimmedName]) return categoryCache[trimmedName].id;

            // Then check existing categories (case insensitive)
            const existingCat = existingCategories.find(
                c => c.name.toLowerCase() === trimmedName.toLowerCase()
            );

            if (existingCat) {
                categoryCache[trimmedName] = { id: existingCat.id, isNew: false };
                return existingCat.id;
            }

            // Not found - create a new temporary category entry
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const newCategory = {
                tempId: tempId,
                name: trimmedName,
                color: color
            };

            newCategories.push(newCategory);
            categoryCache[trimmedName] = { id: tempId, isNew: true };
            return tempId;
        };

        // Process each note block
        for (let i = 1; i < noteBlocks.length; i++) {
            let block = noteBlocks[i];
            const endMatch = block.match(/--- NOTE END ---/);

            if (endMatch) {
                block = block.substring(0, endMatch.index);
            }

            // Parse note properties
            const idMatch = block.match(/ID: (.+)/);
            const titleMatch = block.match(/TITLE: (.+)/);
            const createdMatch = block.match(/CREATED: (.+)/);
            const categoriesMatch = block.match(/CATEGORIES: (.+)/);
            const contentMatch = block.match(/CONTENT:\s([\s\S]*?)(?=--- NOTE END|$)/);

            if (titleMatch || contentMatch) { // Allow partial data if at least title or content exists
                const parsedCategories = [];

                // Parse categories if they exist
                if (categoriesMatch && categoriesMatch[1].trim()) {
                    const categoryStrings = categoriesMatch[1].split(',').map(c => c.trim());

                    categoryStrings.forEach(catStr => {
                        // Check if category has color information
                        if (catStr.includes(':')) {
                            const [name, color] = catStr.split(':');
                            if (name) {
                                const categoryId = findOrCreateCategory(name, color);
                                if (categoryId) {
                                    parsedCategories.push(categoryId);
                                }
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
                    id: idMatch && idMatch[1].trim() ? idMatch[1].trim() : Date.now().toString(),
                    title: titleMatch && titleMatch[1].trim() ? titleMatch[1].trim() : 'Imported Note',
                    content: contentMatch && contentMatch[1] ? contentMatch[1].trim() : '',
                    createdAt: createdMatch && createdMatch[1].trim()
                        ? createdMatch[1].trim()
                        : new Date().toISOString(),
                    categories: parsedCategories
                });
            }
        }
    } catch (error) {
        console.error('Error parsing text notes:', error);
        // Return any successfully parsed notes rather than failing completely
    }

    return { notes, newCategories };
}