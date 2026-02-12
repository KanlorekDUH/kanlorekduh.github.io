// State
let currentUser = {
    username: "Użytkownik",
    discriminator: `#${Math.floor(1000 + Math.random() * 9000)}`,
    avatar: "https://ui-avatars.com/api/?name=U&background=random",
    status: "online"
};

let servers = [];
let friends = [];
let activeServerId = null;
let activeChannelId = null; 

// DOM Elements
const serverListEl = document.getElementById('server-list');
const channelListEl = document.getElementById('channel-list');
const sidebarHeaderEl = document.getElementById('sidebar-header');
const messagesListEl = document.getElementById('messages-list');
const headerNameEl = document.getElementById('header-name');
const headerSymbolEl = document.getElementById('header-symbol');
const membersSidebarEl = document.getElementById('members-sidebar');
const inputAreaEl = document.getElementById('input-area');
const messageInputEl = document.getElementById('message-input');
const homeButton = document.getElementById('home-button');
const settingsModal = document.getElementById('settings-modal');

// Init
function init() {
    updateUserInterface();
    renderServerList();
    switchToHome();
    setupEventListeners();
}

function updateUserInterface() {
    document.getElementById('current-username').textContent = currentUser.username;
    document.getElementById('current-discriminator').textContent = currentUser.discriminator;
    document.getElementById('current-user-avatar').src = currentUser.avatar;
    document.getElementById('settings-avatar-preview').src = currentUser.avatar;
    document.getElementById('settings-username-input').value = currentUser.username;
    document.getElementById('settings-discriminator').textContent = currentUser.discriminator;
    document.getElementById('settings-id-display').textContent = `${currentUser.username}${currentUser.discriminator}`;
}

function renderServerList() {
    const existingIcons = document.querySelectorAll('.server-icon:not(.home-icon):not(.add-server)');
    existingIcons.forEach(icon => icon.remove());

    const separator = document.querySelector('.server-separator');
    
    servers.forEach(server => {
        const icon = document.createElement('div');
        icon.className = `server-icon ${activeServerId === server.id ? 'active' : ''}`;
        icon.innerHTML = `<img src="${server.icon}" alt="${server.name}">`;
        icon.onclick = () => switchToServer(server.id);
        serverListEl.insertBefore(icon, separator.nextSibling);
    });
}

function switchToHome() {
    activeServerId = null;
    activeChannelId = null;
    document.querySelectorAll('.server-icon').forEach(i => i.classList.remove('active'));
    homeButton.classList.add('active');
    
    sidebarHeaderEl.innerHTML = `<span>Znajomi</span><button class="add-friend-btn" style="margin-left:auto; background:none; border:none; color:white; cursor:pointer;" onclick="openFriendModal()">Dodaj</button>`;
    
    renderFriendList();
    
    headerSymbolEl.textContent = "@";
    headerNameEl.textContent = "Strona Główna";
    inputAreaEl.style.display = 'none';
    messagesListEl.innerHTML = `<div class="empty-state"><h3>Witaj, ${currentUser.username}!</h3><p>Wybierz serwer lub znajomego.</p></div>`;
    membersSidebarEl.innerHTML = `<div class="members-group">Aktywni teraz</div>`;
    
    document.getElementById('voice-call-btn').style.display = 'none';
    document.getElementById('video-call-btn').style.display = 'none';
}

function renderFriendList() {
    channelListEl.innerHTML = `<div class="channel-category">Wiadomości prywatne</div>`;
    
    if (friends.length === 0) {
        channelListEl.innerHTML += `<div style="padding:10px; color:#72767d; font-size:12px;">Brak znajomych. Dodaj kogoś!</div>`;
    }

    friends.forEach(friend => {
        const item = document.createElement('div');
        item.className = 'channel-item';
        item.innerHTML = `<img src="${friend.avatar}" style="width:24px; height:24px; border-radius:50%; margin-right:8px;"> <span>${friend.username}</span>`;
        item.onclick = () => openDM(friend);
        channelListEl.appendChild(item);
    });
}

function openDM(friend) {
    headerNameEl.textContent = friend.username;
    headerSymbolEl.textContent = "@";
    messagesListEl.innerHTML = `<div class="empty-state"><img src="${friend.avatar}" style="width:80px; height:80px; border-radius:50%; margin-bottom:10px;"><h3>${friend.username}</h3><p>To początek waszej historii.</p></div>`;
    inputAreaEl.style.display = 'block';
    messageInputEl.placeholder = `Napisz do @${friend.username}`;
    
    document.getElementById('voice-call-btn').style.display = 'block';
    document.getElementById('video-call-btn').style.display = 'block';
}

function switchToServer(serverId) {
    activeServerId = serverId;
    const server = servers.find(s => s.id === serverId);
    
    document.querySelectorAll('.server-icon').forEach(i => i.classList.remove('active'));
    renderServerList(); 
    
    sidebarHeaderEl.innerHTML = `<span>${server.name}</span>`;
    
    channelListEl.innerHTML = '';
    
    // Text Channels
    const textCat = document.createElement('div');
    textCat.className = 'channel-category';
    textCat.textContent = 'KANAŁY TEKSTOWE';
    channelListEl.appendChild(textCat);
    
    server.channels.text.forEach(chan => {
        const item = document.createElement('div');
        item.className = `channel-item ${activeChannelId === chan.id ? 'active' : ''}`;
        item.innerHTML = `<span class="channel-hash">#</span> ${chan.name}`;
        item.onclick = () => setActiveChannel(chan, 'text');
        channelListEl.appendChild(item);
    });

    // Voice Channels
    const voiceCat = document.createElement('div');
    voiceCat.className = 'channel-category';
    voiceCat.textContent = 'KANAŁY GŁOSOWE';
    channelListEl.appendChild(voiceCat);
    
    server.channels.voice.forEach(chan => {
        const item = document.createElement('div');
        item.className = `channel-item ${activeChannelId === chan.id ? 'active' : ''}`;
        item.innerHTML = `<span class="channel-voice-icon">🔊</span> ${chan.name}`;
        item.onclick = () => setActiveChannel(chan, 'voice');
        channelListEl.appendChild(item);
    });

    // Default select first text channel
    if (server.channels.text.length > 0) setActiveChannel(server.channels.text[0], 'text');
    
    renderMembers(server);
}

function setActiveChannel(channel, type) {
    activeChannelId = channel.id;
    const items = document.querySelectorAll('.channel-item');
    items.forEach(i => i.classList.remove('active')); 
    // Re-render to show active state visually simple way
    const server = servers.find(s => s.id === activeServerId);
    if(server) {
       // Just visual refresh hack for this demo
       Array.from(channelListEl.children).forEach(child => {
           if(child.innerHTML.includes(channel.name)) child.classList.add('active');
           else child.classList.remove('active');
       });
    }

    if (type === 'text') {
        headerSymbolEl.textContent = '#';
        headerNameEl.textContent = channel.name;
        inputAreaEl.style.display = 'block';
        messageInputEl.placeholder = `Napisz na #${channel.name}`;
        messagesListEl.innerHTML = ''; 
        document.getElementById('voice-call-btn').style.display = 'none';
        document.getElementById('video-call-btn').style.display = 'none';
    } else {
        headerSymbolEl.textContent = '🔊';
        headerNameEl.textContent = channel.name;
        inputAreaEl.style.display = 'none';
        messagesListEl.innerHTML = `<div class="empty-state"><h3>Połączono z głosem</h3><p>${channel.name}</p></div>`;
        document.getElementById('voice-call-btn').style.display = 'none';
        document.getElementById('video-call-btn').style.display = 'none';
    }
}

function renderMembers(server) {
    membersSidebarEl.innerHTML = `<div class="members-group">Online - 1</div>`;
    const me = document.createElement('div');
    me.className = 'member-item';
    me.innerHTML = `
        <img src="${currentUser.avatar}" class="avatar-small">
        <div class="member-info">
            <span class="member-name">${currentUser.username} <span class="member-tag">${currentUser.discriminator}</span></span>
        </div>
    `;
    membersSidebarEl.appendChild(me);
}

// Actions
document.getElementById('add-server-btn').onclick = () => {
    document.getElementById('server-modal').style.display = 'flex';
};

document.getElementById('close-server-modal').onclick = () => {
    document.getElementById('server-modal').style.display = 'none';
};

document.getElementById('create-server-confirm').onclick = () => {
    const name = document.getElementById('new-server-name').value;
    if (name) {
        const newServer = {
            id: Date.now(),
            name: name,
            icon: `https://ui-avatars.com/api/?name=${name.substring(0,2)}&background=random`,
            channels: {
                text: [{id: 1, name: "ogólny"}],
                voice: [{id: 2, name: "Ogólny"}]
            }
        };
        servers.push(newServer);
        document.getElementById('server-modal').style.display = 'none';
        renderServerList();
        switchToServer(newServer.id);
    }
};

window.openFriendModal = () => {
    document.getElementById('friend-modal').style.display = 'flex';
};
document.getElementById('close-friend-modal').onclick = () => {
    document.getElementById('friend-modal').style.display = 'none';
};
document.getElementById('add-friend-confirm').onclick = () => {
    const val = document.getElementById('friend-id-input').value;
    if(val) {
        const parts = val.split('#');
        const name = parts[0];
        friends.push({
            username: name,
            avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
        });
        document.getElementById('friend-modal').style.display = 'none';
        if(activeServerId === null) renderFriendList();
        alert(`Wysłano zaproszenie do ${val}`);
    }
};

homeButton.onclick = switchToHome;

// Settings Logic
document.getElementById('settings-btn').onclick = () => {
    settingsModal.style.display = 'flex';
    populateAudioDevices();
};

document.querySelectorAll('.close-btn-abs, .close-settings, .modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
        if (e.target === el) settingsModal.style.display = 'none';
    });
});

const tabs = document.querySelectorAll('.settings-tab[data-tab]');
tabs.forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    };
});

document.querySelector('.change-avatar-btn').onclick = () => {
    document.getElementById('avatar-upload').click();
};

document.getElementById('avatar-upload').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            currentUser.avatar = ev.target.result;
            updateUserInterface();
            if(activeServerId === null) renderMembers(null); 
        };
        reader.readAsDataURL(file);
    }
};

document.getElementById('settings-username-input').oninput = (e) => {
    currentUser.username = e.target.value;
    document.getElementById('settings-id-display').textContent = `${currentUser.username}${currentUser.discriminator}`;
};

// Sync settings on close
document.querySelector('.close-settings').addEventListener('click', () => {
    updateUserInterface();
});

// Audio Settings
async function populateAudioDevices() {
    const inputSelect = document.getElementById('audio-input-device');
    const outputSelect = document.getElementById('audio-output-device');
    inputSelect.innerHTML = '';
    outputSelect.innerHTML = '';

    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Urządzenie ${device.deviceId.slice(0,5)}...`;
            
            if (device.kind === 'audioinput') inputSelect.appendChild(option);
            else if (device.kind === 'audiooutput') outputSelect.appendChild(option);
        });
        
        // Mock mic test
        simulateMicTest();
    } catch (err) {
        console.error("Brak dostępu do mikrofonu", err);
        const opt = document.createElement('option');
        opt.text = "Brak dostępu lub urządzeń";
        inputSelect.appendChild(opt);
    }
}

function simulateMicTest() {
    const bar = document.querySelector('.mic-level');
    setInterval(() => {
        if(settingsModal.style.display === 'flex') {
            const randomVol = Math.random() * 80;
            bar.style.width = `${randomVol}%`;
        }
    }, 200);
}

// Chat Input
messageInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && messageInputEl.value.trim() !== "") {
        const div = document.createElement('div');
        div.className = 'message';
        const now = new Date();
        div.innerHTML = `
            <img src="${currentUser.avatar}" class="avatar-message">
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${currentUser.username}</span>
                    <span class="message-time">Dzisiaj o ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}</span>
                </div>
                <div class="message-text">${messageInputEl.value}</div>
            </div>
        `;
        messagesListEl.appendChild(div);
        messageInputEl.value = "";
        messagesListEl.scrollTop = messagesListEl.scrollHeight;
    }
});

function setupEventListeners() {
    // Buttons for call
    const callBtn = document.getElementById('voice-call-btn');
    callBtn.onclick = () => {
        callBtn.style.color = callBtn.style.color === 'red' ? '#b9bbbe' : 'red';
    };
}

init();
