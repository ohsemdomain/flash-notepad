// js/view/modal-view.js
/**
 * @file js/view/modal-view.js
 * @description Modal dialog management
 * 
 * Handles the display and interaction with modal dialogs for confirmations,
 * alerts, and form inputs. Includes animation and keyboard navigation support.
 */

class ModalView {
    constructor() {
        // Reference to DOM elements
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalContainer = this.modalOverlay.querySelector('.modal-container');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.confirmBtn = document.getElementById('modal-confirm-btn');
        this.cancelBtn = document.getElementById('modal-cancel-btn');
    }

    showModal(title, message, onConfirm, confirmButtonText = 'Confirm') {
        // Set content
        this.modalTitle.textContent = title || 'Confirm Action';
        this.modalMessage.textContent = message || 'Are you sure you want to proceed?';
        
        // Set the confirm button text - this is the new line
        this.confirmBtn.textContent = confirmButtonText;

        // Show modal with animation
        this.modalOverlay.classList.remove('hidden');

        // Add entrance animation
        this.modalContainer.style.transform = 'translateY(20px)';
        setTimeout(() => {
            this.modalContainer.style.transform = 'translateY(0)';
        }, 10);

        // Setup event listeners
        const handleConfirm = () => {
            this.hideModal();
            onConfirm();
            this.confirmBtn.removeEventListener('click', handleConfirm);
            this.cancelBtn.removeEventListener('click', handleCancel);
        };

        const handleCancel = () => {
            this.hideModal();
            this.confirmBtn.removeEventListener('click', handleConfirm);
            this.cancelBtn.removeEventListener('click', handleCancel);
        };

        // Clear any existing event listeners
        this.confirmBtn.replaceWith(this.confirmBtn.cloneNode(true));
        this.cancelBtn.replaceWith(this.cancelBtn.cloneNode(true));

        // Get the new button references
        this.confirmBtn = document.getElementById('modal-confirm-btn');
        this.cancelBtn = document.getElementById('modal-cancel-btn');

        // Add new event listeners
        this.confirmBtn.addEventListener('click', handleConfirm);
        this.cancelBtn.addEventListener('click', handleCancel);

        // Close on ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    hideModal() {
        // Add exit animation
        this.modalContainer.style.transform = 'translateY(20px)';

        // Wait for animation before hiding
        setTimeout(() => {
            this.modalOverlay.classList.add('hidden');
            this.modalContainer.style.transform = 'translateY(0)';
        }, 200);
    }
}

export default ModalView;