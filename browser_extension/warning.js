document.addEventListener('DOMContentLoaded', function() {
    // Get URL from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const originalUrl = urlParams.get('url');
    
    // Display the URL
    document.getElementById('url-display').textContent = originalUrl;

    // Handle proceed button
    document.getElementById('proceed-btn').addEventListener('click', function() {
        // Send message to background script to open in container
        chrome.runtime.sendMessage({
            type: 'openInContainer',
            url: originalUrl
        }, function(response) {
            // Close this warning page after container is launched
            window.close();
        });
    });

    // Handle cancel button
    document.getElementById('cancel-btn').addEventListener('click', function() {
        window.close();
    });
});