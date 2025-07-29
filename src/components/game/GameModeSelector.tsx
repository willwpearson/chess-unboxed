'use client';

import React from 'react';
import Link from 'next/link';

export function GameModeSelector() {
  const modes = [
    {
      id: 'bot',
      title: 'Play vs Bot',
      description: 'Challenge AI opponents with different difficulty levels',
      icon: '🤖',
      href: '/play/bot',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    },
    {
      id: 'multiplayer',
      title: 'Multiplayer',
      description: 'Create or join a lobby to play against other players',
      icon: '👥',
      href: '/lobby',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
    },
    {
      id: 'endless',
      title: 'Endless Mode',
      description: 'Test your skills - one loss and you are out!',
      icon: '♾️',
      href: '/play/endless',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {modes.map((mode) => (
        <Link
          key={mode.id}
          href={mode.href}
          className={`block p-6 rounded-lg border-2 transition-all duration-200 ${mode.color}`}
        >
          <div className="text-center">
            <div className="text-4xl mb-4">{mode.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{mode.title}</h3>
            <p className="text-gray-600 text-sm">{mode.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
