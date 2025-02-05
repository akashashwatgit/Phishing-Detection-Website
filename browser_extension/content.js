// Create a popup element
let popup = document.createElement('div');
popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    text-align: center;
    font-family: Arial, sans-serif;
    font-size: 14px;
    display: none;
`;

// Add the popup to the document
document.body.appendChild(popup);

// Listen for all link clicks on the page
document.addEventListener('click', function(event) {
    // Check if the clicked element is a link or has a parent link
    let linkElement = event.target.closest('a');
    
    if (linkElement) {
        // Prevent the default link behavior
        event.preventDefault();
        
        const url = linkElement.href;
        if (url) {
            // Display the popup
            popup.style.display = 'block';
            popup.innerHTML = `
                <div>Checking link safety...</div>
                <div class="progress-bar">
                    <div class="progress-bar-fill"></div>
                </div>
            `;
            
            // Send message to background script
            chrome.runtime.sendMessage({
                type: 'checkUrl',
                url: url
            }, function(response) {
                // Handle the response from the background script
                if (response && response.status === 'safe') {
                    // If URL is safe, proceed with navigation
                    popup.innerHTML = `
                        <div>✅ Link is safe</div>
                        <div>Opening link...</div>
                    `;
                    setTimeout(() => {
                        window.location.href = url;
                        popup.style.display = 'none';
                    }, 1000);
                } else {
                    // If unsafe, update the popup
                    popup.innerHTML = `
                        <div>⚠️ Link may be unsafe</div>
                        <div>Opening in secure container...</div>
                    `;
                    setTimeout(() => {
                        popup.style.display = 'none';
                    }, 2000);
                }
            });
        }
    }
});

// Show tooltip when hovering over links
let tooltip = document.createElement('div');
tooltip.style.cssText = `
    position: fixed;
    padding: 8px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10000;
    display: none;
`;
document.body.appendChild(tooltip);

document.addEventListener('mouseover', function(event) {
    let linkElement = event.target.closest('a');
    if (linkElement) {
        tooltip.style.display = 'block';
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY + 10 + 'px';
        tooltip.textContent = 'Link will be checked for safety';
    }
});

document.addEventListener('mouseout', function(event) {
    if (event.target.closest('a')) {
        tooltip.style.display = 'none';
    }
});







