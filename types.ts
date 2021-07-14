import { EventEmitter } from '@billjs/event-emitter';
import React, { Dispatch, FC, ReactElement } from 'react';

export type ChatbotHistory = ChatbotStep & { key: string };
// chat bot internal states that components needs
export interface ChatbotState {
  restart: () => void;
  activeKey: string;
  setActiveKey: React.Dispatch<React.SetStateAction<string>>;
  messages: ReactElement[];
  setMessages: Dispatch<React.SetStateAction<ReactElement[]>>;
  appHistory: ChatbotHistory[];
  setAppHistory: Dispatch<React.SetStateAction<ChatbotHistory[]>>;
  internalState: Record<string, any>;
  setInternalState: Dispatch<React.SetStateAction<any>>;
  initialStepKey?: string;
  emitter: EventEmitter;
  // funcs
  scrollToBottom: () => void;
  sendMessage: (stepToAdd: ChatbotStep) => Promise<any>;
  handleFormSubmit: (payload?: any) => void;
  waitForAnEvent: (eventName: string) => Promise<any>;
  waitForUserResponse: () => Promise<any>;
  cancelWaitForUserResponse: () => void;
  popLastMessage: () => void;
  inputIsActive: boolean;
  setInputIsActive: Dispatch<React.SetStateAction<boolean>>;
}

export type ChatbotWidgetComponent = FC<ChatbotState & Record<string, any>>;
// components that chat bot use to render steps
export interface ChatbotWidget {
  type: string;
  Component: ChatbotWidgetComponent;
}

// determine which component to render
export interface ChatbotStep {
  type?: string;
  mapStateToProps?: ChatbotMapStateToProps;
  Component?: ChatbotWidgetComponent;
  [key: string]: any;
}

// props that chat bot get
export interface ChatbotPropTypes {
  steps: Record<string, ChatbotStep>;
  widgets?: ChatbotWidget[];
  initialStepKey?: string;
  onEnd?: ChatbotOnEnd;
}

// Functions
export type ChatbotMapStateToProps = (
  ChatState: ChatbotState
) => Record<string, any>;

//  when activeKey === "END"  this func excute
export type ChatbotOnEnd = (ChatState: ChatbotState) => void;
