import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        itemContent = itemContent.replace(/\{\{this\}\}/g, escapeHtml(String(item)));
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
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
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
    return String(dateString);
  }
}

/**
 * Load template file from frontend/src/layouts directory
 */
async function loadTemplate(templateId) {
  try {
    // Get project root (go up from backend/src/utils to project root)
    const projectRoot = path.join(__dirname, '../../../');
    const frontendLayoutsPath = path.join(projectRoot, 'frontend/src/layouts');
    const templatePath = path.join(frontendLayoutsPath, `template${templateId || 1}.html`);
    
    console.log('Loading template from:', templatePath);
    const content = await fs.readFile(templatePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error loading template ${templateId}:`, error);
    // Fallback to basic template
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
function prepareNoticeData(notice, value) {
  // Extract attached links from files array or from value
  let attachedLinks = [];
  if (notice.files && Array.isArray(notice.files)) {
    attachedLinks = notice.files
      .filter(file => file.filelocation && 
        (file.filelocation.startsWith('http') || file.filelocation.startsWith('https')))
      .map(file => file.filelocation);
  } else if (value?.AttachedLinks) {
    attachedLinks = Array.isArray(value.AttachedLinks) ? value.AttachedLinks : [];
  }

  return {
    title: value?.Title || notice.title || '',
    subtitle: value?.Subtitle || notice.subtitle || '',
    paragraph: value?.Paragraph || notice.paragraph || '',
    videoLink: value?.VideoLink || notice.videolink || '',
    audioLink: value?.AudioLink || notice.audiolink || '',
    startDate: formatDate(notice.startdate || value?.StartDate),
    endDate: formatDate(notice.enddate || value?.EndDate),
    status: (notice.status || value?.Status || '').toLowerCase(),
    whocansee: notice.whocansee || value?.WhoCanSee || '',
    attachedLinks: attachedLinks
  };
}

/**
 * Generate a safe filename from notice
 */
function generateFilename(notice) {
  const title = (notice.title || 'notice').toLowerCase();
  const noticeId = notice.noticeid || notice.NoticeID || Date.now();
  const safeTitle = title
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);
  return `notice_${noticeId}_${safeTitle}.html`;
}

/**
 * Save rendered notice to file system
 */
export async function renderAndSaveNotice(notice, value, templateId = 1) {
  try {
    // Get project root (go up from backend/src/utils to project root)
    const projectRoot = path.join(__dirname, '../../../');
    // Ensure notices_published directory exists
    const outputDir = path.join(projectRoot, 'frontend/src/notices_published');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Load template
    const template = await loadTemplate(templateId);
    
    // Prepare data
    const templateData = prepareNoticeData(notice, value);
    
    // Render template
    const renderedHtml = renderTemplate(template, templateData);
    
    // Generate filename
    const filename = generateFilename(notice);
    const filePath = path.join(outputDir, filename);
    
    // Save to file
    await fs.writeFile(filePath, renderedHtml, 'utf-8');
    
    console.log(`Notice rendered and saved to: ${filePath}`);
    
    return {
      success: true,
      filename,
      filePath,
      content: renderedHtml
    };
  } catch (error) {
    console.error('Error rendering notice:', error);
    // Return success: false but don't throw - don't break notice creation if rendering fails
    return {
      success: false,
      error: error.message
    };
  }
}

