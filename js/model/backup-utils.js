// js/model/backup-utils.js
/**
 * @file js/model/backup-utils.js
 * @description Utilities for export and import of notes
 * 
 * Provides functions to prepare notes data for JSON export and to validate
 * imported JSON data. Handles proper formatting of metadata and validation
 * of imported backup structure.
 */

/**
 * Prepares notes and categories data for JSON export
 * 
 * @param {Array} notes Array of note objects
 * @param {Map} categoriesMap Map of categories for lookup
 * @returns {Object} Structured data ready for JSON stringification
 */
export function prepareExportData(notes, categoriesMap) {
    // Convert categories map to array
    const categories = Array.from(categoriesMap.values());

    return {
        metadata: {
            version: '1.0',
            exportDate: new Date().toISOString(),
            totalNotes: notes.length,
            totalCategories: categories.length
        },
        categories: categories,
        notes: notes
    };
}

/**
 * Validates imported JSON data structure
 * 
 * @param {Object} data Parsed JSON data
 * @returns {Object} Validation result with status and message
 */
export function validateImportData(data) {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
        return {
            valid: false,
            message: 'Invalid import data: not a JSON object'
        };
    }

    // Check for notes array
    if (!data.notes || !Array.isArray(data.notes)) {
        return {
            valid: false,
            message: 'Invalid import data: missing notes array'
        };
    }

    // Check if notes have the required properties
    for (const note of data.notes) {
        if (!note.id || !note.title) {
            return {
                valid: false,
                message: 'Invalid note data: notes must have id and title properties'
            };
        }
    }

    // If categories are included, validate them
    if (data.categories) {
        if (!Array.isArray(data.categories)) {
            return {
                valid: false,
                message: 'Invalid import data: categories must be an array'
            };
        }

        for (const category of data.categories) {
            if (!category.id || !category.name || !category.color) {
                return {
                    valid: false,
                    message: 'Invalid category data: categories must have id, name, and color properties'
                };
            }
        }
    }

    return {
        valid: true,
        message: 'Import data validation successful',
        noteCount: data.notes.length,
        categoryCount: data.categories ? data.categories.length : 0
    };
}