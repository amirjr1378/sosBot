import { EventEmitter } from '@billjs/event-emitter';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import {
  ChatbotHistory,
  ChatbotPropTypes,
  ChatbotState,
  ChatbotStep,
  ChatbotWidget,
} from './types';

export function useChatBot(props: ChatbotPropTypes) {
  //  Variables
  const {
    steps,
    widgets = [],
    initialStepKey = Object.keys(steps)[0],
    onEnd,
  } = props;
  const [activeKey, setActiveKey] = useState<string>(initialStepKey); // keep track of current step
  const [messages, setMessages] = useState<ReactElement[]>([]); // all items will be rendered in messages
  const [appHistory, setAppHistory] = useState<ChatbotHistory[]>([]); // keep track of steps that has been passed
  const [internalState, setInternalState] = useState({}); // internal state to share between
  const emitter = useMemo(() => new EventEmitter(), []); // event handling like user submit sth
  const [inputIsActive, setInputIsActive] = useState(false); // disable and enable form input

  // all states that all steps has access to
  const chatState: ChatbotState = {
    restart,
    activeKey,
    setActiveKey,
    messages,
    setMessages,
    appHistory,
    setAppHistory,
    internalState,
    setInternalState,
    initialStepKey,
    scrollToBottom,
    sendMessage,
    emitter,
    handleFormSubmit,
    waitForUserResponse,
    popLastMessage,
    waitForAnEvent,
    inputIsActive,
    setInputIsActive,
  };

  // Functions
  function handleFormSubmit(payload: any) {
    setInputIsActive(false);
    emitter.fire('form_submission', payload);
  }

  async function waitForAnEvent(eventName: string) {
    setInputIsActive(true);
    return new Promise((resolve) => {
      emitter.once(eventName, (eventObj) => {
        resolve(eventObj.data);
      });
    });
  }

  async function waitForUserResponse() {
    return waitForAnEvent('form_submission');
  }

  function scrollToBottom() {
    const bottomScrollTag = document.querySelector('#bottom-scroll');
    if (bottomScrollTag)
      bottomScrollTag.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
  }

  function restart() {
    setActiveKey('');
    setAppHistory([]);
    setMessages([]);
    setInternalState({});
    setTimeout(() => {
      setActiveKey(initialStepKey);
    }, 50);
  }

  function sendMessage(step: ChatbotStep) {
    setAppHistory((state) => [
      ...state,
      Object.assign({}, step, { key: activeKey }),
    ]);
    // find the correct component to attach on messages
    const widget = widgets.find((reg) => reg.type === step.type);
    if (widget) {
      let widgetComponentProps = Object.assign({}, chatState, step);
      if (step.mapStateToProps) {
        widgetComponentProps = Object.assign(
          {},
          widgetComponentProps,
          step.mapStateToProps?.(chatState)
        );
      }
      if (widget.Component) {
        setMessages((state) => {
          return [
            ...state,
            <widget.Component
              {...widgetComponentProps}
              key={`Chatbot-messages-${state.length}`}
            />,
          ];
        });
      }
    } else {
      console.error(`widget with type: "${step.type}" not found`);
    }
    // if step has custom component itself
    if (step.Component) {
      const { Component } = step;
      setMessages((state) => {
        return [
          ...state,
          <Component {...chatState} key={`chatbot${state.length}`} />,
        ];
      });
    }
    // for multiple send message async await to be async
    return new Promise((resolve) => {
      setTimeout(() => resolve({}), step.delay * 2 || 800);
    });
  }

  function popLastMessage() {
    // slice(0,-1) everything but last element
    setMessages((state) => state.slice(0, -1));
  }

  // when messages get updated we should scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // when active key change messages should be updated
  useEffect(() => {
    // if active step doesnt exists
    if (activeKey === 'END') {
      if (onEnd && typeof onEnd === 'function') onEnd(chatState);
    }
    if (!steps[activeKey]) {
      console.error('component not found in chat bot');
      return;
    }
    sendMessage(steps[activeKey]);
  }, [activeKey]);

  // Effects
  return chatState;
}

// goal is register all of your widget at once then use created hook
export function generateChatbotWithAllWidgets(allWidgets: ChatbotWidget[]) {
  // accessible widget name is array of widget types
  return function (
    chatbotProps: ChatbotPropTypes,
    AccessibleWidgetNames?: string[]
  ) {
    let widgetsToPassToChatbot = allWidgets;
    if (
      AccessibleWidgetNames &&
      Array.isArray(AccessibleWidgetNames) &&
      AccessibleWidgetNames.length
    ) {
      widgetsToPassToChatbot = allWidgets.filter((widget) =>
        AccessibleWidgetNames.includes(widget.type)
      );
    }
    return useChatBot({
      ...chatbotProps,
      widgets: [...widgetsToPassToChatbot, ...(chatbotProps?.widgets || [])],
    });
  };
}
