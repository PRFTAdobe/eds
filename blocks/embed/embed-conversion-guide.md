# AEM Core Components Embed to EDS Block Conversion Guide

## Overview
This guide explains how to convert the AEM Core WCM Components Embed component (v2) to an Edge Delivery Services (EDS) block.

## AEM Embed Component Features
The AEM Core Components Embed supports three types of embeds:
1. **URL** - Embeds content via URL (supports oEmbed providers like YouTube, Twitter, etc.)
2. **Embeddable** - Pre-configured embeddables with trusted sources
3. **HTML** - Free-form HTML (sanitized for safety)

## EDS Block Structure

### 1. Content Structure in Document
In your document (Word/Google Docs), the embed block should be structured as:

```
| Embed |
|-------|
| type: url |
| https://www.youtube.com/watch?v=VIDEO_ID |
```

Or for HTML embeds:
```
| Embed |
|-------|
| type: html |
| <iframe src="https://example.com/embed" width="600" height="400"></iframe> |
```

Or for pre-configured embeddables:
```
| Embed |
|-------|
| type: youtube |
| VIDEO_ID |
| width: 560 |
| height: 315 |
```

### 2. Block Implementation

The EDS embed block needs to handle:
- Different embed types (URL, HTML, embeddable)
- oEmbed processing for URLs
- Security/sanitization for HTML
- Responsive design
- Accessibility

## Key Differences

### AEM Component
- Uses HTL templating
- Server-side processing
- Complex dialog configuration
- Java-based URL processors
- Design dialog for policy configuration

### EDS Block
- Client-side JavaScript
- Simplified content structure
- No complex dialogs
- JavaScript-based processing
- Configuration through block variants

## Implementation Steps

### 1. Create Block Files
- `embed.js` - Main logic
- `embed.css` - Styling

### 2. Processing Logic
- Parse block content to determine embed type
- Process URLs for oEmbed
- Sanitize HTML content
- Create appropriate DOM structure

### 3. Supported Providers
Implement support for common providers:
- YouTube
- Twitter/X
- Instagram
- Pinterest
- Generic oEmbed

### 4. Security Considerations
- Sanitize all HTML input
- Use iframe sandboxing
- Validate URLs
- Content Security Policy compliance

## Migration Checklist

- [ ] Identify all embed component instances in AEM
- [ ] Map embed types to EDS block variants
- [ ] Convert dialog configurations to block metadata
- [ ] Test all embed providers
- [ ] Verify responsive behavior
- [ ] Ensure accessibility compliance
- [ ] Update content authoring guidelines

## Example Conversions

### YouTube Embed
**AEM:**
```xml
<div data-sly-use.embed="com.adobe.cq.wcm.core.components.models.Embed">
    <!-- Complex HTL logic -->
</div>
```

**EDS:**
```javascript
// Simple DOM manipulation in embed.js
if (embedType === 'youtube') {
    const iframe = createYouTubeEmbed(videoId, options);
    block.append(iframe);
}
```

### Custom HTML
**AEM:**
- Requires policy configuration
- Server-side sanitization

**EDS:**
- Client-side sanitization
- Direct DOM manipulation

## Best Practices

1. **Progressive Enhancement**: Start with a link, enhance to embed
2. **Performance**: Lazy load embeds when possible
3. **Accessibility**: Provide titles and descriptions
4. **Responsive**: Use aspect ratio containers
5. **Privacy**: Consider privacy-friendly embed options

## Testing

1. Test all supported embed types
2. Verify mobile responsiveness
3. Check accessibility with screen readers
4. Validate against CSP policies
5. Test error handling for invalid URLs