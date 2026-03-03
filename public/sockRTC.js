setTimeout(() =>{

const socket = io();
let isInitiator = false;
let PC;
const localVideo = document.getElementById("localVideo");
let localStream = null;
const remoteVideo = document.getElementById("remoteVideo");
let partner = null;

async function initMedia() {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
    } catch (err) {
    socket.disconnect();
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
    localVideo.srcObject = localStream;
    // logger.log("Creating new peer");
  
    PC = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" }
      ]
    });
  
    PC.ontrack = (event) => {
    //   logger.log("track received from partner")
      remoteVideo.srcObject = event.streams[0];
    };
  
    localStream.getTracks().forEach(track => {
      PC.addTrack(track, localStream);
    });
  
    PC.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          data: { candidate: event.candidate }
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
        .then(offer => PC.setLocalDescription(offer))
        .then(() => {
          socket.emit("signal", {
            data: { sdp: PC.localDescription }
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


socket.on('disconnect', () => {
    partner = null;
    cleanupPeer();
    console.log('Disconnected from the server');
    // socketConnectionText.innerHTML = "No";
    // logger.error("Disconnected from the server");
  });

  // waiting event handler
  socket.on("waiting", () => {
    partner = null;
    // logger.info("Waiting for a partner...");
  });

  socket.on("partner-disconnected", () => {
    partner = null;
    cleanupPeer();
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
            data: { sdp: answer }
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
  

  

}, 12000);