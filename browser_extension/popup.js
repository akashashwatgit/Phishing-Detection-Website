document.addEventListener('DOMContentLoaded', function() {
    let statusElement = document.getElementById('status');
    let checkButton = document.getElementById('checkPage');
    let dockerButton = document.getElementById('openDocker');
    let linkCountElement = document.getElementById('linkCount');
    let mlStatusElement = document.getElementById('mlStatus');
    let dockerStatusElement = document.getElementById('dockerStatus');
    
    checkButton.addEventListener('click', checkCurrentTab);
    dockerButton.addEventListener('click', openInDocker);
    
    updateSystemStatus();
    updateLinkCount();
    
    setInterval(updateSystemStatus, 30000);
});

async function checkCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        const currentUrl = tabs[0].url;
        
        checkButton.textContent = 'Checking...';
        checkButton.disabled = true;

        try {
            const response = await fetch('http://localhost:5000/verify-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: currentUrl })
            });

            const data = await response.json();
            updateStatus(data, currentUrl);
        } catch (error) {
            console.error('Error:', error);
            updateStatus({ status: 'error' });
        } finally {
            checkButton.textContent = 'Check Current Page';
            checkButton.disabled = false;
        }
    });
}

function updateStatus(data, url) {
    if (data.status === 'safe') {
        statusElement.className = 'status active';
        statusElement.innerHTML = '<span class="icon">✅</span><span>URL is Safe</span>';
    } else if (data.status === 'unsafe') {
        statusElement.className = 'status inactive';
        statusElement.innerHTML = '<span class="icon">⚠️</span><span>URL may be Unsafe</span>';
        dockerButton.classList.remove('disabled');
        dockerButton.disabled = false;
        dockerButton.setAttribute('data-url', url);
    } else {
        statusElement.className = 'status inactive';
        statusElement.innerHTML = '<span class="icon">❌</span><span>Error checking URL</span>';
    }
    
    incrementLinkCount();
}

function openInDocker() {
    const url = dockerButton.getAttribute('data-url');
    if (url) {
        chrome.runtime.sendMessage({ type: 'openInDocker', url: url });
    }
}

async function updateSystemStatus() {
    try {
        const backendResponse = await fetch('http://localhost:5000/health');
        const mlStatus = backendResponse.ok ? '✅ Connected' : '❌ Disconnected';
        const dockerStatus = backendResponse.ok ? '✅ Ready' : '❌ Not Ready';
        
        mlStatusElement.textContent = mlStatus;
        dockerStatusElement.textContent = dockerStatus;
    } catch (error) {
        mlStatusElement.textContent = '❌ Disconnected';
        dockerStatusElement.textContent = '❌ Not Ready';
    }
}

function updateLinkCount() {
    chrome.storage.local.get(['linkCount'], function(result) {
        linkCountElement.textContent = result.linkCount || 0;
    });
}

function incrementLinkCount() {
    chrome.storage.local.get(['linkCount'], function(result) {
        let newCount = (result.linkCount || 0) + 1;
        chrome.storage.local.set({ linkCount: newCount }, function() {
            linkCountElement.textContent = newCount;
        });
    });
}


