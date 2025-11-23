/**
 * Convert markdown text to HTML for chat messages
 * Handles common markdown patterns used in AI responses
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // Process in specific order to avoid conflicts

  // 1. Inline code (`code`) - protect from other replacements
  html = html.replace(/`([^`]+)`/g, '<code class="bg-white bg-opacity-20 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

  // 2. Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="font-semibold text-base mb-2 mt-3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="font-semibold text-lg mb-2 mt-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mb-2 mt-3">$1</h1>');

  // 3. Bold (**text**) - must come before italic to avoid conflicts
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>');

  // 4. Italic (*text*)
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/_(.+?)_/g, '<em class="italic">$1</em>');

  // 5. Bullet points
  html = html.replace(/^[•\-\*]\s+(.+)$/gm, '<li class="ml-4">$1</li>');
  
  // 6. Numbered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4">$1</li>');
  
  // 7. Wrap <li> in <ul>
  const lines = html.split('\n');
  let inList = false;
  const processed: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = line.trim().startsWith('<li');
    
    if (isListItem && !inList) {
      processed.push('<ul class="list-disc list-inside space-y-1 my-2">');
      inList = true;
    } else if (!isListItem && inList) {
      processed.push('</ul>');
      inList = false;
    }
    
    processed.push(line);
  }
  
  if (inList) {
    processed.push('</ul>');
  }
  
  html = processed.join('\n');

  // 8. Horizontal rules
  html = html.replace(/^(\-{3,}|\*{3,})$/gm, '<hr class="my-3 border-white border-opacity-30" />');

  // 9. Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">$1</a>');

  // 10. Line breaks
  html = html.replace(/\n/g, '<br />');

  return html;
}

