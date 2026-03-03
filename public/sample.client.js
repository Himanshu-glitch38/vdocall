const socket = io();

const statusDiv = document.getElementById("status");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let pc = null;
let partnerId = null;
let localStream = null;
let isInitiator = false;

/* ---------------- GET CAMERA + MIC ---------------- */

async function initMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localVideo.srcObject = localStream;
  } catch (err) {
    alert("Camera and microphone permission required.");
    console.error(err);
  }
}

initMedia();

/* ---------------- SOCKET EVENTS ---------------- */

socket.on("waiting", () => {
  statusDiv.innerText = "⏳ Waiting for a stranger...";
});

socket.on("matched", (id) => {
  partnerId = id;
  isInitiator = true;
  statusDiv.innerText = "✅ Stranger Connected!";
  createPeer();
});

socket.on("signal", async ({ from, data }) => {
  if (!pc) {
    isInitiator = false;
    partnerId = from;
    createPeer();
  }

  try {
    if (data.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

      if (data.sdp.type === "offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("signal", {
          to: from,
          data: { sdp: answer }
        });
      }
    }

    if (data.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  } catch (err) {
    console.error("Signal error:", err);
  }
});

socket.on("partner-disconnected", () => {
  statusDiv.innerText = "❌ Stranger left. Waiting...";
  cleanupPeer();
});

/* ---------------- CREATE PEER ---------------- */

function createPeer() {
  if (pc) return; // prevent duplicate

  pc = new RTCPeerConnection({
    iceServers: [
      // Google STUN
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" }
    ]
  });

  // Add local tracks
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  // Remote stream
  pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate && partnerId) {
      socket.emit("signal", {
        to: partnerId,
        data: { candidate: event.candidate }
      });
    }
  };

  // Connection state monitoring
  pc.onconnectionstatechange = () => {
    if (
      pc.connectionState === "disconnected" ||
      pc.connectionState === "failed" ||
      pc.connectionState === "closed"
    ) {
      cleanupPeer();
    }
  };

  // Create offer if initiator
  if (isInitiator) {
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        socket.emit("signal", {
          to: partnerId,
          data: { sdp: pc.localDescription }
        });
      })
      .catch(console.error);
  }
}

/* ---------------- CLEANUP ---------------- */

function cleanupPeer() {
  if (pc) {
    pc.close();
    pc = null;
  }

  remoteVideo.srcObject = null;
  partnerId = null;
  isInitiator = false;
}

/* ---------------- NEXT STRANGER ---------------- */

function nextStranger() {
  cleanupPeer();
  statusDiv.innerText = "🔄 Finding new stranger...";
  socket.emit("next");
}