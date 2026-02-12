const messageInput = document.getElementById('message-input');
const messagesList = document.getElementById('messages-list');
const userSettingsTrigger = document.getElementById('user-settings-trigger');
const currentUsernameSpan = document.getElementById('current-username');
const currentUserAvatar = document.getElementById('current-user-avatar');

let currentUser = {
    name: "Użytkownik",
    avatar: "https://ui-avatars.com/api/?name=Ty&background=2f3136&color=fff"
};

function scrollToBottom() {
    messagesList.scrollTop = messagesList.scrollHeight;
}

function createMessageElement(text, author, avatar) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    const now = new Date();
    const timeString = `Dzisiaj o ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    messageDiv.innerHTML = `
        <img src="${avatar}" class="avatar-message">
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${author}</span>
                <span class="message-time">${timeString}</span>
            </div>
            <div class="message-text">${text}</div>
        </div>
    `;
    return messageDiv;
}

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim() !== "") {
        const text = messageInput.value;
        const msgElement = createMessageElement(text, currentUser.name, currentUser.avatar);
        messagesList.appendChild(msgElement);
        messageInput.value = "";
        scrollToBottom();
    }
});

userSettingsTrigger.addEventListener('click', () => {
    const newName = prompt("Podaj nową nazwę użytkownika:", currentUser.name);
    if (newName) {
        currentUser.name = newName;
        currentUsernameSpan.textContent = newName;
        
        // Opcjonalna aktualizacja awatara bazująca na nazwie
        const newAvatar = `https://ui-avatars.com/api/?name=${newName}&background=random`;
        currentUser.avatar = newAvatar;
        currentUserAvatar.src = newAvatar;
    }
});
