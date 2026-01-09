import { ChatContainer } from '@/components/chat';

export const metadata = {
  title: 'Chat | Voice Assistant',
  description: 'Chat with your AI assistant',
};

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatContainer />
    </div>
  );
}
