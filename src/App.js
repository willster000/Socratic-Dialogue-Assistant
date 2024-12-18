import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css"; // Ensure this line is present to import the new styles

const App = () => {
  const API_KEY = process.env.REACT_APP_API_KEY;
  const API_URL = "https://api.openai.com/v1/chat/completions";

  const [conversation, setConversation] = useState([
    {
      role: "system",
      content:
        "You are a Socratic dialogue partner. You will engage the user in a thoughtful exploration of their worldview...",
    },
  ]);

  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finalArticle, setFinalArticle] = useState("");
  const [conversationStarted, setConversationStarted] = useState(false);

  const chatContainerRef = useRef(null);

  const sendMessage = async (newConversation) => {
    setLoading(true);
    try {
      const response = await axios.post(
        API_URL,
        {
          model: "gpt-4o-mini",
          messages: newConversation,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error fetching response:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async () => {
    const initialMessage = {
      role: "assistant",
      content: "What is one view you hold strongly?",
    };

    const updatedConversation = [...conversation, initialMessage];
    setConversation(updatedConversation);
    setMessages([...messages, { type: "assistant", content: initialMessage.content }]);
    setConversationStarted(true);
  };

  const handleSend = async () => {
    if (!userInput) return;

    const updatedConversation = [
      ...conversation,
      { role: "user", content: userInput },
    ];
    setConversation(updatedConversation);
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "user", content: userInput },
    ]);
    setUserInput("");

    const assistantReply = await sendMessage(updatedConversation);

    if (assistantReply) {
      const newConversation = [
        ...updatedConversation,
        { role: "assistant", content: assistantReply },
      ];
      setConversation(newConversation);
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "assistant", content: assistantReply },
      ]);
    }

    // Scroll to the bottom of the chat container
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleFinalize = async () => {
    const finalPrompt = {
      role: "system",
      content: `You are an editor. Take all the user’s responses... Only produce the article text.`,
    };

    const userContent = conversation
      .filter((msg) => msg.role === "user")
      .map((msg) => msg.content)
      .join("\n\n");

    const finalConversation = [finalPrompt, { role: "user", content: userContent }];
    const article = await sendMessage(finalConversation);
    if (article) setFinalArticle(article);
  };

  return (
    <div className="app-container">
      <h1>Socratic Dialogue Assistant</h1>
      {!conversationStarted ? (
        <div className="control-buttons">
          <button onClick={handleStartConversation} disabled={loading}>
            {loading ? "Starting..." : "Start Conversation"}
          </button>
        </div>
      ) : (
        <>
          <div ref={chatContainerRef} className="chat-container">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                <strong>{msg.type === "user" ? "You: " : "Assistant: "}</strong>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="input-bar">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your response here..."
              disabled={!conversationStarted || loading}
            />
            <button onClick={handleSend} disabled={!conversationStarted || loading}>
              {loading ? "Loading..." : "Send"}
            </button>
          </div>
          <div className="control-buttons">
            <button onClick={handleFinalize} disabled={loading || !messages.length}>
              Finalize Article
            </button>
          </div>
        </>
      )}
      {finalArticle && (
        <div className="final-article">
          <h2>Final Article</h2>
          <pre>{finalArticle}</pre>
        </div>
      )}
    </div>
  );
};

export default App;
