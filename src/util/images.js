const DEFAULT_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

function buildImagePattern(extensions) {
  const ext = extensions.join('|');
  return new RegExp(`(?:^|\\s)(https?:\\/\\/\\S+\\.(?:${ext})(?:\\?\\S*)?)(?:\\s|$)`, 'i');
}

export function extractImage(description, config) {
  if (!description) return { image: null, description };
  const extensions = (config && config.imageExtensions) || DEFAULT_IMAGE_EXTENSIONS;
  const pattern = buildImagePattern(extensions);
  const match = description.match(pattern);
  if (!match) return { image: null, description };
  const image = match[1];
  const cleaned = description.replace(match[0], ' ').trim();
  return { image, description: cleaned };
}
