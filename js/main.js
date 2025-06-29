class ModernBookShelf {
    constructor() {
        this.books = [];
        this.currentEditId = null;
        this.currentDeleteId = null;
        this.searchQuery = '';
        this.isSearchActive = false;
        
        this.init();
    }

    init() {
        this.loadBooks();
        this.bindEvents();
        this.renderBooks();
        this.updateStats();
    }

    bindEvents() {
        // Form submission
        document.getElementById('bookForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBook();
        });

        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            this.clearSearch();
        });

        // Allow Enter key to trigger search
        document.getElementById('searchInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch();
            }
        });

        // Edit Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeEditModal();
            }
        });

        // Edit form submission
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedBook();
        });

        // Delete Modal events
        document.getElementById('closeDeleteModal').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.confirmDeleteBook();
        });

        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.closeDeleteModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEditModal();
                this.closeDeleteModal();
            }
        });
    }

    performSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.trim().toLowerCase();
        
        if (query === '') {
            this.clearSearch();
            return;
        }

        this.searchQuery = query;
        this.isSearchActive = true;
        this.renderBooks();
        this.showSearchResults();
        
        // Show clear button
        document.getElementById('clearSearchBtn').style.display = 'block';
        
        this.showNotification(`Searching for "${query}"`, 'info');
    }

    clearSearch() {
        this.searchQuery = '';
        this.isSearchActive = false;
        document.getElementById('searchInput').value = '';
        document.getElementById('clearSearchBtn').style.display = 'none';
        document.getElementById('searchResultsInfo').style.display = 'none';
        this.renderBooks();
        this.showNotification('Search cleared', 'info');
    }

    showSearchResults() {
        const filteredBooks = this.books.filter(book => 
            book.title.toLowerCase().includes(this.searchQuery) ||
            book.author.toLowerCase().includes(this.searchQuery)
        );

        const resultsInfo = document.getElementById('searchResultsInfo');
        const resultCount = filteredBooks.length;
        
        if (resultCount === 0) {
            resultsInfo.innerHTML = `
                No books found for "${this.searchQuery}". 
                <span class="clear-link" onclick="window.bookshelf.clearSearch()">Clear search</span>
            `;
        } else {
            resultsInfo.innerHTML = `
                Found ${resultCount} book${resultCount === 1 ? '' : 's'} matching "${this.searchQuery}". 
                <span class="clear-link" onclick="window.bookshelf.clearSearch()">Show all books</span>
            `;
        }
        
        resultsInfo.style.display = 'block';
    }

    generateId() {
        return new Date().getTime().toString();
    }

    addBook() {
        const form = document.getElementById('bookForm');
        const formData = new FormData(form);
        
        const book = {
            id: this.generateId(),
            title: formData.get('title').trim(),
            author: formData.get('author').trim(),
            year: parseInt(formData.get('year')),
            isComplete: formData.get('isComplete') === 'on'
        };

        // Validation
        if (!book.title || !book.author || !book.year) {
            alert('Please fill in all required fields.');
            return;
        }

        if (book.year < 1000 || book.year > 2100) {
            alert('Please enter a valid publication year between 1000 and 2100.');
            return;
        }

        this.books.push(book);
        this.saveBooks();
        this.renderBooks();
        this.updateStats();
        form.reset();

        // Show success feedback
        this.showNotification('Book added successfully!', 'success');
        
        // Announce to screen readers
        this.announceToScreenReader(`Book "${book.title}" by ${book.author} has been added to your ${book.isComplete ? 'completed' : 'reading'} shelf.`);
    }

    showDeleteModal(id) {
        const book = this.books.find(book => book.id === id);
        if (book) {
            this.currentDeleteId = id;
            
            // Populate modal with book information
            document.getElementById('deleteBookTitle').textContent = book.title;
            document.getElementById('deleteBookAuthor').textContent = book.author;
            document.getElementById('deleteBookYear').textContent = book.year;
            
            // Show modal
            const modal = document.getElementById('deleteModal');
            modal.style.display = 'block';
            modal.setAttribute('aria-hidden', 'false');
            
            // Focus the cancel button for accessibility
            document.getElementById('cancelDelete').focus();
        }
    }

    confirmDeleteBook() {
        if (!this.currentDeleteId) return;

        const book = this.books.find(book => book.id === this.currentDeleteId);
        if (book) {
            this.books = this.books.filter(book => book.id !== this.currentDeleteId);
            this.saveBooks();
            this.renderBooks();
            this.updateStats();
            this.closeDeleteModal();
            this.showNotification('Book deleted successfully!', 'success');
            this.announceToScreenReader(`Book "${book.title}" has been deleted.`);
        }
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        this.currentDeleteId = null;
    }

    deleteBook(id) {
        // Show delete confirmation modal instead of browser confirm
        this.showDeleteModal(id);
    }

    toggleComplete(id) {
        const book = this.books.find(book => book.id === id);
        if (book) {
            book.isComplete = !book.isComplete;
            this.saveBooks();
            this.renderBooks();
            this.updateStats();
            
            const status = book.isComplete ? 'completed' : 'moved to reading list';
            this.showNotification(`"${book.title}" ${status}!`, 'success');
            this.announceToScreenReader(`"${book.title}" has been ${status}.`);
        }
    }

    editBook(id) {
        const book = this.books.find(book => book.id === id);
        if (book) {
            this.currentEditId = id;
            document.getElementById('editTitle').value = book.title;
            document.getElementById('editAuthor').value = book.author;
            document.getElementById('editYear').value = book.year;
            
            const modal = document.getElementById('editModal');
            modal.style.display = 'block';
            modal.setAttribute('aria-hidden', 'false');
            
            // Focus the first input for accessibility
            document.getElementById('editTitle').focus();
        }
    }

    saveEditedBook() {
        if (!this.currentEditId) return;

        const form = document.getElementById('editForm');
        const formData = new FormData(form);
        
        const book = this.books.find(book => book.id === this.currentEditId);
        if (book) {
            const newTitle = formData.get('title').trim();
            const newAuthor = formData.get('author').trim();
            const newYear = parseInt(formData.get('year'));

            // Validation
            if (!newTitle || !newAuthor || !newYear) {
                alert('Please fill in all required fields.');
                return;
            }

            if (newYear < 1000 || newYear > 2100) {
                alert('Please enter a valid publication year between 1000 and 2100.');
                return;
            }

            book.title = newTitle;
            book.author = newAuthor;
            book.year = newYear;

            this.saveBooks();
            this.renderBooks();
            this.closeEditModal();
            this.showNotification('Book updated successfully!', 'success');
            this.announceToScreenReader(`Book details have been updated.`);
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        this.currentEditId = null;
    }

    createBookElement(book) {
        const bookDiv = document.createElement('article');
        bookDiv.className = 'book-item fade-in';
        bookDiv.setAttribute('data-bookid', book.id);
        bookDiv.setAttribute('data-testid', 'bookItem');
        bookDiv.setAttribute('role', 'listitem');
        bookDiv.setAttribute('aria-label', `Book: ${book.title} by ${book.author}`);

        const toggleButtonText = book.isComplete ? 'Mark as Incomplete' : 'Mark as Complete';
        
        bookDiv.innerHTML = `
            <h3 data-testid="bookItemTitle">${this.escapeHtml(book.title)}</h3>
            <p data-testid="bookItemAuthor">Author: ${this.escapeHtml(book.author)}</p>
            <p data-testid="bookItemYear">Year: ${book.year}</p>
            <div class="book-item-actions">
                
                <button data-testid="bookItemDeleteButton" class="btn btn-danger" aria-label="Delete ${book.title}">Delete Book</button>
                <button data-testid="bookItemEditButton" class="btn btn-edit" aria-label="Edit ${book.title}">Edit Book</button>
            </div>
        `;

        // Add event listeners
        const deleteBtn = bookDiv.querySelector('[data-testid="bookItemDeleteButton"]');
        const editBtn = bookDiv.querySelector('[data-testid="bookItemEditButton"]');
        const toggleBtn = bookDiv.querySelector('[data-testid="bookItemIsCompleteButton"]');

        deleteBtn.addEventListener('click', () => this.deleteBook(book.id));
        editBtn.addEventListener('click', () => this.editBook(book.id));
        toggleBtn.addEventListener('click', () => this.toggleComplete(book.id));

        return bookDiv;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderBooks() {
        const incompleteShelf = document.getElementById('incompleteShelf');
        const completedShelf = document.getElementById('completedShelf');

        // Clear shelves
        incompleteShelf.innerHTML = '';
        completedShelf.innerHTML = '';

        // Filter books based on search query if search is active
        let filteredBooks = this.books;
        if (this.isSearchActive && this.searchQuery) {
            filteredBooks = this.books.filter(book => 
                book.title.toLowerCase().includes(this.searchQuery) ||
                book.author.toLowerCase().includes(this.searchQuery)
            );
        }

        const incompleteBooks = filteredBooks.filter(book => !book.isComplete);
        const completedBooks = filteredBooks.filter(book => book.isComplete);

        // Render incomplete books
        if (incompleteBooks.length === 0) {
            const emptyMessage = this.isSearchActive ? 
                'No books to read match your search.' : 
                'No books in your reading list yet. Add some books to get started!';
            incompleteShelf.innerHTML = `<div class="empty-shelf">${emptyMessage}</div>`;
        } else {
            incompleteBooks.forEach(book => {
                incompleteShelf.appendChild(this.createBookElement(book));
            });
        }

        // Render completed books
        if (completedBooks.length === 0) {
            const emptyMessage = this.isSearchActive ? 
                'No completed books match your search.' : 
                'No completed books yet. Start reading to fill this shelf!';
            completedShelf.innerHTML = `<div class="empty-shelf">${emptyMessage}</div>`;
        } else {
            completedBooks.forEach(book => {
                completedShelf.appendChild(this.createBookElement(book));
            });
        }
    }

    updateStats() {
        const totalBooks = this.books.length;
        const incompleteBooks = this.books.filter(book => !book.isComplete).length;
        const completedBooks = this.books.filter(book => book.isComplete).length;

        document.getElementById('totalBooks').textContent = totalBooks;
        document.getElementById('incompleteBooks').textContent = incompleteBooks;
        document.getElementById('completedBooks').textContent = completedBooks;
    }

    saveBooks() {
        try {
            localStorage.setItem('modernBookshelfBooks', JSON.stringify(this.books));
        } catch (error) {
            console.error('Error saving books to localStorage:', error);
            alert('Error saving books. Please try again.');
        }
    }

    loadBooks() {
        try {
            const storedBooks = localStorage.getItem('modernBookshelfBooks');
            if (storedBooks) {
                this.books = JSON.parse(storedBooks);
                
                // Validate and clean data
                this.books = this.books.filter(book => 
                    book && 
                    typeof book.id !== 'undefined' &&
                    typeof book.title === 'string' &&
                    typeof book.author === 'string' &&
                    typeof book.year === 'number' &&
                    typeof book.isComplete === 'boolean'
                );
            }
        } catch (error) {
            console.error('Error loading books from localStorage:', error);
            this.books = [];
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'info' ? '#667eea' : '#f56565'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 2000;
            font-weight: 600;
            animation: slideInRight 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        announcement.textContent = message;
        document.body.appendChild(announcement);

        // Remove after announcement
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookshelf = new ModernBookShelf();
});
