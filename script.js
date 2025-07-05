<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>
<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>

<script>
  const config = {
    apiKey: "AIzaSyDxTN6oRxNKUAJ0eVUZucumAALeBBG72hk",
    authDomain: "vcall-5f220.firebaseapp.com",
    databaseURL: "https://vcall-5f220-default-rtdb.firebaseio.com",
    projectId: "vcall-5f220",
    storageBucket: "vcall-5f220.appspot.com",
    messagingSenderId: "679349443110",
    appId: "1:679349443110:web:b44818bb14dffafcec24e7"
  };
  firebase.initializeApp(config);
  const auth = firebase.auth(), db = firebase.database();

  let username = "", peer = null, currentCall = null, localStream = null;
  let isMuted = false;

  const ringtone = document.getElementById("ringtone");

  auth.onAuthStateChanged(user => {
    if (user) startApp(user);
  });

  function login() {
    const email = emailInput.value, pass = passwordInput.value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => authMsg.innerText = e.message);
  }

  function signup() {
    const email = emailInput.value, pass = passwordInput.value;
    auth.createUserWithEmailAndPassword(email, pass).catch(e => authMsg.innerText = e.message);
  }

  function startApp(user) {
    document.getElementById("loginView").classList.add("hidden");
    document.getElementById("homeView").classList.remove("hidden");

    username = user.email.split('@')[0];
    document.getElementById("title").innerText = username;

    peer = new Peer(username, { host: '0.peerjs.com', port: 443, secure: true });

    peer.on('open', () => {
      db.ref("users/" + username).set(true);
      db.ref("users/" + username).onDisconnect().remove();
      loadUsers();

      db.ref("calls/" + username).on("value", snap => {
        if (snap.exists()) {
          const caller = snap.val().from;
          document.getElementById("callFrom").innerHTML = `📞 Call from <b>${caller}</b>`;
          document.getElementById("incoming").classList.remove("hidden");
          ringtone.play().catch(() => {});
        }
      });
    });

    peer.on("call", call => { window.pendingCall = call; });
  }

  function loadUsers() {
    db.ref("users").on("value", snap => {
      const usersList = document.getElementById("users");
      usersList.innerHTML = "";
      snap.forEach(child => {
        const user = child.key;
        if (user !== username) {
          const li = document.createElement("li");
          li.innerHTML = `
            <div><img class="avatar" src="https://ui-avatars.com/api/?name=${user}">${user}</div>
            <button onclick="startCall('${user}')">Call</button>`;
          usersList.appendChild(li);
        }
      });
    });
  }

  function startCall(target) {
    requestMedia().then(stream => {
      localStream = stream;
      showVideo(stream, 'localVideo');
      db.ref("calls/" + target).set({ from: username });

      const call = peer.call(target, stream);
      call.on("stream", remote => {
        showVideo(remote, 'remoteVideo');
        showCallUI();
      });

      currentCall = call;
    });
  }

  function acceptCall() {
    ringtone.pause(); ringtone.currentTime = 0;
    requestMedia().then(stream => {
      localStream = stream;
      showVideo(stream, 'localVideo');
      window.pendingCall.answer(stream);
      window.pendingCall.on("stream", remote => {
        showVideo(remote, 'remoteVideo');
        showCallUI();
      });
      currentCall = window.pendingCall;
      db.ref("calls/" + username).remove();
      document.getElementById("incoming").classList.add("hidden");
    });
  }

  function rejectCall() {
    ringtone.pause(); ringtone.currentTime = 0;
    db.ref("calls/" + username).remove();
    document.getElementById("incoming").classList.add("hidden");
  }

  function endCall() {
    if (currentCall) currentCall.close();
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    document.getElementById("callView").classList.add("hidden");
    document.getElementById("homeView").classList.remove("hidden");
  }

  function showCallUI() {
    document.getElementById("homeView").classList.add("hidden");
    document.getElementById("callView").classList.remove("hidden");
  }

  function showVideo(stream, id) {
    const video = document.getElementById(id);
    video.srcObject = stream;
    video.play();
  }

  function requestMedia() {
    return navigator.mediaDevices.getUserMedia({
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false
      }
    });
  }

  function toggleMute() {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = isMuted;
      isMuted = !isMuted;
    }
  }

  function toggleSpeaker() {
    const remote = document.getElementById("remoteVideo");
    remote.setSinkId?.("default").catch(() => {});
  }
</script>
</body>
</html>
