import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { debounce } from "lodash"; 
import "bootstrap/dist/css/bootstrap.min.css";
import "./app.css";
import "./style.css";
import {useSelector} from 'react-redux';
import { useDispatch } from "react-redux";
import {toggleTheme} from './store/themeslice';

//const socket = io("http://127.0.0.1:5000");

const users = {
  John: "https://randomuser.me/api/portraits/men/1.jpg",
  Sam: "https://randomuser.me/api/portraits/men/2.jpg",
  Joyce: "https://randomuser.me/api/portraits/women/1.jpg",
  Jin: "https://randomuser.me/api/portraits/men/3.jpg",
};

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
  const getAvatar = (username) => users[username] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const [newAvatar, setNewAvatar] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleSaveProfile = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/updateProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: newUsername,
          avatar: newAvatar,
        }),
      });
  
      const data = await response.json();
  
      if (data.message === "Profile updated") {
        alert("Profile updated successfully");
  
        localStorage.setItem("username", newUsername);
        localStorage.setItem("avatar", newAvatar);
      } else {
        alert("Failed to update profile: " + data.message);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile: " + error.message);
    }
  };
  

  const toggleMessageOptions = (index) => {
    setDisplayedMessages((prevMessages) =>
      prevMessages.map((msg, i) => ({
        ...msg,
        showOptions: i === index ? !msg.showOptions : false,
      }))
    );
  };
  
  useEffect(() => {
    socket.emit("joinRoom", { username: currentUser, room: "general" });

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
      token: token, // send token to backend
    },
    transports: ["websocket"],
  });
  
socket.on("connect", () => {
  console.log("Connected to WebSocket");
});

// Handle the connection and message sending as before


  const formatMessageText = (text) =>
    text.split("\n").map((str, i) => (
      <span key={i}>
        {str}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));


  return (
<div className={`chat-container ${theme ? "dark" : "light"}`}>

     <h5 className={`text-left border-bottom pb-2 ${theme ? "text-white" : "text-dark"}`}>
  Project Communications
</h5>
<div>
  <button onClick ={() => setIsProfileModalOpen(true)}>
    updated profile
  </button>
  {isProfileModalOpen && (
  <div className="modal">
    <div className="modal-content position-relative">
      <span className="close" onClick={() => setIsProfileModalOpen(false)}>&times;</span>
      <h2>Update Profile</h2>
      <input
        type="text"
        placeholder="New Username"
        value={newUsername}
        onChange={(e) => setNewUsername(e.target.value)}
      />
      <input
        type="text"
        placeholder="New Avatar URL"
        value={newAvatar}
        onChange={(e) => setNewAvatar(e.target.value)}
      />
      <button onClick={handleSaveProfile}>Save</button>
    </div>
  </div>
)}
</div>
    <div className="d-flex justify-content-end mb-2">
        <button 
        className="btn btn-outline-secondary"
        onClick={() => dispatch(toggleTheme())}
        >
          switch to {theme ? "Light" : "Dark"} mode
        </button>
      </div>
      {loadingInitial ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {/* <div className="user-toggle mb-2">
            <button
              className="btn btn-primary"
              onClick={() => setCurrentUser(currentUser === "John" ? "Sam" : "John")}
            >
              Switch to {currentUser === "John" ? "Sam" : "John"}
            </button>
          </div> */}

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
          <img src={msg.avatar} alt={msg.user} className="avatar avatar-sm" />
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

          {/* {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.map((user, index) => (
                <div key={index} className="typing-user">
                  <img src={users[user]} alt={user} className="avatar avatar-sm" />
                  <span>{user} is typing...</span>
                </div>
              ))}
            </div> */}
          

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