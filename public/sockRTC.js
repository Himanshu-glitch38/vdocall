const socket = io({ autoConnect: false });
let isInitiator = false;
let PC;
const localVideo = document.getElementById("localVideo");
let localStream = null;
const remoteVideo = document.getElementById("remoteVideo");
let partner = null;
const muteBtn = document.getElementById("muteBtn");
const loadingSpinner = document.getElementById("loading-spinner");
const strangerOverlay = document.getElementById("strangerOverlay");
const strangerStatus = document.getElementById("strangerStatus");

const chatInput = document.getElementById("chat-msg");
const sendBtn = document.getElementById("send-btn");
const chatLog = document.getElementById("chat-log");
const blobs = document.querySelectorAll(".blob");

const skipBtn = document.getElementById("skipBtn");

function setStrangerOverlay(visible, text = "Searching for a stranger...") {
  if (strangerStatus) strangerStatus.textContent = text;
  if (strangerOverlay) strangerOverlay.classList.toggle("hidden", !visible);
}
setStrangerOverlay(true, "Connecting to server...");

function startNewMatch(
  visible = false,
  text = "Searching for a new stranger..."
) {
  if (!visible) {
    chatLog.innerHTML = "";
    return;
  }
  // if (!chatLog) return;
  // isSearchingMatch = true;
  // clearPendingReplies();
  if (blobs[0]) blobs[0].style.background = "";
  if (blobs[1]) blobs[1].style.background = "";
  // setChatInputState(false, 'Searching for stranger...');
  // showSearchLoader(text);
  // setStrangerOverlay(false, text);
  // if (remoteVideo) remoteVideo.srcObject = null;

  /*matchTimer = setTimeout(() => {
      isSearchingMatch = false;
      chatLog.innerHTML = '<div class="msg msg-stranger">Stranger found! Say hi!</div>';
      setChatInputState(false, 'Type a message...');
      setStrangerOverlay(false);
      // if (remoteVideo && localStream) remoteVideo.srcObject = localStream;
      if (chatInput) chatInput.focus();
      matchTimer = null;
  }, 1600);*/
}

function sendMessage(txt) {
  if (!chatInput || !chatLog) return;
  if (!txt) return;
  const msg = txt.trim();
  if (msg) {
    // Add User Message
    const msgDiv = document.createElement("div");
    msgDiv.className = "msg msg-me";
    msgDiv.textContent = msg;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight; // Auto scroll
    chatInput.value = "";

    // Change background to User Theme (Blue/Cool)
    if (blobs[0])
      blobs[0].style.background = "linear-gradient(45deg, #00d2ff, #3a7bd5)";
    if (blobs[1]) blobs[1].style.background = "#48dbfb";
  }
}

async function initMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localVideo.srcObject = localStream;
    socket.connect();
  } catch (err) {
    // socket.disconnect();
    alert("Camera and microphone permission required.");
    console.error(err);
  }
}

initMedia();

function createPeer() {
  if (PC) return;

  if (!localStream) {
    alert("Local media not ready");
    return;
  }
  // logger.log("Creating new peer");

  PC = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
  });

  PC.ontrack = (event) => {
    //   logger.log("track received from partner")
    remoteVideo.srcObject = event.streams[0];
  };

  localStream.getTracks().forEach((track) => {
    PC.addTrack(track, localStream);
  });

  PC.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", {
        data: { candidate: event.candidate },
      });
    }
  };

  PC.onconnectionstatechange = () => {
    if (
      PC.connectionState === "disconnected" ||
      PC.connectionState === "failed" ||
      PC.connectionState === "closed"
    ) {
      cleanupPeer();
    }
  };

  if (isInitiator) {
    PC.createOffer()
      .then((offer) => PC.setLocalDescription(offer))
      .then(() => {
        socket.emit("signal", {
          data: { sdp: PC.localDescription },
        });
      })
      .catch(console.error);
  }
}

function cleanupPeer() {
  if (PC) {
    PC.close();
    PC = null;
  }

  remoteVideo.srcObject = null;
  // logger.debug("vid src cleared")
  isInitiator = false;
}

socket.on("connect", () => {
  setStrangerOverlay(true, "getting info..");
});

socket.on("disconnect", () => {
  partner = null;
  cleanupPeer();
  console.log("Disconnected from the server");
  setStrangerOverlay(true, "SErver disconnected");
  startNewMatch(true, "Disconnected from server. reload to connect.");
  // socketConnectionText.innerHTML = "No";
  // logger.error("Disconnected from the server");
});

// waiting event handler
socket.on("waiting", () => {
  partner = null;
  cleanupPeer();
  setStrangerOverlay(true, "Waiting for a stranger.");
  startNewMatch(true, "Waiting for a stranger...");
  // logger.info("Waiting for a partner...");
});

socket.on("partner-disconnected", () => {
  partner = null;
  cleanupPeer();
  setStrangerOverlay(true, "Partner disconnected. searching for new one.");
  startNewMatch(true, "Partner disconnected. searching for new one...");
  sendMessage("Partner disconnectde");
  // logger.warn("your Partner disconnected");
});

// on matchevent
socket.on("matched", async (partnerId) => {
  partner = partnerId;
  // logger.success("Matched with partner with ID: " + partnerId);

  isInitiator = socket.id < partnerId;

  if (!localStream) {
    //   logger.warn("Media is not ready.. Initiating now");
    await initMedia();
  }

  createPeer();
  startNewMatch(false);
  setStrangerOverlay(false);
  sendMessage("connected with a stranger.");
  //   logger.log("peer created");
});

// on signal event handler
socket.on("signal", async ({ data }) => {
  if (!PC) {
    // isInitiator = false;
    // partnerId = from;
    createPeer();
  }

  try {
    if (data.sdp) {
      await PC.setRemoteDescription(new RTCSessionDescription(data.sdp));

      if (data.sdp.type === "offer") {
        const answer = await PC.createAnswer();
        await PC.setLocalDescription(answer);

        //   logger.log("signal test #1 success")
        socket.emit("signal", {
          data: { sdp: answer },
        });
      }
    }

    if (data.candidate) {
      await PC.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  } catch (err) {
    console.error("Signal error:", err);
  }
});

// mujte button handler
if (muteBtn) {
  muteBtn.addEventListener("click", () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        muteBtn.innerHTML = audioTrack.enabled
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
        muteBtn.classList.toggle("muted");
      }
    }
  });
}

//skip handler
if (skipBtn) {
  skipBtn.addEventListener("click", () => {
    if (isInitiator) {
    }
    if (!chatLog) return;
    setStrangerOverlay(true, "Searching for new stranger...");
    // startNewMatch('Skipping... Searching for a new stranger...');
    startNewMatch(true, "dsiufuh");
  });
}
