// app/attractions.tsx
import React from 'react';
import ChatScreen from '../components/ChatScreen';

export default function AttractionsScreen() {
    return (
        <ChatScreen
            category="attractions"
            title="景點助手"
            placeholder="描述你拍的景點、建築或海報，想知道什麼？"
        />
    );
}
