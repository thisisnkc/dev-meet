export const genRandomMeetingId = () => {
  return Math.random().toString(36).substring(2, 9);
};

export const avatarOptions: string[] = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/men/75.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/men/86.jpg",
];

export const genSixDigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

export const joinMeeting = (meetingId?: string) => {
  if (!meetingId) meetingId = genRandomMeetingId();
  const meetingUrl = `/meeting/${meetingId}`;

  const fullUrl = `${window.location.origin}${meetingUrl}`;

  window.open(fullUrl, "_blank");
};

export const genJitsiTokenPayload = (email?: string, displayName?: string) => {
  return {
    context: {
      user: {
        name: displayName || "Host",
        email,
      },
    },
    aud: process.env.MEET_APP_ID,
    iss: process.env.MEET_APP_ID,
    sub: "meet.jitsi", //** upgraded to the latest version of jitsi which takes 'meet.jisti' as sub
    room: "*",
  };
};
