const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

/**
 * Simple script to debug Genius lyrics scraping.
 * Usage: node debug-lyrics.js <URL>
 */

async function debugLyrics(url) {
    if (!url) {
        console.error('Please provide a Genius lyrics URL.');
        console.log('Usage: node debug-lyrics.js https://genius.com/Taylor-swift-blank-space-lyrics');
        process.exit(1);
    }

    console.log(`Fetching: ${url}`);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();

        // Save HTML for manual inspection
        fs.writeFileSync('debug-last-response.html', html);
        console.log('Raw HTML saved to debug-last-response.html');

        const $ = cheerio.load(html);

        // Debug selectors
        const root = $('#lyrics-root');
        console.log(`\nSelector '#lyrics-root' found: ${root.length > 0}`);

        const oldContainer = $('div[class^="Lyrics-sc"]');
        console.log(`Selector 'div[class^="Lyrics-sc"]' found: ${oldContainer.length} elements`);

        const newContainer = $('[class^="Lyrics__Container"]');
        console.log(`Selector '[class^="Lyrics__Container"]' found: ${newContainer.length} elements`);

        const dataAttrContainer = $('[data-lyrics-container="true"]');
        console.log(`Selector '[data-lyrics-container="true"]' found: ${dataAttrContainer.length} elements`);

        // Try to extract lyrics with various methods
        console.log('\n--- Extraction Test ---');

        const containers = dataAttrContainer.length > 0 ? dataAttrContainer : newContainer;

        if (containers.length === 0) {
            console.log('No lyrics containers found! Genius HTML structure might have changed significantly.');
            return;
        }

        let lyrics_texts = [];
        containers.each((i, element) => {
            // Clone to avoid modifying the original if we want to test multiple methods
            const $el = $(element).clone();

            // Remove elements that are not part of the lyrics
            $el.find('[data-exclude-from-selection="true"]').remove();

            // Remove anti-copy/invisible spans
            $el.find('span[style*="opacity:0"]').remove();
            $el.find('span[style*="font-size:0"]').remove();

            // Remove tooltips and other metadata
            $el.find('[class^="Tooltip__Container"]').remove();

            $el.find('i').before('_').after('_');
            $el.find('br').replaceWith('\n');

            const text = $el.text().trim();
            lyrics_texts.push(text);
            console.log(`\nContainer ${i + 1} (first 100 chars):`);
            console.log(text.substring(0, 100).replace(/\n/g, '\\n') + '...');
        });


        const fullLyrics = lyrics_texts.join('\n');
        fs.writeFileSync('debug-extracted-lyrics.txt', fullLyrics);
        console.log('\nFull extracted lyrics saved to debug-extracted-lyrics.txt');

    } catch (error) {
        console.error('Error during debug:', error);
    }
}

const url = process.argv[2];
debugLyrics(url);
