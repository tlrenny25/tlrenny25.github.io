// Upload.IT - File Upload Management System
// Main JavaScript functionality

// ============================================================================
// FILE ID GENERATION SYSTEM
// ============================================================================

/**
 * Convert a number to the custom alphanumeric format (0-9 then A-Z, cycling)
 * @param {number} num - The number to convert
 * @returns {string} - The converted character
 */
function numberToChar(num) {
    num = num % 36;
    if (num < 10) {
        return String.fromCharCode(48 + num); // 0-9
    } else {
        return String.fromCharCode(65 + num - 10); // A-Z
    }
}

/**
 * Generate a 6-character file ID based on file count
 * Format: 000000 -> 000009 -> 00000A -> ... -> YYYYYY -> then 7 characters if needed
 * @param {number} fileCount - The current file count
 * @returns {string} - The generated 6-character ID
 */
function generateFileID(fileCount) {
    let id = '';
    let num = fileCount;
    
    // Generate up to 6 characters (or more if needed)
    const maxChars = Math.max(6, Math.ceil(Math.log(fileCount + 1) / Math.log(36)));
    
    for (let i = 0; i < maxChars; i++) {
        id = numberToChar(num) + id;
        num = Math.floor(num / 36);
        if (num === 0) break;
    }
    
    // Pad with leading character (0 for first positions)
    while (id.length < 6) {
        id = '0' + id;
    }
    
    return id;
}

/**
 * Get the next file ID
 * @returns {string} - The next 6+ character file ID
 */
function getNextFileID() {
    let files = JSON.parse(localStorage.getItem('uploadedFiles')) || [];
    return generateFileID(files.length);
}

// ============================================================================
// FILE MANAGEMENT
// ============================================================================

const ALLOWED_EXTENSIONS = ['exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'vbs', 'js', 'jar', 'zip', 'rar'];
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB
const BASE_URL = 'https://tlrenny25.github.io/upload-it/';

/**
 * Initialize Upload.IT on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeUploadForm();
    displayUploadedFiles();
    setupDragAndDrop();
});

/**
 * Initialize the upload form
 */
function initializeUploadForm() {
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', handleFileUpload);
    }
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }
}

/**
 * Setup drag and drop functionality
 */
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        dropZone.classList.add('highlight');
    }
    
    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
}

/**
 * Handle dropped files
 */
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    document.getElementById('fileInput').files = files;
    handleFileSelection({target: {files: files}});
}

/**
 * Handle file selection from input
 */
function handleFileSelection(e) {
    const files = e.target.files;
    const fileInfo = document.getElementById('fileInfo');
    
    if (files.length === 0) {
        fileInfo.innerHTML = '';
        return;
    }
    
    let html = '<div class="file-preview">';
    for (let file of files) {
        const validation = validateFile(file);
        const statusClass = validation.valid ? 'valid' : 'invalid';
        const icon = getFileIcon(file.type);
        html += `
            <div class="file-item ${statusClass}">
                <span class="file-icon">${icon}</span>
                <div class="file-details">
                    <div class="file-name">${escapeHtml(file.name)}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
                <div class="file-status">
                    ${validation.valid ? 
                        '<span class="status-badge success">✓ Ready</span>' : 
                        `<span class="status-badge error">✗ ${validation.error}</span>`
                    }
                </div>
            </div>
        `;
    }
    html += '</div>';
    fileInfo.innerHTML = html;
}

/**
 * Validate file before upload
 */
function validateFile(file) {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File exceeds 1 GB limit (${formatFileSize(file.size)})`
        };
    }
    
    // Check file extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(extension)) {
        return {
            valid: false,
            error: `${extension.toUpperCase()} files not allowed`
        };
    }
    
    return { valid: true };
}

/**
 * Handle file upload
 */
function handleFileUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    const description = document.getElementById('fileDescription').value;
    
    if (files.length === 0) {
        showMessage('Please select a file to upload', 'error');
        return;
    }
    
    const file = files[0];
    const validation = validateFile(file);
    
    if (!validation.valid) {
        showMessage(validation.error, 'error');
        return;
    }
    
    // Check NSFW warning acceptance
    const nsfwAccepted = document.getElementById('nsfwWarning').checked;
    if (!nsfwAccepted) {
        showMessage('You must agree that you will not upload NSFW content', 'error');
        return;
    }
    
    // Generate file ID and create new name
    const fileID = getNextFileID();
    const extension = file.name.split('.').pop();
    const newFileName = `${fileID}.${extension}`;
    
    // Create file object
    const fileObject = {
        id: fileID,
        originalName: file.name,
        newName: newFileName,
        size: file.size,
        type: file.type,
        description: description,
        uploadTime: new Date().toISOString(),
        downloadLink: `${BASE_URL}uploads/${newFileName}`
    };
    
    // Store file (in real app, would upload to server)
    let uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || [];
    uploadedFiles.push(fileObject);
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
    
    // Simulate file storage
    localStorage.setItem(`file_${fileID}`, JSON.stringify(fileObject));
    
    showMessage(`File uploaded successfully! ID: ${fileID}`, 'success');
    
    // Reset form
    fileInput.value = '';
    document.getElementById('fileDescription').value = '';
    document.getElementById('fileInfo').innerHTML = '';
    document.getElementById('nsfwWarning').checked = false;
    
    // Refresh file list
    displayUploadedFiles();
}

/**
 * Display uploaded files
 */
function displayUploadedFiles() {
    const filesList = document.getElementById('uploadedFilesList');
    if (!filesList) return;
    
    let uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || [];
    
    if (uploadedFiles.length === 0) {
        filesList.innerHTML = '<div class="empty-state">No files uploaded yet</div>';
        return;
    }
    
    let html = '<div class="files-container">';
    
    uploadedFiles.forEach((file, index) => {
        const icon = getFileIcon(file.type);
        const uploadDate = new Date(file.uploadTime).toLocaleString();
        
        html += `
            <div class="file-card">
                <div class="file-card-header">
                    <span class="file-icon">${icon}</span>
                    <div class="file-id-badge">${file.id}</div>
                </div>
                <div class="file-card-content">
                    <div class="file-name" title="${escapeHtml(file.originalName)}">
                        ${escapeHtml(file.originalName)}
                    </div>
                    <div class="file-meta">
                        <span>${formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>${uploadDate}</span>
                    </div>
                    ${file.description ? `<div class="file-description">${escapeHtml(file.description)}</div>` : ''}
                </div>
                <div class="file-card-actions">
                    <div class="copy-link-container">
                        <input type="text" class="link-input" value="${file.downloadLink}" readonly>
                        <button class="btn-copy" onclick="copyToClipboard('${file.downloadLink}', this)">
                            📋 Copy Link
                        </button>
                    </div>
                    <button class="btn-delete" onclick="deleteFile(${index})">🗑️ Delete</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    filesList.innerHTML = html;
}

/**
 * Copy download link to clipboard
 */
function copyToClipboard(link, button) {
    navigator.clipboard.writeText(link).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        showMessage('Failed to copy link', 'error');
    });
}

/**
 * Delete uploaded file
 */
function deleteFile(index) {
    if (confirm('Are you sure you want to delete this file?')) {
        let uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || [];
        const fileID = uploadedFiles[index].id;
        
        uploadedFiles.splice(index, 1);
        localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
        localStorage.removeItem(`file_${fileID}`);
        
        showMessage('File deleted successfully', 'success');
        displayUploadedFiles();
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file icon based on type
 */
function getFileIcon(fileType) {
    if (!fileType) return '';
    
    if (fileType.includes('image')) return '';
    if (fileType.includes('video')) return '';
    if (fileType.includes('audio')) return '';
    if (fileType.includes('pdf')) return '';
    if (fileType.includes('text')) return '';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '';
    if (fileType.includes('word')) return '';
    if (fileType.includes('sheet')) return '';
    if (fileType.includes('presentation')) return '';
    
    return '';
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Show status message
 */
function showMessage(message, type) {
    const messageContainer = document.getElementById('message');
    if (!messageContainer) return;
    
    messageContainer.textContent = message;
    messageContainer.className = `message message-${type}`;
    messageContainer.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 4000);
    }
}
