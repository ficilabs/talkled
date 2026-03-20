export enum LedState {
  ON = "ON",
  OFF = "OFF",
}

export interface Message {
  role: "user" | "model";
  text: string;
}

export interface LedData {
  state: LedState;
  color: string;
  pin: number;
}

export interface ArduinoState {
  leds: {
    red: LedData;
    green: LedData;
    yellow: LedData;
  };
}
