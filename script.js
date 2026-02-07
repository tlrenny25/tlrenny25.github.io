document.addEventListener('DOMContentLoaded', () => {
    const notepad = document.getElementById('notepad');
    const wordCount = document.getElementById('wordCount');
    const charCount = document.getElementById('charCount');
    const lineCount = document.getElementById('lineCount');
    const lastSaved = document.getElementById('lastSaved');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const fontSizeSlider = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const underlineBtn = document.getElementById('underlineBtn');

    const STORAGE_KEY = 'notepad_content';
    const DARK_MODE_KEY = 'notepad_dark_mode';

    // Load saved content
    function loadContent() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            notepad.value = saved;
            updateStats();
        }
    }

    // Save content to localStorage
    function saveContent() {
        localStorage.setItem(STORAGE_KEY, notepad.value);
        updateLastSaved();
    }

    // Update statistics
    function updateStats() {
        const text = notepad.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const lines = text ? text.split('\n').length : 1;

        wordCount.textContent = words;
        charCount.textContent = chars;
        lineCount.textContent = lines;
    }

    // Update last saved time
    function updateLastSaved() {
        const now = new Date();
        const time = now.toLocaleTimeString();
        lastSaved.textContent = time;
    }

    // Copy to clipboard
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(notepad.value).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    });

    // Download as file
    downloadBtn.addEventListener('click', () => {
        const text = notepad.value;
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', 'notepad_' + new Date().getTime() + '.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });

    // Clear all text
    clearBtn.addEventListener('click', () => {
        if (notepad.value && confirm('Are you sure you want to clear all text?')) {
            notepad.value = '';
            saveContent();
            updateStats();
        }
    });

    // Dark mode toggle
    function initDarkMode() {
        const isDarkMode = localStorage.getItem(DARK_MODE_KEY) === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️';
        }
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem(DARK_MODE_KEY, isDarkMode);
        darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    });

    // Font size adjustment
    fontSizeSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        notepad.style.fontSize = size + 'px';
        fontSizeValue.textContent = size + 'px';
    });

    // Text formatting buttons
    boldBtn.addEventListener('click', () => {
        boldBtn.classList.toggle('active');
        if (boldBtn.classList.contains('active')) {
            notepad.style.fontWeight = 'bold';
        } else {
            notepad.style.fontWeight = 'normal';
        }
    });

    italicBtn.addEventListener('click', () => {
        italicBtn.classList.toggle('active');
        if (italicBtn.classList.contains('active')) {
            notepad.style.fontStyle = 'italic';
        } else {
            notepad.style.fontStyle = 'normal';
        }
    });

    underlineBtn.addEventListener('click', () => {
        underlineBtn.classList.toggle('active');
        if (underlineBtn.classList.contains('active')) {
            notepad.style.textDecoration = 'underline';
        } else {
            notepad.style.textDecoration = 'none';
        }
    });

    // Event listeners for auto-save
    notepad.addEventListener('input', () => {
        updateStats();
        saveContent();
    });

    // Initialize
    initDarkMode();
    loadContent();
});
