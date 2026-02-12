document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let currentUser = {
        username: "Użytkownik",
        discriminator: `#${Math.floor(1000 + Math.random() * 9000)}`,
        avatar: "https://ui-avatars.com/api/?name=U&background=random",
    };

    let servers = [];
    let friends = [];
    let activeServerId = null;
    
    // --- ELEMENTS ---
    const serverListEl = document.getElementById('server-list');
    const channelListEl = document.getElementById('channel-list');
    const sidebarTitle = document.getElementById('sidebar-title');
    const messagesListEl = document.getElementById('messages-list');
    const headerNameEl = document.getElementById('header-name');
    const headerSymbolEl = document.getElementById('header-symbol');
    const membersSidebarEl = document.getElementById('members-sidebar');
    const inputAreaEl = document.getElementById('input-area');
    const messageInputEl = document.getElementById('message-input');
    const homeButton = document.getElementById('home-button');
    const topAddFriendBtn = document.getElementById('top-add-friend-btn');
    
    // Modals
    const settingsModal = document.getElementById('settings-modal');
    const serverModal = document.getElementById('server-modal');
    const friendModal = document.getElementById('friend-modal');

    // --- INITIALIZATION ---
    function init() {
        updateUserUI();
        renderServerList();
        switchToHome();
        setupEventListeners();
    }

    // --- CORE FUNCTIONS ---
    function updateUserUI() {
        document.getElementById('current-username').textContent = currentUser.username;
        document.getElementById('current-discriminator').textContent = currentUser.discriminator;
        document.getElementById('current-user-avatar').src = currentUser.avatar;
        document.getElementById('settings-avatar-preview').src = currentUser.avatar;
        document.getElementById('settings-username-input').value = currentUser.username;
        document.getElementById('settings-discriminator').textContent = currentUser.discriminator;
        document.getElementById('settings-id-display').textContent = `${currentUser.username}${currentUser.discriminator}`;
    }

    function renderServerList() {
        // Clear old servers except Home and Add Button
        const existingIcons = document.querySelectorAll('.server-icon.dynamic');
        existingIcons.forEach(icon => icon.remove());
        
        const separator = document.querySelector('.server-separator');
        
        servers.forEach(server => {
            const icon = document.createElement('div');
            icon.className = `server-icon dynamic ${activeServerId === server.id ? 'active' : ''}`;
            icon.innerHTML = `<img src="${server.icon}" alt="${server.name}">`;
            icon.addEventListener('click', () => switchToServer(server.id));
            serverListEl.insertBefore(icon, separator.nextSibling);
        });
    }

    function switchToHome() {
        activeServerId = null;
        document.querySelectorAll('.server-icon').forEach(i => i.classList.remove('active'));
        homeButton.classList.add('active');
        
        sidebarTitle.textContent = "Wiadomości prywatne";
        renderFriendList();
        
        headerSymbolEl.style.display = 'block';
        headerSymbolEl.textContent = "@";
        headerNameEl.textContent = "Strona Główna";
        topAddFriendBtn.style.display = 'block'; // Pokaż przycisk dodawania znajomych
        
        inputAreaEl.style.display = 'none';
        messagesListEl.innerHTML = `<div class="empty-state"><h3>Witaj, ${currentUser.username}!</h3><p>Wybierz znajomego z listy po lewej lub dodaj nowego (zielony przycisk u góry).</p></div>`;
        membersSidebarEl.innerHTML = `<div class="members-group">Aktywni teraz</div>`;
        
        hideCallButtons();
    }

    function renderFriendList() {
        channelListEl.innerHTML = `<div class="channel-category">Znajomi</div>`;
        if (friends.length === 0) {
            channelListEl.innerHTML += `<div style="padding:10px; color:#72767d; font-size:12px;">Brak znajomych.</div>`;
        }
        friends.forEach(friend => {
            const item = document.createElement('div');
            item.className = 'channel-item';
            item.innerHTML = `<img src="${friend.avatar}" style="width:24px; height:24px; border-radius:50%; margin-right:8px;"> <span>${friend.username}</span>`;
            item.addEventListener('click', () => openDM(friend));
            channelListEl.appendChild(item);
        });
    }

    function openDM(friend) {
        headerNameEl.textContent = friend.username;
        topAddFriendBtn.style.display = 'none';
        
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
        
        sidebarTitle.textContent = server.name;
        topAddFriendBtn.style.display = 'none';
        
        channelListEl.innerHTML = '';
        
        // Render Text Channels
        const textCat = document.createElement('div');
        textCat.className = 'channel-category';
        textCat.textContent = 'KANAŁY TEKSTOWE';
        channelListEl.appendChild(textCat);
        
        server.channels.text.forEach(chan => {
            const item = document.createElement('div');
            item.className = 'channel-item';
            item.innerHTML = `<span class="channel-hash">#</span> ${chan.name}`;
            item.addEventListener('click', () => {
                document.querySelectorAll('.channel-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                setActiveChannel(chan, 'text');
            });
            channelListEl.appendChild(item);
        });

        // Render Voice Channels
        const voiceCat = document.createElement('div');
        voiceCat.className = 'channel-category';
        voiceCat.textContent = 'KANAŁY GŁOSOWE';
        channelListEl.appendChild(voiceCat);
        
        server.channels.voice.forEach(chan => {
            const item = document.createElement('div');
            item.className = 'channel-item';
            item.innerHTML = `<span class="channel-hash">🔊</span> ${chan.name}`;
            item.addEventListener('click', () => {
                document.querySelectorAll('.channel-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                setActiveChannel(chan, 'voice');
            });
            channelListEl.appendChild(item);
        });
        
        renderMembers(server);
        // Default to first channel
        if(server.channels.text.length > 0) setActiveChannel(server.channels.text[0], 'text');
    }

    function setActiveChannel(channel, type) {
        if (type === 'text') {
            headerSymbolEl.textContent = '#';
            headerNameEl.textContent = channel.name;
            inputAreaEl.style.display = 'block';
            messageInputEl.placeholder = `Napisz na #${channel.name}`;
            messagesListEl.innerHTML = ''; 
            hideCallButtons();
        } else {
            headerSymbolEl.textContent = '🔊';
            headerNameEl.textContent = channel.name;
            inputAreaEl.style.display = 'none';
            messagesListEl.innerHTML = `<div class="empty-state"><h3>Połączono z głosem</h3><p>${channel.name}</p></div>`;
            hideCallButtons();
        }
    }

    function renderMembers(server) {
        membersSidebarEl.innerHTML = `<div class="members-group">Online - 1</div>`;
        const me = document.createElement('div');
        me.className = 'member-item';
        me.innerHTML = `
            <img src="${currentUser.avatar}" class="avatar-medium" style="width:32px; height:32px; margin-right:10px;">
            <div class="member-info">
                <span class="member-name">${currentUser.username}</span>
            </div>
        `;
        membersSidebarEl.appendChild(me);
    }

    function hideCallButtons() {
        document.getElementById('voice-call-btn').style.display = 'none';
        document.getElementById('video-call-btn').style.display = 'none';
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        // 1. Home Button
        homeButton.addEventListener('click', switchToHome);

        // 2. Add Server
        document.getElementById('add-server-btn').addEventListener('click', () => {
            serverModal.style.display = 'flex';
        });
        document.getElementById('close-server-modal').addEventListener('click', () => {
            serverModal.style.display = 'none';
        });
        document.getElementById('create-server-confirm').addEventListener('click', () => {
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
                serverModal.style.display = 'none';
                renderServerList();
                switchToServer(newServer.id);
            }
        });

        // 3. Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            settingsModal.style.display = 'flex';
            populateAudioDevices();
        });
        const closeSettings = () => settingsModal.style.display = 'none';
        document.getElementById('close-settings-btn').addEventListener('click', closeSettings);
        document.getElementById('close-settings-x').addEventListener('click', closeSettings);

        // Settings Tabs
        document.querySelectorAll('.settings-tab[data-tab]').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
            });
        });

        // Username Change
        document.getElementById('settings-username-input').addEventListener('input', (e) => {
            currentUser.username = e.target.value;
            updateUserUI();
            if(activeServerId) renderMembers(null);
        });

        // Avatar Change
        document.getElementById('change-avatar-trigger').addEventListener('click', () => {
            document.getElementById('avatar-upload').click();
        });
        document.getElementById('avatar-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    currentUser.avatar = ev.target.result;
                    updateUserUI();
                };
                reader.readAsDataURL(file);
            }
        });

        // 4. Add Friend (Green Button)
        topAddFriendBtn.addEventListener('click', () => {
            friendModal.style.display = 'flex';
        });
        document.getElementById('close-friend-modal').addEventListener('click', () => {
            friendModal.style.display = 'none';
        });
        document.getElementById('add-friend-confirm').addEventListener('click', () => {
            const val = document.getElementById('friend-id-input').value;
            if(val) {
                const parts = val.split('#');
                const name = parts[0];
                friends.push({
                    username: name,
                    avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
                });
                friendModal.style.display = 'none';
                renderFriendList();
            }
        });

        // 5. Chat Input
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
    }

    async function populateAudioDevices() {
        const inputSelect = document.getElementById('audio-input-device');
        inputSelect.innerHTML = '';
        try {
            // Check permissions roughly
            const devices = await navigator.mediaDevices.enumerateDevices();
            devices.forEach(device => {
                if (device.kind === 'audioinput') {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.text = device.label || `Mikrofon ${device.deviceId.slice(0,5)}...`;
                    inputSelect.appendChild(option);
                }
            });
            // Fake mic volume
            setInterval(() => {
                if(settingsModal.style.display === 'flex') {
                    document.querySelector('.mic-level').style.width = Math.random() * 80 + '%';
                }
            }, 200);
        } catch (e) {
            const opt = document.createElement('option');
            opt.text = "Brak dostępu do urządzeń";
            inputSelect.appendChild(opt);
        }
    }

    // Start App
    init();
});
