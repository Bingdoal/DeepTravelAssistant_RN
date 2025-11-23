// app/menu.tsx
import React from 'react';
import ChatScreen from '../components/ChatScreen';

export default function MenuScreen() {
    return (
        <ChatScreen
            category="menu"
            title="菜單助手"
            placeholder="描述菜單、餐點或用餐情境..."
        />
    );
}
