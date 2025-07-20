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
