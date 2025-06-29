export function splitContentIntoPages(
  content: string,
  startPageNumber: number,
  pageCount: number
): string[] {
  const pages: string[] = [];

  for (let i = 0; i < pageCount; i++) {
    const pageNumber = startPageNumber + i;
    const startMarker = `PAGE_${pageNumber}_START`;
    const endMarker = `PAGE_${pageNumber}_END`;

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      const pageContent = content.substring(startIndex + startMarker.length, endIndex).trim();

      pages.push(pageContent);
    } else {
      pages.push(`Error generating content for page ${pageNumber}.`);
    }
  }

  return pages;
}
