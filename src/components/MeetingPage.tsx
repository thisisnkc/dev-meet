import { useEffect, useRef, useState } from "react";

interface Props {
  roomName: string;
  userName: string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function JitsiMeetingEmbed({ roomName, userName }: Props) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load the script only once
    if (window.JitsiMeetExternalAPI) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !jitsiContainerRef.current) return;

    const domain = "meet.jit.si";
    const options = {
      roomName,
      parentNode: jitsiContainerRef.current,
      width: "100%",
      height: "100%",
      userInfo: {
        displayName: userName,
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        DEFAULT_REMOTE_DISPLAY_NAME: "Guest",
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    return () => {
      api?.dispose?.();
    };
  }, [scriptLoaded, roomName, userName]);

  return <div className="w-full h-full bg-black" ref={jitsiContainerRef}></div>;
}
