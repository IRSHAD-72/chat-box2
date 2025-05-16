import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { debounce } from "lodash";
import "bootstrap/dist/css/bootstrap.min.css";
import "./app.css";
import "./style.css";
import {useSelector} from 'react-redux';
import { useDispatch } from "react-redux";
import {toggleTheme} from './store/themeslice';
import { useNavigate } from "react-router-dom";

const MESSAGES_PER_PAGE = 30;

const ChatBox = () => {
const [displayedMessages, setDisplayedMessages] = useState([]);
const [loadingInitial, setLoadingInitial] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
const [hasMore, setHasMore] = useState(true);
const [newMessage, setNewMessage] = useState("");
const [currentUser, setCurrentUser] = useState(() => localStorage.getItem("username") );
const [page, setPage] = useState(1);
const [typingUsers, setTypingUsers] = useState([]);
const [selectedMsgIndex, setSelectedMsgIndex] = useState(null);
const typingTimeoutRef = useRef(null); // ✅ Add this
const chatBoxRef = useRef(null);
const bottomRef = useRef(null);
const [showMenu, setShowMenu] = useState(false);
const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
const[isusernameModelOpen,setIsusernameModelOpen] = useState(false);
const[isPasswordModelOpen,setIsPasswordModelOpen] =useState(false);
const [newUsername, setNewUsername] = useState(currentUser);
const [newAvatar, setNewAvatar] = useState("");
const [oldPassword, setOldpassword] = useState("");
const [newPassword, setNewpassword] = useState("");
const navigate = useNavigate();
const [users, setUsers] = useState({});

// get avatar to backend
const getAvatar = (username) => {
  if (username === currentUser && newAvatar) {
    return newAvatar; // If user updated avatar in current session
  }
  return localStorage.getItem("avatar") || users[username] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
};


// login use effect
useEffect(() => {
const token = localStorage.getItem("token");
if (!token) {
window.location.href = "/login";
}
}, []);

// update profile

const handleSaveProfile = async (newUsername, newAvatar, oldPassword, newPassword) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:5000/api/auth/updateProfile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: newUsername,
        avatar: newAvatar,
        oldPassword,
        newPassword,
      }),
    });

    const data = await response.json(); // ✅ Parse response before using it

    if (data.message === "Profile updated successfully") {
      alert("Profile updated successfully");
      localStorage.setItem("username", newUsername);
      localStorage.setItem("avatar", newAvatar);
      setCurrentUser(newUsername);

      // 🔁 Update message avatars for current user
      setDisplayedMessages((prev) =>
        prev.map((msg) =>
          msg.user === newUsername ? { ...msg, avatar: newAvatar } : msg
        )
      );
    } else {
      alert(data.message || "Update failed");
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("Error updating profile");
  }
};


// prev msg show
const toggleMessageOptions = (index) => {
setDisplayedMessages((prevMessages) =>
prevMessages.map((msg, i) => ({
...msg,
showOptions: i === index ? !msg.showOptions : false,
}))
);
};

// typing indicator

useEffect(() => {
socket.emit("joinRoom",{ username: currentUser, room: "general" });


return () => {
  socket.off("typing");
  socket.off("stopTyping");
};


}, [currentUser]);

useEffect(() => {
socket.on("userTyping", (username) => {
setTypingUsers((prev) =>
prev.includes(username) ? prev : [...prev, username]
);
});


socket.on("userStoppedTyping", (username) => {
  setTypingUsers((prev) => prev.filter((user) => user !== username));
});

return () => {
  socket.off("userTyping");
  socket.off("userStoppedTyping");
};


}, []);

// load prew msg

useEffect(() => {
const loadInitialMessages = async () => {
const data = await fetchMessagesFromServer(1);
setDisplayedMessages(data);
setPage(2);
setHasMore(data.length === MESSAGES_PER_PAGE);
setLoadingInitial(false);


  setTimeout(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, 100);
};
loadInitialMessages();


}, []);

// fetch msg from database
const fetchMessagesFromServer = async (pageNum) => {
try {
const res = await fetch(`http://127.0.0.1:5000/api/messages?page=${pageNum}&limit=${MESSAGES_PER_PAGE}`);
const data = await res.json();
return data;
} catch (err) {
console.error("Error fetching messages:", err);
return [];
}
};

// scroll top feature

const handleScroll = async () => {
const chatBox = chatBoxRef.current;
if (!chatBox || loadingMore || !hasMore || chatBox.scrollTop > 0) return;


const prevScrollHeight = chatBox.scrollHeight;
setLoadingMore(true);

setTimeout(async () => {
  const olderMessages = await fetchMessagesFromServer(page);
  if (olderMessages.length < MESSAGES_PER_PAGE) setHasMore(false);

  setDisplayedMessages((prev) => [...olderMessages, ...prev]);
  setPage((prev) => prev + 1);
  setLoadingMore(false);

  setTimeout(() => {
    const newScrollHeight = chatBox.scrollHeight;
    chatBox.scrollTop = newScrollHeight - prevScrollHeight;
  }, 0);
}, 3000);


};

useEffect(() => {
const chatBox = chatBoxRef.current;
if (!chatBox) return;


chatBox.addEventListener("scroll", handleScroll);
return () => chatBox.removeEventListener("scroll", handleScroll);


}, [displayedMessages, loadingMore, hasMore]);

useEffect(() => {
socket.on("receiveMessage", (msg) => {
setDisplayedMessages((prev) => [...prev, msg]);
setTimeout(() => {
bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, 100);
});


return () => socket.off("receiveMessage");


}, []);

// current use send msg
const sendMessage = async () => {
if (!newMessage.trim()) return;


const newMsg = {
  user: currentUser,
  text: newMessage,
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  avatar: getAvatar(currentUser),

};
 // Immediately add message to local state
setDisplayedMessages((prev) => [...prev, newMsg]);

socket.emit("sendMessage", newMsg);
socket.emit("stopTyping");

setNewMessage("");
setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);


};

const handleTyping = () => {
if (typingTimeoutRef.current) {
clearTimeout(typingTimeoutRef.current);
}

socket.emit("typing");

typingTimeoutRef.current = setTimeout(() => {
  socket.emit("stopTyping");
}, 1000);


};

// user dellet msg

const handleDeleteMessage = async (messageId, index) => {
try {
socket.emit("deleteMessage", messageId); // emit to backend via socket
setDisplayedMessages((prev) => prev.filter((_, i) => i !== index));
} catch (error) {
console.error("Error deleting message:", error);
}
};
useEffect(() => {
socket.on("messageDeleted", (deletedMessageId) => {
setDisplayedMessages((prev) =>
prev.filter((msg) => msg._id !== deletedMessageId)
);
});


return () => socket.off("messageDeleted");


}, []);

const theme = useSelector((state) => state.theme.darkMode);
const dispatch = useDispatch();
useEffect(() => {
document.body.className = theme ? "dark-mode" : "light-mode";
}, [theme]);

// In your React frontend code

const token = localStorage.getItem("token");

const socket = io("http://localhost:5000", {
  auth: {
    token: localStorage.getItem("token"),
  },
  transports: ["websocket"],
});


socket.on("connect", () => {
console.log("Connected to WebSocket");
});

// logout
const handleLogout = () => {
// Clear user data (example: localStorage, tokens)
localStorage.removeItem("token");
navigate("/login"); // Redirect to login
};

// Handle the connection and message sending as before
const formatMessageText = (text) => {
const safeText = text || '';
const lines = safeText.split('\n');
return lines.map((line, index) => <div key={index}>{line}</div>);
};
console.log("currentUser", currentUser);
console.log("newAvatar", newAvatar);

const handleDeleteAccount = async () => {
const confirmDelete = window.confirm("Are you sure you want to delete your account and all messages?");
if (!confirmDelete) return;

const token = localStorage.getItem("token");

try {
const res = await fetch("[http://localhost:5000/api/auth/deleteAccount](http://localhost:5000/api/auth/deleteAccount)", {
method: "DELETE",
headers: {
Authorization: `Bearer ${token}`,
},
});


const data = await res.json();
if (data.message === "Account and all messages deleted successfully") {
  alert("Your account has been deleted.");
  localStorage.clear();
  window.location.href = "/register";
} else {
  alert(data.message || "Something went wrong");
}


} catch (err) {
console.error("Error deleting account:", err);
alert("Failed to delete account");
}
};

return (

<div className={`chat-container ${theme ? "dark" : "light"}`}>

<h5 className={`text-left border-bottom pb-2 ${theme ? "text-white" : "text-dark"}`}>
Project Communications
</h5><div className="mb-3 d-flex justify-content-end">
{/* Menu Button */}
<button className="btn btn-primary" onClick={() => setShowMenu(!showMenu)}>
Menu
</button>

{/* Menu Options \*/}
{showMenu && (

<div
className="position-absolute end-0 mt-2 p-3 bg-light border rounded shadow"
style={{ zIndex: 100 }}
>
{/* Close Menu Button */}
<span className="close" onClick={() => setShowMenu(false)}>&times;</span>

<button
className="btn btn-link d-block w-100 text-start"
onClick={() => {
setIsProfileModalOpen(true);
setShowMenu(false);
}}

>

Update Profile picture </button>
<button
className="btn btn-link d-block w-100 text-start"
onClick={() => {
setIsusernameModelOpen(true);
setShowMenu(false);
}}

>

Update Username </button>
<button
className="btn btn-link d-block w-100 text-start"
onClick={() => {
setIsPasswordModelOpen(true);
setShowMenu(false);
}}

>

Update Password </button>

<button
className="btn btn-link d-block w-100 text-start"
onClick={() => {
dispatch(toggleTheme());
setShowMenu(false);
}}

>

Switch to {theme ? "Light" : "Dark"} Mode </button>

<button onClick={handleDeleteAccount} className="btn btn-danger">
  Delete Account
</button>

<button
className="btn btn-link text-danger d-block w-100 text-start"
onClick={handleLogout}

>

Logout </button>

</div>
)}

{/* Profile Modal \*/}
{isProfileModalOpen && (

<div className="modal">
 <div className="modal-content position-relative">
   <span className="close" onClick={() => setIsProfileModalOpen(false)}>&times;</span>
   <h2>Update Profile picture</h2>
{/*preview image */}
<div className="text-center mb-3">
  {newAvatar ? (
    <img
      src={newAvatar}
      alt="Preview"
      className="rounded-circle"
      style={{ width: "100px", height: "100px" }}
    />
  ) : (
    <p>no image selected </p>
  )}
</div>
{/* File input */}
<input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }}
  />
{/* Save button */}
<button
  onClick={() =>
    handleSaveProfile(newUsername, newAvatar)}
    >save</button>

   </div>
</div>
)}
</div>

{/* Update Username Modal \*/}
{isusernameModelOpen && (

<div className="modal">
 <div className="modal-content position-relative">
    <span className="close" onClick={() => setIsusernameModelOpen(false)}>&times;</span>
    <h2>Update Username</h2>
    <input
      type="text"
      placeholder="New Username"
      value={newUsername}
      onChange={(e) => setNewUsername(e.target.value)}
    />
    <button


  onClick={() =>
    handleSaveProfile(newUsername)
  }
>
  Save
</button>


  </div>
</div>
)}

{/* Update Password Modal \*/}
{isPasswordModelOpen && (

<div className="modal">
  <div className="modal-content position-relative">
    <span className="close" onClick={() => setIsPasswordModelOpen(false)}>&times;</span>
    <h2>Update Password</h2>
    <input


  type="password"
  placeholder="Old Password"
  value={oldPassword}
  onChange={(e) => setOldpassword(e.target.value)}
/>
<input
  type="password"
  placeholder="New Password"
  value={newPassword}
  onChange={(e) => setNewpassword(e.target.value)}
/>
<button
  onClick={() =>
    handleSaveProfile(newUsername, newAvatar, oldPassword, newPassword)
  }
>
  Save
</button>


  </div>
</div>
)}


  {loadingInitial ? (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
      <div className="spinner-border text-primary" role="status" />
    </div>
  ) : (
    <>
      <ul className="chat-box chatContainerScroll" ref={chatBoxRef}>
        {loadingMore && (
          <li className="text-center py-2">
            <div className="spinner-border spinner-border-sm text-primary" role="status" />
          </li>
        )}


{displayedMessages.map((msg, index) => (

  <li
    key={index}
    className={`${msg.user === currentUser ? "chat-right" : "chat-left"} position-relative`}
    onClick={() => toggleMessageOptions(index)}
  >
    {msg.user === currentUser ? (
      <>
        <div className="chat-hour">
          {msg.time} <span className="fa fa-check-circle px-1" />
        </div>
        <div className="chat-text">{formatMessageText(msg.text)}</div>
        <div className="chat-avatar">
          <img src={msg.avatar} alt={msg.user} className="avatar avatar-sm" />
          <div className="chat-name">{msg.user}</div>
        </div>
      </>
    ) : (
      <>
        <div className="chat-avatar">
          <img src={ msg.avatar} alt={msg.user} className="avatar avatar-sm" />
          <div className="chat-name">{msg.user}</div>
        </div>
        <div className="chat-text">{formatMessageText(msg.text)}</div>
        <div className="chat-hour">
          {msg.time} <span className="fa fa-check-circle px-1" />
        </div>
      </>
    )}


{/* Show delete button only for own messages */}
{msg.user === currentUser && msg.showOptions && (
  <div className="message-options position-absolute">
    <button className="" onClick={() => handleDeleteMessage(msg._id, index)}>
      Delete
    </button>
  </div>
)}


  </li>
))}
        <div ref={bottomRef} />
      </ul>
      
      {typingUsers.length > 0 && (


  <div className="typing-indicator d-flex align-items-center gap-2 p-2">
    <div className="d-flex align-items-center">
      {typingUsers.map((user, index) => (
        <img
          key={index}
          src={users[user]}
          alt={user}
          className="avatar avatar-sm me-1"
          title={user}
        />
      ))}
    </div>
    <div className="typing-text">
      {typingUsers.length === 1
        ? `${typingUsers[0]} is typing`
        : `${typingUsers.slice(0, 2).join(" and ")}${typingUsers.length > 2 ? " and others" : ""} are typing`}
      <span className="typing-dots">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </div>
  </div>
)}

      <div className="chat-search-box">
        <textarea
          className="form-control"
          placeholder="Type your message here..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        ></textarea>
        <button className="input-group-btn btn" onClick={sendMessage}>
          SEND
        </button>
      </div>
    </>
  )}
</div>
);
};


export default ChatBox; 
