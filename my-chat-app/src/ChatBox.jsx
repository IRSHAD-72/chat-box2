import React, { useState, useEffect, useRef } from "react";
//import { faker } from "@faker-js/faker";
import "bootstrap/dist/css/bootstrap.min.css";
import "./app.css";
import "./style.css";

const users = {
  John: "https://randomuser.me/api/portraits/men/1.jpg",
  Sam: "https://randomuser.me/api/portraits/men/2.jpg",
  Joyce: "https://randomuser.me/api/portraits/women/1.jpg",
  Jin: "https://randomuser.me/api/portraits/men/3.jpg",
};

const sampleMessages = [
  {
    user: "John",
    text: "Hello, I'm John. \n How can I help you today?",
    time: "08:55",
    avatar: users["John"],
  },
  {
    user: "Sam",
    text: "Hi, John! \n I need more information about the Developer Plan.",
    time: "08:56",
    avatar: users["Sam"],
  },
  {
    user: "John",
    text: "Are we meeting today?,\n Project has been already finished and I have results to show you.",
    time: "08:57",
    avatar: users["John"],
  },
  {
    user: "Joyce",
    text: "Well I am not sure. \n I have results to show you.",
    time: "08:59",
    avatar: users["Joyce"],
  },
  {
    user: "John",
    text: "The rest of the team is not here yet. maybe in an hour or so?",
    time: "09:00",
    avatar: users["John"],
  },
  {
    user: "Jin",
    text: "Have you faced any issues at the last phase of the project?",
    time: "09:01",
    avatar: users["Jin"],
  },
  {
    user: "John",
    text: "Actually everything was fine. \n I'm very excited to show this to our team.",
    time: "09:00",
    avatar: users["John"],
  },
];

const MESSAGES_PER_PAGE = 30;
 
const fakeApiFetchMessages = () => {
  return new Promise((resolve) => { 
    setTimeout(() => {
      const messages = Array.from({ length: 10000 }, (_, i) => {
        const user = sampleMessages[i % sampleMessages.length].user;
        return {
          user,
          text: sampleMessages[i % sampleMessages.length].text,
          time: sampleMessages[i % sampleMessages.length].time,
          avatar: users[user],
        };
      });
      resolve(messages);
    }, 1500);
  });
};
// const fakeApiFetchMessages = () => {
const ChatBox = () => {
  const [allMessages, setAllMessages] = useState([]);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState("John");

  const chatBoxRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("chatMessages");
    if (saved) {
      const parsed = JSON.parse(saved);
      setAllMessages(parsed);
      setDisplayedMessages(parsed.slice(-MESSAGES_PER_PAGE));
      setLoadingInitial(false);
    } else {
      (async () => {       // Simulate API call
        const fakeMessages = await fakeApiFetchMessages(); 
        localStorage.setItem("chatMessages", JSON.stringify(fakeMessages));
        setAllMessages(fakeMessages);
        setDisplayedMessages(fakeMessages.slice(-MESSAGES_PER_PAGE));
        setLoadingInitial(false);
      })();}
  }, []);

  useEffect(() => {
    if (page === 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedMessages]);

  const handleScroll = () => {
    const chatBox = chatBoxRef.current;
    if (!chatBox || loadingMore) return;

    if (chatBox.scrollTop <= 0 && displayedMessages.length < allMessages.length) {
      const prevScrollHeight = chatBox.scrollHeight;
      setLoadingMore(true);

      setTimeout(() => {
        const newPage = page + 1;
        const start = Math.max(0, allMessages.length - newPage * MESSAGES_PER_PAGE);
        const end = allMessages.length - (newPage - 1) * MESSAGES_PER_PAGE;

        const newMessages = allMessages.slice(start, end);
        setDisplayedMessages((prev) => [...newMessages, ...prev]);
        setPage(newPage);
        setLoadingMore(false);

        // maintain scroll position
        setTimeout(() => {
          const newScrollHeight = chatBox.scrollHeight;
          chatBox.scrollTop = newScrollHeight - prevScrollHeight;
        }, 0);
      }, 2000); // simulate loading time
    }
  };

  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;
    chatBox.addEventListener("scroll", handleScroll);
    return () => chatBox.removeEventListener("scroll", handleScroll);
  }, [displayedMessages, loadingMore]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg = {
      user: currentUser,
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      avatar: users[currentUser],
    };

    const updatedAll = [...allMessages, newMsg];
    const updatedDisplayed = [...displayedMessages, newMsg];

    setAllMessages(updatedAll);
    setDisplayedMessages(updatedDisplayed);
    localStorage.setItem("chatMessages", JSON.stringify(updatedAll));
    setNewMessage("");

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const formatMessageText = (text) =>
    text.split("\n").map((str, i) => (
      <span key={i}>
        {str}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));

  return (
    <div className="chat-container">
      <h5 className="text-left border-bottom pb-2">Project Communications</h5>

      {loadingInitial ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          <div className="user-toggle mb-2">
            <button
              className="btn btn-primary"
              onClick={() => setCurrentUser(currentUser === "John" ? "Sam" : "John")}
            >
              Switch to {currentUser === "John" ? "Sam" : "John"}
            </button>
          </div>

          <ul className="chat-box chatContainerScroll" ref={chatBoxRef}>
            {loadingMore && (
              <li className="text-center py-2">
                <div className="spinner-border spinner-border-sm text-primary" role="status" />
              </li>
            )}

            {displayedMessages.map((msg, index) => (
              <li key={index} className={msg.user === "John" ? "chat-left" : "chat-right"}>
                {msg.user === "John" ? (
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
                ) : (
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
                )}
              </li>
            ))}
            <div ref={bottomRef} />
          </ul>

          <div className="chat-search-box">
            <textarea
              className="form-control"
              placeholder="Type your message here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
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
