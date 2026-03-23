const HEADING_LINE_PATTERN = /^(#{1,6}\s+.*)$/gm;
const TRAILING_ATTRIBUTE_BLOCK_PATTERN = /\s+\{([^{}]+)\}\s*$/;
const IMAGE_ATTRIBUTE_BLOCK_PATTERN = /(!\[[^\]]*]\([^)]+\))\{([\s\S]*?)\}/g;
const STANDALONE_ATTRIBUTE_LINE_PATTERN = /^[ \t]*\{[#.][^{}]+\}[ \t]*\n?/gm;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const INLINE_SPAN_ATTRIBUTE_PATTERN = /\[([^\]]+)\]\{[^{}]+\}/g;
const EMPTY_INLINE_ANCHOR_PATTERN = /\[\]\{[^{}]*#(?:_Toc|_Ref)[^{}]*\s+\.anchor[^{}]*\}/g;
const IMAGE_PATTERN = /!\[[^\]]*]\([^)]+\)/g;
const DOCX_PAGE_NUMBER_LINK_PATTERN = /[ \t]*\[(\d+)\]\((#(?:_Toc|_Ref)[^)]+)\)/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]\n]+)\]\(([^)\n]+)\)/g;
const DANGLING_DOCX_ANCHOR_LINK_PATTERN = /\]\(#(?:_Toc|_Ref)[^)]+\)/g;

export function sanitizeDocxMarkdownForAi(markdown: string): string {
  const withoutHeadingAttributes = markdown.replace(HEADING_LINE_PATTERN, (line) => stripTrailingAttributeBlock(line));
  const withoutInlineAnchors = withoutHeadingAttributes.replace(EMPTY_INLINE_ANCHOR_PATTERN, "");
  const withoutImageAttributes = withoutInlineAnchors.replace(IMAGE_ATTRIBUTE_BLOCK_PATTERN, "$1");
  const withoutImages = withoutImageAttributes.replace(IMAGE_PATTERN, "");
  const withoutStandaloneAttributes = withoutImages.replace(STANDALONE_ATTRIBUTE_LINE_PATTERN, "");
  const withoutComments = withoutStandaloneAttributes.replace(HTML_COMMENT_PATTERN, "");
  const withoutInlineSpanAttributes = withoutComments.replace(INLINE_SPAN_ATTRIBUTE_PATTERN, "$1");
  const withoutDocxPageNumberLinks = withoutInlineSpanAttributes.replace(DOCX_PAGE_NUMBER_LINK_PATTERN, "");
  const withoutMarkdownLinks = withoutDocxPageNumberLinks.replace(MARKDOWN_LINK_PATTERN, "$1");
  const withoutDanglingDocxAnchorLinks = withoutMarkdownLinks.replace(DANGLING_DOCX_ANCHOR_LINK_PATTERN, "");
  const withoutDanglingSpaces = withoutDanglingDocxAnchorLinks
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ");

  return collapseExcessiveBlankLines(withoutDanglingSpaces);
}

function stripTrailingAttributeBlock(line: string): string {
  const match = line.match(TRAILING_ATTRIBUTE_BLOCK_PATTERN);

  if (!match) {
    return line;
  }

  return line.slice(0, match.index).trimEnd();
}

function collapseExcessiveBlankLines(markdown: string): string {
  const normalized = markdown.replace(/\n{3,}/g, "\n\n").trimEnd();
  return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
}
