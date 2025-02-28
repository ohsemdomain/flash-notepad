// File: js/app.js - Application entry point

import NotesModel from './model.js';
import NotesView from './view.js';
import NotesController from './controller.js';
import CategoriesManager from './categories.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const model = new NotesModel();
    const view = new NotesView();
    const controller = new NotesController(model, view);
});