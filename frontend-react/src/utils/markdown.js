export function markdownToHtml(text) {
    if (!text) return '';
    
    // Escape HTML first for security
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Split into lines for better processing
    let lines = html.split('\n');
    let result = [];
    let inList = false;
    let listType = null;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let processedLine = line;
        
        // Headers
        if (line.match(/^### /)) {
            if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
            processedLine = '<h3>' + line.replace(/^### /, '') + '</h3>';
        } else if (line.match(/^## /)) {
            if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
            processedLine = '<h2>' + line.replace(/^## /, '') + '</h2>';
        } else if (line.match(/^# /)) {
            if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
            processedLine = '<h1>' + line.replace(/^# /, '') + '</h1>';
        }
        // Unordered lists
        else if (line.match(/^\s*[-*•]\s+/)) {
            let content = line.replace(/^\s*[-*•]\s+/, '');
            if (!inList || listType !== 'ul') {
                if (inList) result.push('</ol>');
                result.push('<ul>');
                inList = true;
                listType = 'ul';
            }
            processedLine = '<li>' + content + '</li>';
        }
        // Ordered lists
        else if (line.match(/^\s*\d+\.\s+/)) {
            let content = line.replace(/^\s*\d+\.\s+/, '');
            if (!inList || listType !== 'ol') {
                if (inList) result.push('</ul>');
                result.push('<ol>');
                inList = true;
                listType = 'ol';
            }
            processedLine = '<li>' + content + '</li>';
        }
        // Empty line - close list and add paragraph break
        else if (line.trim() === '') {
            if (inList) {
                result.push(listType === 'ul' ? '</ul>' : '</ol>');
                inList = false;
                listType = null;
            }
            processedLine = '</p><p>';
        }
        // Regular text
        else {
            if (inList) {
                result.push(listType === 'ul' ? '</ul>' : '</ol>');
                inList = false;
                listType = null;
            }
            processedLine = line;
        }
        
        result.push(processedLine);
    }
    
    // Close any open lists
    if (inList) {
        result.push(listType === 'ul' ? '</ul>' : '</ol>');
    }
    
    html = result.join('\n');
    
    // Code blocks (```code```)
    html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold (**text** or __text__)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic (*text* or _text_) - but not list markers
    html = html.replace(/(?<![\*-])\*([^*]+?)\*/g, '<em>$1</em>');
    html = html.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>');
    
    // Clean up multiple paragraph tags
    html = html.replace(/<\/p>\s*<p>/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if needed
    if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<pre')) {
        html = '<p>' + html + '</p>';
    }
    
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>(\s*<br>\s*)+<\/p>/g, '');
    
    return html;
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
