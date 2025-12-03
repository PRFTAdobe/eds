/**
 * Embed Block
 * Supports embedding content via URL, HTML, or pre-configured embeddables
 * Converted from AEM Core Components Embed v2
 */

// Sanitize HTML to prevent XSS
function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  const sanitized = div.innerHTML;

  // Allow only safe tags and attributes
  const allowedTags = ['iframe', 'div', 'p', 'span', 'a', 'img', 'video', 'audio'];
  const allowedAttrs = ['src', 'href', 'width', 'height', 'title', 'alt', 'class', 'id', 'frameborder', 'allowfullscreen', 'allow'];

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, 'text/html');

  // Remove script tags and unsafe attributes
  const scripts = doc.querySelectorAll('script');
  scripts.forEach((script) => script.remove());

  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    // Remove element if not in allowed tags
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      el.remove();
      return;
    }

    // Remove unsafe attributes
    [...el.attributes].forEach((attr) => {
      if (!allowedAttrs.includes(attr.name.toLowerCase())) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

// Extract video ID from YouTube URL
function getYouTubeVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  const matchedPattern = patterns.find((pattern) => url.match(pattern));
  if (matchedPattern) {
    const match = url.match(matchedPattern);
    return match[1];
  }
  return null;
}

// Create YouTube embed
function createYouTubeEmbed(videoId, options = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'embed-youtube-wrapper';

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}`;
  iframe.width = options.width || '560';
  iframe.height = options.height || '315';
  iframe.frameBorder = '0';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.title = options.title || 'YouTube video';

  wrapper.appendChild(iframe);
  return wrapper;
}

// Create Twitter/X embed
function createTwitterEmbed(url) {
  const wrapper = document.createElement('div');
  wrapper.className = 'embed-twitter-wrapper';

  // Twitter embed placeholder
  const blockquote = document.createElement('blockquote');
  blockquote.className = 'twitter-tweet';
  const link = document.createElement('a');
  link.href = url;
  link.textContent = 'Loading tweet...';
  blockquote.appendChild(link);
  wrapper.appendChild(blockquote);

  // Load Twitter widget script
  if (!document.querySelector('script[src*="platform.twitter.com"]')) {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    document.body.appendChild(script);
  } else if (window.twttr && window.twttr.widgets) {
    // Re-render if script already loaded
    window.twttr.widgets.load(wrapper);
  }

  return wrapper;
}

// Create Instagram embed
function createInstagramEmbed(url) {
  const wrapper = document.createElement('div');
  wrapper.className = 'embed-instagram-wrapper';

  // Instagram embed placeholder
  const blockquote = document.createElement('blockquote');
  blockquote.className = 'instagram-media';
  blockquote.setAttribute('data-instgrm-captioned', '');
  blockquote.setAttribute('data-instgrm-permalink', url);
  const link = document.createElement('a');
  link.href = url;
  link.textContent = 'View this post on Instagram';
  blockquote.appendChild(link);
  wrapper.appendChild(blockquote);

  // Load Instagram embed script
  if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
  } else if (window.instgrm && window.instgrm.Embeds) {
    // Re-render if script already loaded
    window.instgrm.Embeds.process();
  }

  return wrapper;
}

// Process URL embeds
function processUrlEmbed(url) {
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return createYouTubeEmbed(videoId);
    }
  }

  // Twitter/X
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return createTwitterEmbed(url);
  }

  // Instagram
  if (url.includes('instagram.com')) {
    return createInstagramEmbed(url);
  }

  // Generic iframe for other URLs
  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.width = '100%';
  iframe.height = '400';
  iframe.frameBorder = '0';
  iframe.title = 'Embedded content';
  return iframe;
}

// Parse block content
function parseBlockContent(block) {
  const rows = [...block.children];
  const config = {};

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase().replace(':', '');
      const value = cells[1].textContent.trim();
      config[key] = value;
    } else if (cells.length === 1) {
      // Single cell might be the main content
      const text = cells[0].textContent.trim();
      if (text.startsWith('http')) {
        config.url = text;
      } else if (text.includes('<')) {
        config.html = text;
      } else {
        config.content = text;
      }
    }
  });

  return config;
}

export default function decorate(block) {
  const config = parseBlockContent(block);

  // Clear the block
  block.textContent = '';
  block.className = 'embed-block';

  // Determine embed type and process
  if (config.type === 'url' || config.url) {
    const url = config.url || config.content;
    if (url) {
      const embed = processUrlEmbed(url);
      block.appendChild(embed);
    }
  } else if (config.type === 'html' || config.html) {
    const html = config.html || config.content;
    if (html) {
      const sanitized = sanitizeHTML(html);
      const wrapper = document.createElement('div');
      wrapper.className = 'embed-html-wrapper';
      wrapper.innerHTML = sanitized;
      block.appendChild(wrapper);
    }
  } else if (config.type === 'youtube') {
    // Pre-configured YouTube embeddable
    const videoId = config.content || config.videoid;
    if (videoId) {
      const options = {
        width: config.width,
        height: config.height,
        title: config.title,
      };
      const embed = createYouTubeEmbed(videoId, options);
      block.appendChild(embed);
    }
  } else if (config.content) {
    // Fallback: try to detect content type
    if (config.content.startsWith('http')) {
      const embed = processUrlEmbed(config.content);
      block.appendChild(embed);
    } else if (config.content.includes('<')) {
      const sanitized = sanitizeHTML(config.content);
      const wrapper = document.createElement('div');
      wrapper.className = 'embed-html-wrapper';
      wrapper.innerHTML = sanitized;
      block.appendChild(wrapper);
    }
  }

  // Add error message if no content
  if (!block.firstChild) {
    const error = document.createElement('p');
    error.className = 'embed-error';
    error.textContent = 'No embeddable content found';
    block.appendChild(error);
  }
}
