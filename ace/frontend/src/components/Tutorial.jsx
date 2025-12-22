import { Steps } from "intro.js-react";

export default function Tutorial({ run, setRun }) {
  const steps = [
    {
      title:"Welcome to ACE!",
      element:"body",
      intro: "This is an AI Client to simulate an engineering firm",
    },
    {
      element: ".chat-window",
      intro: "This is the chat window where you can scroll to see previous chats.",
    },
    {
      element: ".input-area",
      intro: "Use this area to type your questions.",
    },
    {
      element: ".send-message",
      intro: "Click here to send your question.",
    },
    {
      element: ".change-persona",
      intro: "Click here and all available personas will pop up.",
    },
    {
      element: ".download-pdf",
      intro:
        "Here you can dowload the chat history for submission",
      position: "left", 
    },
  ];

  return (
    <Steps
      enabled={run}
      steps={steps}
      initialStep={0}
      onExit={() => setRun(false)}
      options={{
        hidePrev:true,
        showProgress: true,
        showBullets: false,
        showStepNumbers: true,
        exitOnOverlayClick: false,
        nextLabel: "Next",
        prevLabel: "Back",
        doneLabel: "Finish",
        skipLabel: "X",
      }}
    />
  );
}
