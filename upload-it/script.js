// ==================== Global Configuration ====================
const CONFIG = {
    MAX_FILE_SIZE: 1 * 1024 * 1024 * 1024, // 1 GB in bytes
    BLOCKED_EXTENSIONS: ['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.vbs', '.js', '.jar', '.app', '.dll', '.sys'],
    STORAGE_KEY: 'uploadedFiles',
    TEMP_STORAGE_KEY: 'tempFiles',
};

// ==================== Initialize on Page Load ====================
document.addEventListener('DOMContentLoaded', function() {
    // Setup regular upload form
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        setupRegularUpload();
    }

    // Setup temporary storage form
    const tempForm = document.getElementById('tempUploadForm');
    if (tempForm) {
        setupTemporaryStorage();
    }

    // Display existing files on load
    displayUploadedFiles();
    displayTemporaryFiles();
});

// ==================== Regular Upload Setup ====================
function setupRegularUpload() {
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileName');

    // File input change event
    fileInput.addEventListener('change', function(e) {
        displayFileName(e.target.files[0], fileNameDisplay);
    });

    // Drag and drop
    setupDragAndDrop(document.querySelector('.file-input-wrapper'), fileInput);

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFileUpload();
    });
}

// ==================== Temporary Storage Setup ====================
function setupTemporaryStorage() {
    const form = document.getElementById('tempUploadForm');
    const fileInput = document.getElementById('tempFileInput');
    const fileNameDisplay = document.getElementById('tempFileName');

    // File input change event
    fileInput.addEventListener('change', function(e) {
        displayFileName(e.target.files[0], fileNameDisplay);
    });

    // Drag and drop
    setupDragAndDrop(document.querySelector('.file-input-wrapper'), fileInput);

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleTemporaryUpload();
    });

    // Update display every second for countdown
    setInterval(displayTemporaryFiles, 1000);

    // Clean up expired files every 30 seconds
    setInterval(cleanupExpiredFiles, 30000);
}

// ==================== Drag and Drop Setup ====================
function setupDragAndDrop(dropZone, fileInput) {
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
        dropZone.style.borderColor = '#764ba2';
        dropZone.style.backgroundColor = 'rgba(118, 75, 162, 0.2)';
    }

    function unhighlight(e) {
        dropZone.style.borderColor = '#667eea';
        dropZone.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
    }

    dropZone.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;

        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
    }, false);
}

// ==================== File Name Display ====================
function displayFileName(file, displayElement) {
    if (!file || !displayElement) return;

    const fileName = file.name;
    const fileSize = formatFileSize(file.size);
    displayElement.textContent = `📄 ${fileName} (${fileSize})`;
}

// ==================== File Validation ====================
function validateFile(file) {
    const errors = [];

    // Check if file exists
    if (!file) {
        errors.push('No file selected');
        return errors;
    }

    // Check file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        errors.push(`File size exceeds 1 GB limit. Your file is ${formatFileSize(file.size)}`);
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (CONFIG.BLOCKED_EXTENSIONS.includes(fileExtension)) {
        errors.push(`File type "${fileExtension}" is not allowed (executable files blocked)`);
    }

    return errors;
}

// ==================== Regular File Upload Handler ====================
function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const descriptionInput = document.getElementById('fileDescription');
    const file = fileInput.files[0];

    if (!file) {
        showStatus('uploadStatus', 'Please select a file', 'error');
        return;
    }

    // Validate file
    const errors = validateFile(file);
    if (errors.length > 0) {
        showStatus('uploadStatus', errors.join('\n'), 'error');
        return;
    }

    // Create file object
    const fileData = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        description: descriptionInput.value || 'No description',
        uploadedAt: new Date().toLocaleString(),
    };

    // Save to localStorage
    let uploadedFiles = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || [];
    uploadedFiles.push(fileData);
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(uploadedFiles));

    // Show success message
    showStatus('uploadStatus', `✅ File "${file.name}" uploaded successfully!`, 'success');

    // Reset form
    fileInput.value = '';
    descriptionInput.value = '';
    document.getElementById('fileName').textContent = '';

    // Display files
    displayUploadedFiles();
}

// ==================== Temporary Upload Handler ====================
function handleTemporaryUpload() {
    const fileInput = document.getElementById('tempFileInput');
    const descriptionInput = document.getElementById('tempFileDescription');
    const expirationInput = document.getElementById('expirationTime');
    const file = fileInput.files[0];

    if (!file) {
        showStatus('tempUploadStatus', 'Please select a file', 'error');
        return;
    }

    if (!expirationInput.value) {
        showStatus('tempUploadStatus', 'Please select an expiration time', 'error');
        return;
    }

    // Validate file
    const errors = validateFile(file);
    if (errors.length > 0) {
        showStatus('tempUploadStatus', errors.join('\n'), 'error');
        return;
    }

    // Calculate expiration time
    const expirationMinutes = parseInt(expirationInput.value);
    const expirationTime = new Date(Date.now() + expirationMinutes * 60000);

    // Create file object
    const fileData = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        description: descriptionInput.value || 'No description',
        uploadedAt: new Date().toLocaleString(),
        expirationTime: expirationTime.toISOString(),
        expirationMinutes: expirationMinutes,
    };

    // Save to localStorage
    let tempFiles = JSON.parse(localStorage.getItem(CONFIG.TEMP_STORAGE_KEY)) || [];
    tempFiles.push(fileData);
    localStorage.setItem(CONFIG.TEMP_STORAGE_KEY, JSON.stringify(tempFiles));

    // Show success message
    showStatus('tempUploadStatus', `✅ File "${file.name}" uploaded to temporary storage for ${expirationMinutes} minute(s)!`, 'success');

    // Reset form
    fileInput.value = '';
    descriptionInput.value = '';
    expirationInput.value = '';
    document.getElementById('tempFileName').textContent = '';

    // Display files
    displayTemporaryFiles();
}

// ==================== Display Uploaded Files ====================
function displayUploadedFiles() {
    const filesList = document.getElementById('filesList');
    const uploadedFilesList = document.getElementById('uploadedFilesList');

    if (!filesList) return;

    let uploadedFiles = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || [];

    if (uploadedFiles.length === 0) {
        uploadedFilesList.style.display = 'none';
        return;
    }

    uploadedFilesList.style.display = 'block';
    filesList.innerHTML = '';

    uploadedFiles.forEach(file => {
        const fileItem = createFileItem(file, false);
        filesList.appendChild(fileItem);
    });
}

// ==================== Display Temporary Files ====================
function displayTemporaryFiles() {
    const tempFilesContainer = document.getElementById('tempFilesContainer');
    const tempFilesList = document.getElementById('tempFilesList');
    const emptyState = document.getElementById('emptyState');

    if (!tempFilesContainer) return;

    // Clean up expired files first
    cleanupExpiredFiles();

    let tempFiles = JSON.parse(localStorage.getItem(CONFIG.TEMP_STORAGE_KEY)) || [];

    if (tempFiles.length === 0) {
        if (tempFilesList) tempFilesList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (tempFilesList) tempFilesList.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    tempFilesContainer.innerHTML = '';

    tempFiles.forEach(file => {
        const fileItem = createTemporaryFileItem(file);
        tempFilesContainer.appendChild(fileItem);
    });
}

// ==================== Create File Item (Regular) ====================
function createFileItem(file, isTemporary = false) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    const fileIcon = getFileIcon(file.type || file.name);

    fileItem.innerHTML = `
        <div class="file-item-header">
            <span class="file-icon">${fileIcon}</span>
            <div class="file-item-name">${escapeHtml(file.name)}</div>
        </div>
        <div class="file-item-info">
            <span>Size: ${formatFileSize(file.size)}</span>
            <span>Type: ${file.type || 'Unknown'}</span>
        </div>
        <div class="file-item-info">
            <span>Uploaded: ${file.uploadedAt}</span>
        </div>
        ${file.description ? `<div class="file-item-description">${escapeHtml(file.description)}</div>` : ''}
        <div class="file-item-actions">
            <button class="btn btn-secondary" onclick="downloadFile(${file.id}, ${isTemporary})">Download</button>
            <button class="btn btn-danger" onclick="deleteFile(${file.id}, ${isTemporary})">Delete</button>
        </div>
    `;

    return fileItem;
}

// ==================== Create Temporary File Item ====================
function createTemporaryFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    const fileIcon = getFileIcon(file.type || file.name);
    const expirationTime = new Date(file.expirationTime);
    const now = new Date();
    const timeRemaining = expirationTime - now;
    const isExpired = timeRemaining <= 0;

    let expirationDisplay = '';
    if (isExpired) {
        expirationDisplay = '<div class="temp-file-expiration temp-file-expired">⏰ EXPIRED</div>';
    } else {
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        expirationDisplay = `<div class="temp-file-expiration">⏰ ${minutes}:${String(seconds).padStart(2, '0')} remaining</div>`;
    }

    fileItem.innerHTML = `
        <div class="file-item-header">
            <span class="file-icon">${fileIcon}</span>
            <div class="file-item-name">${escapeHtml(file.name)}</div>
        </div>
        ${expirationDisplay}
        <div class="file-item-info">
            <span>Size: ${formatFileSize(file.size)}</span>
            <span>Type: ${file.type || 'Unknown'}</span>
        </div>
        <div class="file-item-info">
            <span>Uploaded: ${file.uploadedAt}</span>
        </div>
        ${file.description ? `<div class="file-item-description">${escapeHtml(file.description)}</div>` : ''}
        <div class="file-item-actions">
            <button class="btn btn-secondary" onclick="downloadFile(${file.id}, true)">Download</button>
            <button class="btn btn-danger" onclick="deleteFile(${file.id}, true)">Delete</button>
        </div>
    `;

    return fileItem;
}

// ==================== File Operations ====================
function downloadFile(fileId, isTemporary = false) {
    const storageKey = isTemporary ? CONFIG.TEMP_STORAGE_KEY : CONFIG.STORAGE_KEY;
    let files = JSON.parse(localStorage.getItem(storageKey)) || [];
    const file = files.find(f => f.id === fileId);

    if (!file) {
        alert('File not found');
        return;
    }

    // In a real implementation, this would download the actual file
    alert(`Download initiated for: ${file.name}\n\nNote: This is a demo. In a real application, the file would be downloaded.`);
}

function deleteFile(fileId, isTemporary = false) {
    const storageKey = isTemporary ? CONFIG.TEMP_STORAGE_KEY : CONFIG.STORAGE_KEY;
    let files = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
        const fileName = files[fileIndex].name;
        files.splice(fileIndex, 1);
        localStorage.setItem(storageKey, JSON.stringify(files));
        
        if (isTemporary) {
            displayTemporaryFiles();
        } else {
            displayUploadedFiles();
        }
        
        showStatus(isTemporary ? 'tempUploadStatus' : 'uploadStatus', `✅ File "${fileName}" deleted successfully`, 'success');
    }
}

function cleanupExpiredFiles() {
    let tempFiles = JSON.parse(localStorage.getItem(CONFIG.TEMP_STORAGE_KEY)) || [];
    const now = new Date();
    
    const validFiles = tempFiles.filter(file => {
        return new Date(file.expirationTime) > now;
    });
    
    if (validFiles.length !== tempFiles.length) {
        localStorage.setItem(CONFIG.TEMP_STORAGE_KEY, JSON.stringify(validFiles));
    }
}

// ==================== Utility Functions ====================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(fileNameOrType) {
    const type = fileNameOrType.toLowerCase();

    if (type.includes('image')) return '';
    if (type.includes('video')) return '';
    if (type.includes('audio')) return '';
    if (type.includes('pdf')) return '';
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('archive')) return '';
    if (type.includes('word') || type.includes('document') || type.includes('.doc')) return '';
    if (type.includes('spreadsheet') || type.includes('sheet') || type.includes('.xls')) return '';
    if (type.includes('presentation') || type.includes('powerpoint') || type.includes('.ppt')) return '';
    if (type.includes('text') || type.includes('.txt')) return '';
    if (type.includes('json') || type.includes('xml') || type.includes('code')) return '';

    return '';
}

function showStatus(elementId, message, type) {
    const statusElement = document.getElementById(elementId);
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
