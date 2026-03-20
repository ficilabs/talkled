import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey! });

export const controlLedFunctionDeclaration: FunctionDeclaration = {
  name: "set_led_state",
  parameters: {
    type: Type.OBJECT,
    description: "Set the state of a specific Arduino LED (Red, Green, or Yellow).",
    properties: {
      led: {
        type: Type.STRING,
        enum: ["red", "green", "yellow"],
        description: "The LED to control.",
      },
      state: {
        type: Type.STRING,
        enum: ["ON", "OFF"],
        description: "The desired state of the LED.",
      },
    },
    required: ["led", "state"],
  },
};

export const controlAllLedsFunctionDeclaration: FunctionDeclaration = {
  name: "set_all_leds_state",
  parameters: {
    type: Type.OBJECT,
    description: "Set the state of all Arduino LEDs at once.",
    properties: {
      state: {
        type: Type.STRING,
        enum: ["ON", "OFF"],
        description: "The desired state for all LEDs.",
      },
    },
    required: ["state"],
  },
};

export const chatWithGemini = async (message: string, history: any[]) => {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      ...history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      { role: "user", parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: "You are an Arduino assistant for a Wokwi simulation. The user is viewing a Wokwi project (https://wokwi.com/projects/457692404333644801). You are connected to HiveMQ MQTT (broker.hivemq.com). When you control LEDs using the tools, you also publish the state to MQTT topics like 'arduino/simulator/leds/red'. You can control individual LEDs or all of them at once. If the user asks to turn off/on 'all' LEDs, use the 'set_all_leds_state' tool. Be helpful and concise.",
      tools: [{ functionDeclarations: [controlLedFunctionDeclaration, controlAllLedsFunctionDeclaration] }],
    },
  });

  return response;
};
