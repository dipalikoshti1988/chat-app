const socket = io();
// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options - Query String
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

// server (emit) -> client (receive) --acknowledgement --> server
// client (emit) -> server (receive) --acknowledgement --> client

const autoscroll = () => {
  // Get new messsage element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible Height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled ?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("DisplayWelcomeMessage", Message => {
  console.log(Message);
  const html = Mustache.render(messageTemplate, {
    username: Message.username,
    message: Message.text,
    createdAt: moment(Message.createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", url => {
  console.log(url);
  //   const html = Mustache.render(locationTemplate, { locationurl: url });
  const html = Mustache.render(locationTemplate, {
    username: url.username,
    locationurl: url.url,
    createdAt: moment(url.createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  // console.log(room);console.log(users);
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  $sidebar.innerHTML = html;
});

// socket.on("countUpdated", count => {
//   console.log("The count has been updated!", count);
// });

// document.querySelector("#increment").addEventListener("click", () => {
//   console.log("Clicked to the terminal");
//   socket.emit("increment");
// });

$messageForm.addEventListener("submit", e => {
  e.preventDefault();
  //disable form
  $messageFormButton.setAttribute("disabled", "disabled");

  //var msg = document.getElementById("msg").value;
  const msg = e.target.elements.message.value;
  if (msg === "" || msg === null) {
    $messageFormButton.removeAttribute("disabled");
    alert("Please Enter Meessae");
    return false;
  }
  //   console.log(msg);
  socket.emit("sendmessage", msg, error => {
    // enable form button
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("The message was delivered!");
  });
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition(position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    // console.log(latitude, longitude);
    socket.emit("sendLocation", { latitude, longitude }, () => {
      $sendLocationButton.removeAttribute("disabled");
      console.log("Location Shared!");
    });
  });
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
