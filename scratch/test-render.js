const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function renderMarkdownToHtml(md) {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers (smaller and more elegant)
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-display-sm font-display font-bold text-ink uppercase tracking-wider mb-6 border-b border-border/30 pb-4">$1</h1>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-body-lg font-bold text-ink uppercase tracking-wider mt-8 mb-3">$1</h2>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-body-sm font-semibold text-accent uppercase tracking-wider mt-6 mb-2">$1</h3>');

  // Bullet Lists
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="ml-6 list-disc mb-2 text-ink-subtle">$1</li>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code class="bg-bg-subtle px-1.5 py-0.5 rounded text-sm font-mono border border-border/50 text-ink">$1</code>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-accent hover:text-accent-hover underline">$1</a>');

  // Split into blocks by double newlines for paragraphs
  const blocks = html.split(/\n\n+/);
  html = blocks
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      
      // If it contains structural elements, output directly
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li")) {
        return trimmed;
      }
      
      // Treat as paragraph
      const formatted = trimmed.replace(/\n/g, "<br />");
      return `<p class="text-body-md text-ink-subtle mb-6 leading-relaxed">${formatted}</p>`;
    })
    .join("\n");

  return html;
}

async function main() {
  const pages = await prisma.pageTranslation.findMany();
  console.log(`Found ${pages.length} translations in DB.`);

  let errorCount = 0;
  for (const page of pages) {
    const rendered = renderMarkdownToHtml(page.content);
    
    // Check if double asterisks remain
    if (rendered.includes('**')) {
      console.log(`[FAIL] ${page.locale} - ${page.slug} has double asterisks:`);
      const lines = rendered.split('\n');
      for (const line of lines) {
        if (line.includes('**')) {
          console.log(`  -> ${line}`);
        }
      }
      errorCount++;
    }

    // Check if unparsed square brackets (links) remain
    if (/\[.*?\]\(.*?\)/.test(rendered)) {
      console.log(`[FAIL] ${page.locale} - ${page.slug} has unparsed link format:`);
      const lines = rendered.split('\n');
      for (const line of lines) {
        if (/\[.*?\]\(.*?\)/.test(line)) {
          console.log(`  -> ${line}`);
        }
      }
      errorCount++;
    }
  }

  if (errorCount === 0) {
    console.log("[SUCCESS] All database pages rendered with zero raw markdown symbols remaining!");
  } else {
    console.log(`[DONE] Finished with ${errorCount} rendering issues.`);
  }
}

main().finally(() => prisma.$disconnect());
