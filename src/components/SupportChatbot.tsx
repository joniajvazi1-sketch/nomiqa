import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useTranslation } from "@/contexts/TranslationContext";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export const SupportChatbot = () => {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show button after scrolling 800px down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: t("chatWelcome"),
        },
      ]);
    }
  }, [isOpen, t]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-support`;
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          language 
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to start chat stream");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      // Add initial assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === "assistant") {
                  lastMessage.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("chatError"),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <>
      {/* Floating Chat Bubble - Below Buy Now Button */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-500 ${
          isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {!isOpen && (
          <div className="relative group">
            {/* Single subtle glow - matching Buy Now */}
            <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-xl opacity-50 group-hover:opacity-100 group-hover:blur-2xl transition-all duration-500" />
            
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="relative z-10 bg-deep-space/90 backdrop-blur-xl border border-neon-cyan/40 text-white hover:border-neon-cyan hover:bg-deep-space shadow-lg hover:shadow-neon-cyan/50 transition-all duration-300 font-light group-hover:scale-105 flex items-center gap-2"
            >
              <Bot className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-sm">{t("chatAskMe")}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-[90vw] max-w-md h-[600px] bg-background/95 backdrop-blur-xl border border-neon-cyan/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-background/60 backdrop-blur-sm p-4 border-b border-neon-cyan/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-neon-cyan/10 border border-neon-cyan/30">
                <Bot className="h-5 w-5 text-neon-cyan" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("chatTitle")}</h3>
                <p className="text-xs text-foreground/60">{t("chatSubtitle")}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-neon-cyan/10 border border-neon-cyan/30 text-foreground"
                      : "bg-white/5 border border-white/10 text-foreground/90"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl px-4 py-2.5">
                  <Loader2 className="h-5 w-5 animate-spin text-neon-cyan" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(t("chatQuickEsim"))}
                className="text-xs border-neon-cyan/30 hover:bg-neon-cyan/10"
              >
                {t("chatQuickEsim")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(t("chatQuickPay"))}
                className="text-xs border-neon-violet/30 hover:bg-neon-violet/10"
              >
                {t("chatQuickPay")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(t("chatQuickDevice"))}
                className="text-xs border-neon-coral/30 hover:bg-neon-coral/10"
              >
                {t("chatQuickDevice")}
              </Button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-neon-cyan/30">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder={t("chatPlaceholder")}
                className="bg-white/5 border-neon-cyan/30 focus:border-neon-cyan"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-neon-cyan/20 border border-neon-cyan/30 hover:bg-neon-cyan/30 transition-all"
              >
                <Send className="h-4 w-4 text-neon-cyan" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
