const socket = io();
const statusDiv = document.getElementById("status");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let pc;
let partnerId = null;
let localStream;

// Get camera & mic
async function initMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
  localVideo.srcObject = localStream;
}
initMedia();

// Waiting state
socket.on("waiting", () => {
  statusDiv.innerText = "⏳ Waiting for a stranger...";
});

// Matched
socket.on("matched", async (id) => {
  partnerId = id;
  statusDiv.innerText = "✅ Stranger Connected!";
  createPeer(true);
});

// Create WebRTC peer
function createPeer(isInitiator) {
  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", {
        to: partnerId,
        data: { candidate: event.candidate }
      });
    }
  };

  if (isInitiator) {
    pc.createOffer().then(offer => {
      pc.setLocalDescription(offer);
      socket.emit("signal", {
        to: partnerId,
        data: { sdp: offer }
      });
    });
  }
}

// Handle signaling
socket.on("signal", async ({ from, data }) => {
  if (!pc) createPeer(false);

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
});

// Partner left
socket.on("partner-disconnected", () => {
  statusDiv.innerText = "❌ Stranger left. Waiting...";
  remoteVideo.srcObject = null;
  if (pc) pc.close();
  pc = null;
});

// Next stranger button
function nextStranger() {
  if (pc) pc.close();
  remoteVideo.srcObject = null;
  socket.emit("next");
  statusDiv.innerText = "🔄 Finding new stranger...";
}
