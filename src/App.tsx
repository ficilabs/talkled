/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, Lightbulb, MessageSquare, RefreshCcw, Wifi, WifiOff, Play, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import mqtt from 'mqtt';
import { LedState, Message, ArduinoState } from './types';
import { chatWithGemini } from './services/gemini';

const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const MQTT_TOPIC_BASE = 'arduino/simulator/leds';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Hello! I've loaded the Wokwi Arduino project for you. I'm also connected to HiveMQ MQTT. You can interact with the simulation directly, and I'll publish LED commands to MQTT!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null);
  const [mqttStatus, setMqttStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [showTutorial, setShowTutorial] = useState(true);
  const [arduino, setArduino] = useState<ArduinoState>({
    leds: {
      red: { state: LedState.OFF, color: "#ef4444", pin: 13 },
      yellow: { state: LedState.OFF, color: "#eab308", pin: 12 },
      green: { state: LedState.OFF, color: "#22c55e", pin: 11 },
    }
  });
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // MQTT Setup
  useEffect(() => {
    console.log('Attempting to connect to MQTT...');
    const client = mqtt.connect(MQTT_BROKER, {
      clientId: `ais_chat_${Math.random().toString(16).slice(2, 12)}`, // Longer, more unique ID
      clean: true,
      connectTimeout: 30000, // 30 seconds timeout
      reconnectPeriod: 5000, // Wait 5s between retries to avoid spamming
      keepalive: 60,
      rejectUnauthorized: false,
    });

    client.on('connect', () => {
      console.log('✅ Connected to HiveMQ MQTT Broker');
      setMqttStatus('connected');
    });

    client.on('reconnect', () => {
      console.log('🔄 Reconnecting to MQTT...');
      setMqttStatus('connecting');
    });

    client.on('error', (err) => {
      console.error('❌ MQTT Connection Error:', err.message);
      setMqttStatus('disconnected');
    });

    client.on('offline', () => {
      console.log('⚠️ MQTT Client is offline');
      setMqttStatus('disconnected');
    });

    client.on('close', () => {
      console.log('🚪 MQTT Connection closed');
      setMqttStatus('disconnected');
    });

    setMqttClient(client);

    return () => {
      if (client) {
        client.end();
      }
    };
  }, []);

  const publishLedState = (led: string, state: LedState) => {
    if (mqttClient && mqttStatus === 'connected') {
      const topic = `${MQTT_TOPIC_BASE}/${led}`;
      // Send plain text "ON" or "OFF" to match Arduino code
      const payload = state; 
      mqttClient.publish(topic, payload, { qos: 0, retain: false }, (error) => {
        if (error) console.error('MQTT Publish Error:', error);
        else console.log(`MQTT Published: ${topic} -> ${payload}`);
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatWithGemini(userMessage, messages);
      
      let modelText = response.text || "";
      const functionCalls = response.functionCalls;
      
      if (functionCalls) {
        const actions: string[] = [];
        
        for (const call of functionCalls) {
          if (call.name === "set_led_state") {
            const ledKey = call.args.led as keyof ArduinoState['leds'];
            const newState = call.args.state as LedState;
            
            setArduino(prev => ({
              ...prev,
              leds: {
                ...prev.leds,
                [ledKey]: { ...prev.leds[ledKey], state: newState }
              }
            }));

            publishLedState(ledKey, newState);
            actions.push(`${ledKey} LED ${newState.toLowerCase()}`);
          } else if (call.name === "set_all_leds_state") {
            const newState = call.args.state as LedState;
            
            setArduino(prev => {
              const newLeds = { ...prev.leds };
              Object.keys(newLeds).forEach(key => {
                const k = key as keyof ArduinoState['leds'];
                newLeds[k] = { ...newLeds[k], state: newState };
                publishLedState(k, newState);
              });
              return { ...prev, leds: newLeds };
            });
            
            actions.push(`all LEDs ${newState.toLowerCase()}`);
          }
        }

        if (!modelText && actions.length > 0) {
          modelText = `OK, I've turned ${actions.join(' and ')} and published the commands to MQTT.`;
        }
      }

      setMessages(prev => [...prev, { role: "model", text: modelText }]);
    } catch (error) {
      console.error("Error calling Gemini:", error);
      setMessages(prev => [...prev, { role: "model", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#141414] font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Tutorial Popup */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-[#141414]/10"
            >
              <div className="p-6 border-b border-[#141414]/5 flex justify-between items-center bg-blue-600 text-white">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Quick Tutorial
                </h3>
                <button 
                  onClick={() => setShowTutorial(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Play className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">Step 1: Start Simulation</h4>
                    <p className="text-xs text-[#141414]/60 leading-relaxed">
                      Click the <span className="text-green-600 font-bold">Green Play</span> button inside the Wokwi simulator on the right to start the Arduino code.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">Step 2: Start Chatting</h4>
                    <p className="text-xs text-[#141414]/60 leading-relaxed">
                      Type commands in the chat like <span className="italic">"Turn on red LED"</span>. I'll publish them to MQTT and control the simulation!
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowTutorial(false)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  Got it, let's go!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col bg-[#E4E3E0] h-[50vh] md:h-screen border-r border-[#141414]/10">
        {/* Chat Header */}
        <div className="p-4 border-b border-[#141414]/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold">MCP Chatbot</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] text-[#141414]/60 uppercase tracking-widest">Connected</span>
                </div>
                <div className="w-px h-2 bg-[#141414]/10"></div>
                <div className="flex items-center gap-1">
                  {mqttStatus === 'connected' ? (
                    <Wifi className="w-3 h-3 text-blue-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-[10px] uppercase tracking-widest ${mqttStatus === 'connected' ? 'text-blue-500' : 'text-red-500'}`}>
                    MQTT: {mqttStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setMessages([{ role: "model", text: "Hello! I'm connected to HiveMQ MQTT. You can send LED commands, and I'll publish them to MQTT!" }])}
            className="p-2 hover:bg-[#f5f5f4] rounded-full transition-colors"
            title="Reset Chat"
          >
            <RefreshCcw className="w-4 h-4 text-[#141414]/40" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20' 
                    : 'bg-white text-[#141414] rounded-tl-none border border-[#141414]/5 shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-[#141414]/5 flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#141414]/20 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[#141414]/20 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-[#141414]/20 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div id="chat-input-area" className="p-4 bg-white border-t border-[#141414]/10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command (e.g., 'turn on red led')..."
              className="flex-1 bg-[#f5f5f4] border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-2 text-[10px] text-center text-[#141414]/40 uppercase tracking-widest font-medium">
            Powered by Gemini 3 Flash • MQTT via HiveMQ
          </div>
        </div>
      </div>

      {/* Sidebar / Simulator Area */}
      <div className="w-full md:w-1/2 lg:w-2/3 p-6 flex flex-col items-center justify-center bg-white border-b md:border-b-0 border-[#141414]/10">
        {/* Wokwi Iframe */}
        <div id="wokwi-container" className="relative w-full max-w-4xl aspect-video bg-[#1a1a1a] rounded-2xl shadow-2xl border-4 border-[#141414]/10 overflow-hidden">
          <iframe
            src="https://wokwi.com/projects/457692404333644801?embed=1"
            className="w-full h-full border-none"
            title="Wokwi Arduino Project"
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          ></iframe>
        </div>

        {/* Instructions */}
        <div className="mt-6 max-w-md text-center text-[#141414]/50 text-sm italic">
          "This is a live Wokwi simulation. You can interact with the components directly in the frame."
        </div>
      </div>
    </div>
  );
}
