const BACKEND_URL = 'http://localhost:5000/verify-url';
const processedUrls = new Set();

async function checkURL(url) {
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return { status: 'error', message: error.toString() };
    }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'checkUrl') {
        // Check if URL has been processed recently
        if (processedUrls.has(message.url)) {
            sendResponse({ status: 'safe' });
            return true;
        }

        // Process the URL
        checkURL(message.url).then(result => {
            processedUrls.add(message.url);
            
            // Clean up processed URL after 5 seconds
            setTimeout(() => {
                processedUrls.delete(message.url);
            }, 5000);

            if (result.status === 'unsafe') {
                // Show warning page
                chrome.tabs.create({
                    url: chrome.runtime.getURL(`warning.html?url=${encodeURIComponent(message.url)}`)
                });
                sendResponse({ status: 'unsafe' });
            } else {
                sendResponse({ status: 'safe' });
            }
        });

        return true; // Required for async response
    }
});

// Keep the original webRequest listener for direct URL entry
chrome.webRequest.onBeforeRequest.addListener(
    async function(details) {
        if (details.type === 'main_frame' && !processedUrls.has(details.url)) {
            try {
                processedUrls.add(details.url);
                const result = await checkURL(details.url);
                
                if (result.status === 'unsafe') {
                    const warningUrl = chrome.runtime.getURL(
                        `warning.html?url=${encodeURIComponent(details.url)}`
                    );
                    chrome.tabs.update(details.tabId, { url: warningUrl });
                    return { cancel: true };
                }
                
                setTimeout(() => {
                    processedUrls.delete(details.url);
                }, 5000);
                
                return { cancel: false };
            } catch (error) {
                console.error('URL check failed:', error);
                return { cancel: true };
            }
        }
        return { cancel: false };
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);