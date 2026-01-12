/**
 * Notice Renderer Utility
 * Renders notices using HTML templates and saves them as static HTML files
 */

/**
 * Simple template engine to replace placeholders in HTML
 */
function renderTemplate(template, data) {
  let rendered = template;
  
  // Replace simple variables {{variable}}
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    if (typeof data[key] === 'string') {
      rendered = rendered.replace(regex, escapeHtml(data[key]));
    } else if (data[key] !== null && data[key] !== undefined) {
      rendered = rendered.replace(regex, String(data[key]));
    } else {
      rendered = rendered.replace(regex, '');
    }
  });

  // Handle {{#if variable}} ... {{/if}} blocks
  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  rendered = rendered.replace(ifRegex, (match, variable, content) => {
    if (data[variable]) {
      return content;
    }
    return '';
  });

  // Handle {{#each array}} ... {{/each}} blocks
  const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  rendered = rendered.replace(eachRegex, (match, arrayName, content) => {
    if (Array.isArray(data[arrayName])) {
      return data[arrayName].map(item => {
        let itemContent = content;
        // Replace {{this}} with the item
        itemContent = itemContent.replace(/\{\{this\}\}/g, escapeHtml(item));
        return itemContent;
      }).join('');
    }
    return '';
  });

  return rendered;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateString;
  }
}

/**
 * Load a template file
 */
async function loadTemplate(templateId) {
  try {
    const response = await fetch(`/src/layouts/template${templateId || 1}.html`);
    if (!response.ok) {
      throw new Error(`Failed to load template ${templateId}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading template:', error);
    // Fallback to a basic template
    return getFallbackTemplate();
  }
}

/**
 * Fallback template if template file can't be loaded
 */
function getFallbackTemplate() {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { color: #333; }
        .meta { color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>{{title}}</h1>
    {{#if subtitle}}<h2>{{subtitle}}</h2>{{/if}}
    {{#if paragraph}}<p>{{paragraph}}</p>{{/if}}
    <div class="meta">
        <p>Start: {{startDate}} | End: {{endDate}} | Status: {{status}}</p>
    </div>
</body>
</html>`;
}

/**
 * Prepare notice data for template rendering
 */
function prepareNoticeData(notice) {
  return {
    title: notice.title || notice.Title || '',
    subtitle: notice.subtitle || notice.Subtitle || '',
    paragraph: notice.paragraph || notice.Paragraph || '',
    videoLink: notice.videoLink || notice.VideoLink || '',
    audioLink: notice.audioLink || notice.AudioLink || '',
    startDate: formatDate(notice.startdate || notice.StartDate || notice.startDate),
    endDate: formatDate(notice.enddate || notice.EndDate || notice.endDate),
    status: (notice.status || notice.Status || '').toLowerCase(),
    whocansee: notice.whocansee || notice.WhoCanSee || notice.whoCanSee || '',
    attachedLinks: notice.files 
      ? notice.files
          .filter(file => file.filelocation && file.filelocation.startsWith('http'))
          .map(file => file.filelocation)
      : (notice.AttachedLinks || [])
  };
}

/**
 * Generate a safe filename from notice title
 */
function generateFilename(notice) {
  const title = (notice.title || notice.Title || 'notice').toLowerCase();
  const noticeId = notice.noticeid || notice.NoticeID || notice.id || Date.now();
  const safeTitle = title
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);
  return `notice_${noticeId}_${safeTitle}.html`;
}

/**
 * Save rendered notice to local storage (for browser environment)
 * In a production environment, this would typically be done on the server
 */
function saveNoticeToLocalStorage(filename, content) {
  try {
    // Store in localStorage for now (browser limitation)
    const key = `notice_${filename}`;
    localStorage.setItem(key, content);
    
    // Try to trigger download as well
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`Notice saved: ${filename}`);
    return true;
  } catch (error) {
    console.error('Error saving notice:', error);
    return false;
  }
}

/**
 * Main function to render and save a notice
 */
export async function renderAndSaveNotice(notice, templateId = 1) {
  try {
    console.log('Rendering notice with template', templateId, notice);
    
    // Load template
    const template = await loadTemplate(templateId);
    
    // Prepare data
    const templateData = prepareNoticeData(notice);
    
    // Render template
    const renderedHtml = renderTemplate(template, templateData);
    
    // Generate filename
    const filename = generateFilename(notice);
    
    // Save (in browser environment, we'll use localStorage and download)
    const saved = saveNoticeToLocalStorage(filename, renderedHtml);
    
    // Also try to send to backend to save to file system
    try {
      await fetch('/api/notices/save-rendered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          content: renderedHtml,
          noticeId: notice.noticeid || notice.NoticeID || notice.id
        })
      });
    } catch (error) {
      console.warn('Could not save to server:', error);
    }
    
    return {
      success: true,
      filename,
      content: renderedHtml
    };
  } catch (error) {
    console.error('Error rendering notice:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get list of available templates
 */
export function getAvailableTemplates() {
  return [
    { id: 1, name: 'Modern Gradient', description: 'Colorful gradient header with modern design' },
    { id: 2, name: 'Classic Red Border', description: 'Elegant serif font with red accent border' },
    { id: 3, name: 'Two Column Layout', description: 'Sidebar with notice information' }
  ];
}

