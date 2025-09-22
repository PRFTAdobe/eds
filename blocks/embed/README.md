# Embed Block

A flexible embed block for Edge Delivery Services that supports embedding third-party content via URLs, HTML, or pre-configured embeddables. This block is converted from the AEM Core WCM Components Embed v2.

## Features

- **URL Embeds**: Automatically detects and embeds content from popular platforms
- **HTML Embeds**: Safely embeds custom HTML content with sanitization
- **Pre-configured Embeddables**: Support for common embed types with custom parameters
- **Responsive Design**: All embeds are mobile-friendly
- **Privacy-conscious**: Supports privacy-friendly embed options
- **Accessible**: Proper ARIA labels and keyboard navigation

## Supported Platforms

### Auto-detected from URLs:
- YouTube (youtube.com, youtu.be)
- Twitter/X (twitter.com, x.com)
- Instagram (instagram.com)
- Generic URLs (rendered as iframes)

### Extensible for:
- Pinterest
- SoundCloud
- Facebook
- TikTok
- And more...

## Usage

### Basic URL Embed
```
| Embed |
|-------|
| https://www.youtube.com/watch?v=dQw4w9WgXcQ |
```

### URL Embed with Type
```
| Embed |
|-------|
| type: url |
| https://twitter.com/Adobe/status/1234567890 |
```

### HTML Embed
```
| Embed |
|-------|
| type: html |
| <iframe src="https://example.com/widget" width="600" height="400"></iframe> |
```

### Pre-configured YouTube Embed
```
| Embed |
|-------|
| type: youtube |
| dQw4w9WgXcQ |
| width: 560 |
| height: 315 |
| title: Example Video |
```

### Block Variants

Add variants by using hyphenated block names:

- `embed-wide` - Full width embed
- `embed-narrow` - Constrained width (max 600px)
- `embed-left` - Float left with text wrap
- `embed-right` - Float right with text wrap

Example:
```
| Embed (wide) |
|--------------|
| https://www.youtube.com/watch?v=dQw4w9WgXcQ |
```

## Security

The embed block includes several security measures:

1. **HTML Sanitization**: Removes dangerous tags and attributes
2. **URL Validation**: Checks URLs before embedding
3. **Iframe Sandboxing**: Applies appropriate sandbox attributes
4. **CSP Compliance**: Works with Content Security Policy

### Allowed HTML Tags
- iframe, div, p, span, a, img, video, audio

### Allowed Attributes
- src, href, width, height, title, alt, class, id, frameborder, allowfullscreen, allow

## Styling

The block includes responsive styles for all embed types. Key CSS classes:

- `.embed-block` - Main container
- `.embed-youtube-wrapper` - YouTube specific wrapper
- `.embed-twitter-wrapper` - Twitter specific wrapper
- `.embed-instagram-wrapper` - Instagram specific wrapper
- `.embed-html-wrapper` - Custom HTML wrapper
- `.embed-error` - Error message styling

## Extending

To add support for a new platform:

1. Add detection logic in `processUrlEmbed()` function
2. Create a platform-specific embed function (e.g., `createVimeoEmbed()`)
3. Add platform-specific styles if needed

Example:
```javascript
// In processUrlEmbed()
if (url.includes('vimeo.com')) {
  return createVimeoEmbed(url);
}

// New function
function createVimeoEmbed(url) {
  const videoId = extractVimeoId(url);
  const iframe = document.createElement('iframe');
  iframe.src = `https://player.vimeo.com/video/${videoId}`;
  // ... additional setup
  return iframe;
}
```

## Migration from AEM

When migrating from AEM Core Components:

1. **URL Type**: Maps directly - just paste the URL
2. **Embeddable Type**: Convert to typed embeds (e.g., `type: youtube`)
3. **HTML Type**: Maps directly but content is client-side sanitized

### Key Differences

| AEM Feature | EDS Implementation |
|-------------|-------------------|
| Server-side processing | Client-side processing |
| Complex dialogs | Simple table structure |
| Java URL processors | JavaScript URL detection |
| Policy configuration | Block variants |

## Performance Considerations

- Third-party scripts are loaded asynchronously
- Consider lazy loading for below-the-fold embeds
- Use facade pattern for heavy embeds (show thumbnail first)

## Accessibility

- All iframes include descriptive titles
- Keyboard navigation is supported
- Screen reader friendly
- Proper focus indicators

## Testing

Test embeds with:
1. Various URL formats
2. Mobile devices
3. Screen readers
4. Content Security Policy enabled
5. JavaScript disabled (graceful degradation)

## Troubleshooting

### Embed not showing
- Check browser console for errors
- Verify URL is correct and accessible
- Check Content Security Policy settings

### Embed not responsive
- Ensure parent container has proper width
- Check for CSS conflicts

### Security warnings
- Verify embed source is HTTPS
- Check for mixed content issues