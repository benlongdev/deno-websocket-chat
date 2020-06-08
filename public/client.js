// @ts-nocheck
let ws;
let editor;
let chatUsersCtr = document.querySelector("#chatUsers");
let chatUsersCount = document.querySelector("#chatUsersCount");
let sendMessageForm = document.querySelector("#messageSendForm");
let messageInput = document.querySelector("#messageInput");
let chatMessagesCtr = document.querySelector("#chatMessages");
let leaveGroupBtn = document.querySelector("#leaveGroupBtn");
let groupName = document.querySelector("#groupName");

window.addEventListener("DOMContentLoaded", () => {
  ws = new WebSocket(`ws://localhost:3000/ws`);
  ws.addEventListener("open", onConnectionOpen);
  ws.addEventListener("message", onMessageReceived);
});

sendMessageForm.onsubmit = (ev) => {
  ev.preventDefault();
  submit();
};

leaveGroupBtn.onclick = () => {
  window.location.href = 'chat.html';
};

function submit() {
  if (!editor) {
    return;
  }
  const content = editor.getContent();
  if (!content) {
    return;
  }
  const event = {
    event: "message",
    data: content
  };
  ws.send(JSON.stringify(event));
  editor.resetContent();
}

function initTinyMCE() {
  tinymce.init({
    selector: '#messageInput',
    plugins: 'autoresize link lists',
    toolbar: 'undo redo | bold italic underline strikethrough | forecolor | numlist bullist | link blockquote',
    menubar: false,
    statusbar: false,
    width: '100%',
    toolbar_location: 'bottom',
    autoresize_bottom_margin: 0,
    contextmenu: false,
    setup: (ed) => {
      editor = ed;
      ed.on('keydown', (e) => {
        // Submit if pressing enter in a paragraph with a collapsed selection
        if (e.keyCode === 13 && e.shiftKey !== true && ed.selection.isCollapsed()) {
          const block = ed.dom.getParent(ed.selection.getStart(), ed.dom.isBlock);
          if (block.nodeName === 'P' && block.parentNode === editor.getBody()) {
            submit();
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        }
      });
    }
  });
}

function onConnectionOpen() {
  console.log(`Connection Opened`);
  const queryParams = getQueryParams();
  if (!queryParams.name || !queryParams.group) {
    window.location.href = "chat.html";
    return;
  }
  groupName.innerHTML = queryParams.group;
  const event = {
    event: "join",
    groupName: queryParams.group,
    name: queryParams.name,
  };
  ws.send(JSON.stringify(event));
}

function onMessageReceived(event) {
  console.log("Message received ");
  event = JSON.parse(event.data);
  console.log(event);
  switch (event.event) {
    case "users":
      chatUsersCount.innerHTML = event.data.length;
      chatUsersCtr.innerHTML = "";
      event.data.forEach((u) => {
        const userEl = document.createElement("div");
        userEl.className = "chat-user";
        userEl.innerHTML = u.name;
        chatUsersCtr.appendChild(userEl);
      });
      break;
    case "message":
      const el = chatMessagesCtr;
      const scrollToBottom = Math.floor(el.offsetHeight + el.scrollTop) === el.scrollHeight
      appendMessage(event.data);

      if (scrollToBottom) {

        el.scrollTop = 10000000;
      }
      break;

    case "previousMessages":
      event.data.forEach(appendMessage);
  }
}

function appendMessage(message) {
  const messageEl = document.createElement("div");
  messageEl.className = `message message-${
    message.sender === "me" ? "to" : "from"
  }`;
  messageEl.innerHTML = `
        ${message.sender === "me" ? "" : `<h4>${message.name}</h4>`}
        <div class="message-text">${message.message}</div>
      `;
  chatMessagesCtr.appendChild(messageEl);
}

function getQueryParams() {
  const search = window.location.search.substring(1);
  const pairs = search.split("&");
  const params = {};
  for (const pair of pairs) {
    const parts = pair.split("=");
    params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return params;
}

initTinyMCE();
