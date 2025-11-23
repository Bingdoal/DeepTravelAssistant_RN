// app/supermarket.tsx
import React from 'react';
import ChatScreen from '../components/ChatScreen';

export default function SupermarketScreen() {
    return (
        <ChatScreen
            category="supermarket"
            title="超市助手"
            placeholder="描述你拍的商品、零食或酒類，想了解什麼？"
        />
    );
}
